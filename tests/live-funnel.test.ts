import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
process.env.DATABASE_URL='file::memory:';
import { all, get, putLead } from '../lib/db';
import { enroll } from '../lib/engine';
import { deliveries, processSendGridEvents, runLiveDue, unsubscribeToken, validUnsubscribe, verifySendGridSignature } from '../lib/delivery';
import { verifyContact } from '../lib/contacts';
import type { Lead, Message, Enrollment, TrackingEvent } from '../lib/types';
function live(id:string){
 const l=get<Lead>('leads','lead-1')!;
 const updated:Lead={...l,id,source:'serpapi',email:id+'@example.test',presence:{status:'no-additional-presence-found',checkedAt:new Date().toISOString(),queries:[],traces:[],reason:'Test'},contactVerification:{status:'verified',email:id+'@example.test',provider:'hunter',identityConfirmed:true,source:'Test',verifiedAt:new Date().toISOString()}};
 putLead(updated);return updated;
}
function config(){Object.assign(process.env,{EMAIL_PROVIDER:'sendgrid',LIVE_EMAIL_ENABLED:'true',SENDGRID_SANDBOX:'false',SENDGRID_API_KEY:'test-key',FROM_EMAIL:'sender@example.test',APP_URL:'https://app.example.test',POSTAL_ADDRESS:'Test postal address',UNSUBSCRIBE_SECRET:'test-unsubscribe-key',CRON_SECRET:'test-cron-key',SENDGRID_WEBHOOK_PUBLIC_KEY:'test-key',ADMIN_PASSWORD:'test-password'});}
test('live sending requires configuration before contacting any provider',async()=>{
 process.env.EMAIL_PROVIDER='sendgrid';process.env.LIVE_EMAIL_ENABLED='false';
 await assert.rejects(runLiveDue(),/disabled/);
});
test('SendGrid acceptance is not delivery; reservation prevents duplicate sends and webhooks deduplicate',async()=>{
 config();const lead=live('accepted-test');enroll(lead.id,'campaign-1');
 const original=globalThis.fetch;let calls=0;
 globalThis.fetch=async(_,init)=>{calls++;const payload=JSON.parse(String(init?.body));assert.equal(payload.personalizations[0].to[0].email,lead.email);assert.ok(payload.personalizations[0].custom_args.handos_message_id);assert.ok(payload.content[0].value.includes('Unsubscribe:'));return new Response(null,{status:202});};
 try{
 const r=await runLiveDue(new Date(Date.now()+1000),'campaign-1');assert.equal(r.accepted,1);
 await runLiveDue(new Date(Date.now()+1000),'campaign-1');assert.equal(calls,1);
 const message=all<Message>('messages').find(m=>m.enrollmentId===all<Enrollment>('enrollments').find(e=>e.leadId===lead.id)!.id)!;
 assert.equal(all<TrackingEvent>('events').filter(e=>e.messageId===message.id).length,0);
 const events=[{sg_event_id:'delivery-test',handos_message_id:message.id,event:'delivered',timestamp:Math.ceil(new Date(message.sentAt).getTime()/1000)}];
 assert.equal(processSendGridEvents(events).inserted,1);assert.equal(processSendGridEvents(events).inserted,0);
 assert.ok(validUnsubscribe(message.id,unsubscribeToken(message.id)));assert.equal(validUnsubscribe(message.id,'bad'),false);
 }finally{globalThis.fetch=original;}
});
test('uncertain provider outcome never automatically retries the same sequence step',async()=>{
 config();const lead=live('unknown-test');enroll(lead.id,'campaign-2');const original=globalThis.fetch;let calls=0;
 globalThis.fetch=async()=>{calls++;throw new Error('Timeout after sending');};
 try{assert.equal((await runLiveDue(new Date(Date.now()+1000),'campaign-2')).unknown,1);await runLiveDue(new Date(Date.now()+1000),'campaign-2');assert.equal(calls,1);assert.ok(deliveries().some(d=>d.status==='unknown'));}finally{globalThis.fetch=original;}
});
test('signed SendGrid webhook rejects tampering and stale timestamps',()=>{
 const keys=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
 process.env.SENDGRID_WEBHOOK_PUBLIC_KEY=keys.publicKey.export({type:'spki',format:'der'}).toString('base64');
 const raw='[]',timestamp=String(Math.floor(Date.now()/1000));const signature=sign('sha256',Buffer.from(timestamp+raw),keys.privateKey).toString('base64');
 assert.ok(verifySendGridSignature(raw,timestamp,signature));assert.equal(verifySendGridSignature('[1]',timestamp,signature),false);assert.equal(verifySendGridSignature(raw,'1',signature),false);
});
test('contact verifier rejects uncertain addresses and saves only deliverable confirmed contacts',async()=>{
 const lead=live('contact-test');delete lead.contactVerification;putLead(lead);process.env.HUNTER_API_KEY='test-key';
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify({data:{status:'accept_all',result:'risky'}}));
 const input={firstName:'Alex',email:lead.email!,identityConfirmed:true,source:'Owner confirmed by phone'};
 try{
 await assert.rejects(verifyContact(lead.id,input),/did not confirm/);
 assert.throws(()=>enroll(lead.id,'campaign-3'),/Verify/);
 globalThis.fetch=async()=>new Response(JSON.stringify({data:{status:'valid',result:'deliverable'}}));
 await verifyContact(lead.id,input);assert.equal(get<Lead>('leads',lead.id)?.contactVerification?.status,'verified');
 }finally{globalThis.fetch=original;}
});
