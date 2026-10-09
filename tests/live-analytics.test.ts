import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_URL='file::memory:';
import { all, get, putLead } from '../lib/db';
import { enroll, runDue, recordEvent } from '../lib/engine';
import { deliveryAttempts, runLiveDue, processSendGridEvents } from '../lib/delivery';
import { analytics, exportCSV } from '../lib/analytics';
import { sendNotice } from '../lib/delivery-feedback';
import { POST } from '../app/api/[...path]/route';
import { NextRequest } from 'next/server';
import type { Lead, Message } from '../lib/types';
function config(){Object.assign(process.env,{EMAIL_PROVIDER:'sendgrid',LIVE_EMAIL_ENABLED:'true',SENDGRID_SANDBOX:'false',SENDGRID_API_KEY:'test-key',FROM_EMAIL:'sender@example.test',APP_URL:'https://app.example.test',POSTAL_ADDRESS:'Test address',UNSUBSCRIBE_SECRET:'test-unsubscribe',CRON_SECRET:'test-cron',SENDGRID_WEBHOOK_PUBLIC_KEY:'test-key',ADMIN_PASSWORD:'test-password'});}
async function lead(id:string){const original=(await get<Lead>('leads','lead-1'))!;const value:Lead={...original,id,source:'serpapi',email:id+'@example.test',presence:{status:'no-owned-website-found',checkedAt:new Date().toISOString(),queries:[],traces:[],reason:'Test'},contactVerification:{status:'verified',email:id+'@example.test',provider:'hunter',identityConfirmed:true,source:'Test',verifiedAt:new Date().toISOString()}};await putLead(value);return value;}
test('live analytics separates accepted sends from demo, rejection, sandbox and uncertain attempts; signed-provider events populate metrics',async()=>{
 config();const original=globalThis.fetch;
 try{
  for(const [id,status] of [['analytics-accepted',202],['analytics-rejected',400],['analytics-unknown',500],['analytics-sandbox',202]] as const){
   const l=await lead(id),e=await enroll(l.id,'campaign-1');process.env.SENDGRID_SANDBOX=id.endsWith('sandbox')?'true':'false';
   globalThis.fetch=async()=>new Response(null,{status});const r=await runLiveDue(new Date(Date.now()+1000),'campaign-1',[e.id]);
   if(id.endsWith('accepted'))assert.equal(r.accepted,1);
   if(id.endsWith('rejected'))assert.equal(r.failed,1);
   if(id.endsWith('unknown'))assert.equal(r.unknown,1);
   if(id.endsWith('sandbox')){assert.equal(r.sandbox,1);assert.equal(r.failed,0);}
  }
  await enroll('lead-1','campaign-1');await runDue(new Date(Date.now()+1000),'campaign-1');
  const before=await analytics({source:'live',campaignId:'campaign-1'});
  const attempts=await deliveryAttempts();assert.ok(attempts.every(a=>typeof a.messageId==='string'&&typeof a.updatedAt==='string'));assert.equal(before.metrics.sent,1);assert.equal(before.metrics.delivered,0);assert.equal(before.attemptCounts.pending,1);assert.equal(before.attemptCounts.rejected,1);assert.equal(before.attemptCounts.unknown,1);assert.equal(before.attemptCounts.sandbox,1);assert.equal(before.outcomes.length,4);
  assert.ok((await analytics({source:'demo',campaignId:'campaign-1'})).metrics.sent>=1);
  const accepted=before.outcomes.find(o=>o.status==='accepted')!;const message=(await get<Message>('messages',accepted.messageId))!,timestamp=Math.ceil(new Date(message.sentAt).getTime()/1000);
  const events=['delivered','open','click'].map(event=>({sg_event_id:'live-analytics-'+event,handos_message_id:message.id,event,timestamp}));
  assert.equal((await processSendGridEvents(events)).inserted,3);assert.equal((await processSendGridEvents(events)).inserted,0);
  await recordEvent({externalId:'analytics-reply',messageId:message.id,type:'reply',occurredAt:new Date(timestamp*1000).toISOString()});
  await recordEvent({externalId:'analytics-booking',messageId:message.id,type:'booked-demo',revenue:150,occurredAt:new Date(timestamp*1000).toISOString()});
  const after=await analytics({source:'live',campaignId:'campaign-1'});assert.equal(after.metrics.sent,1);assert.equal(after.metrics.delivered,1);assert.equal(after.metrics.open,1);assert.equal(after.metrics.click,1);assert.equal(after.metrics.reply,1);assert.equal(after.metrics.booked,1);assert.equal(after.metrics.revenue,150);assert.equal(after.metrics.ctr,100);assert.equal(after.metrics.cost,after.breakdown[0].cost);assert.equal(after.attemptCounts.pending,0);assert.ok(after.tracking.lastWebhookAt);assert.equal(after.outcomes.find(o=>o.messageId===message.id)?.status,'delivered');
  assert.equal((await analytics({source:'live',from:'1999-01-01',to:'1999-01-02'})).metrics.sent,0);
  assert.match(await exportCSV({source:'live',campaignId:'campaign-1'}),/^date,sent,delivered/);
 }finally{globalThis.fetch=original;}
});
test('individual send endpoint contacts only the requested prospect and validates provider configuration',async()=>{
 config();const one=await lead('individual-one'),two=await lead('individual-two');await enroll(two.id,'campaign-2');const original=globalThis.fetch;const recipients:string[]=[];
 globalThis.fetch=async(_,init)=>{recipients.push(JSON.parse(String(init?.body)).personalizations[0].to[0].email);return new Response(null,{status:202});};
 const request=()=>new NextRequest('https://app.example.test/api/leads/'+one.id+'/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({campaignId:'campaign-2'})});
 try{const response=await POST(request(),{params:Promise.resolve({path:['leads',one.id,'send']})});assert.equal(response.status,200);const body=await response.json();assert.equal(body.accepted,1);assert.match(body.notice,/1 email was successfully submitted/);assert.deepEqual(recipients,[one.email]);
  process.env.LIVE_EMAIL_ENABLED='false';assert.equal((await POST(request(),{params:Promise.resolve({path:['leads',one.id,'send']})})).status,400);assert.equal(recipients.length,1);
 }finally{globalThis.fetch=original;}
});
test('feedback never calls uncertain, rejected, sandbox or simulated attempts a successful live send',()=>{
 assert.match(sendNotice({mode:'sendgrid',accepted:1}),/Delivery confirmation is pending/);
 for(const r of [{failed:1},{sandbox:1}])assert.match(sendNotice({mode:'sendgrid',...r}),/No email was submitted/);
 assert.match(sendNotice({mode:'sendgrid',unknown:1}),/No email submission was confirmed/);
 assert.match(sendNotice({mode:'sendgrid',scheduled:1,nextDueAt:'2026-10-11T17:55:20.566Z'}),/No email is due now/);
 assert.match(sendNotice({mode:'demo',sent:1}),/No real email was sent/);
});
