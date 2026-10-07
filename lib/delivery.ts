import { isPotentialClient } from './opportunity';
import { createHmac, createPublicKey, randomUUID, timingSafeEqual, verify } from 'node:crypto';
import { z } from 'zod';
import { all, db, get, putEnrollment, putMessage, transaction } from './db';
import { getCampaignSequence } from './campaign-sequence';
import { renderMessage } from './sequence';
import { recordEvent } from './engine';
import type { Enrollment, Lead, Message, EventType } from './types';
export function deliveryConfig(){
 const required=['SENDGRID_API_KEY','FROM_EMAIL','APP_URL','POSTAL_ADDRESS','UNSUBSCRIBE_SECRET','CRON_SECRET','SENDGRID_WEBHOOK_PUBLIC_KEY','ADMIN_PASSWORD'];
 const missing=required.filter(k=>!process.env[k]);
 return {provider:process.env.EMAIL_PROVIDER||'demo',enabled:process.env.LIVE_EMAIL_ENABLED==='true',ready:missing.length===0,missing};
}
function outbox(){
 db().exec('CREATE TABLE IF NOT EXISTS deliveries (message_id TEXT PRIMARY KEY REFERENCES messages(id), status TEXT NOT NULL, updated_at TEXT NOT NULL)');
}
export function deliveries(){outbox();return db().prepare('SELECT message_id AS messageId,status,updated_at AS updatedAt FROM deliveries ORDER BY updated_at DESC LIMIT 100').all();}
export function unsubscribeToken(id:string){const secret=process.env.UNSUBSCRIBE_SECRET;if(!secret)throw new Error('UNSUBSCRIBE_SECRET is required.');return createHmac('sha256',secret).update(id).digest('hex');}
export function validUnsubscribe(id:string,token:string){try{const a=Buffer.from(unsubscribeToken(id)),b=Buffer.from(token);return a.length===b.length&&timingSafeEqual(a,b);}catch{return false;}}
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function sendGridPayload(message:Message,lead:Lead){
 const url=new URL('/api/unsubscribe',process.env.APP_URL);
 url.searchParams.set('messageId',message.id);url.searchParams.set('token',unsubscribeToken(message.id));
 const footer='\n\n'+(process.env.FROM_NAME||'Handos')+' · '+process.env.POSTAL_ADDRESS+'\nUnsubscribe: '+url.href;
 const html=escape(message.body).replace(/https:\/\/handos\.co(?:\/[\w?=&%./-]*)?/g,m=>'<a href="'+m+'">'+m+'</a>').replaceAll('\n','<br/>')+'<br/><br/>'+escape(process.env.POSTAL_ADDRESS||'')+'<br/><a href="'+escape(url.href)+'">Unsubscribe</a>';
 return {personalizations:[{to:[{email:lead.email}],custom_args:{handos_message_id:message.id}}],from:{email:process.env.FROM_EMAIL,name:process.env.FROM_NAME||'Handos'},...(process.env.REPLY_TO_EMAIL?{reply_to:{email:process.env.REPLY_TO_EMAIL}}:{}),subject:message.subject,content:[{type:'text/plain',value:message.body+footer},{type:'text/html',value:html}],headers:{'List-Unsubscribe':'<'+url.href+'>','List-Unsubscribe-Post':'List-Unsubscribe=One-Click'},tracking_settings:{click_tracking:{enable:true,enable_text:true},open_tracking:{enable:true}},mail_settings:{sandbox_mode:{enable:process.env.SENDGRID_SANDBOX==='true'}}};
}
export function advanceLive(message:Message,now:Date){
 const enrollment=get<Enrollment>('enrollments',message.enrollmentId);
 if(!enrollment||enrollment.status!=='active'||enrollment.nextStep!==message.step)return;
 const nextStep=message.step+1;
 putEnrollment({...enrollment,nextStep,status:nextStep>3?'completed':'active',nextDueAt:new Date(now.getTime()+(nextStep===2?3:4)*86400000).toISOString()});
}
export async function runLiveDue(now=new Date(),campaignId?:string,enrollmentIds?:string[]){
 const config=deliveryConfig();
 if(config.provider!=='sendgrid'||!config.enabled)throw new Error('Live sending is disabled. Configure EMAIL_PROVIDER=sendgrid and LIVE_EMAIL_ENABLED=true.');
 if(!config.ready)throw new Error('Missing sending configuration: '+config.missing.join(', '));
 if(new URL(process.env.APP_URL!).protocol!=='https:')throw new Error('Live sending requires a public HTTPS APP_URL.');
 outbox();let accepted=0,failed=0,unknown=0,skipped=0;
 const limit=Math.min(100,Math.max(1,Number(process.env.EMAIL_BATCH_LIMIT)||10));
 for(const e of all<Enrollment>('enrollments')){
  if(accepted+failed+unknown>=limit)break;
  if((enrollmentIds&&!enrollmentIds.includes(e.id))||e.status!=='active'||new Date(e.nextDueAt)>now||(campaignId&&e.campaignId!==campaignId))continue;
  const l=get<Lead>('leads',e.leadId);
  if(!l||l.source==='demo'||!l.email||!isPotentialClient(l)||l.contactVerification?.status!=='verified'||l.contactVerification.email!==l.email.toLowerCase()){skipped++;continue;}
  const reserved=transaction(()=>{
   const current=get<Enrollment>('enrollments',e.id)!;
   if(current.status!=='active'||current.nextStep!==e.nextStep)return null;
   if(db().prepare('SELECT email FROM suppressions WHERE email=?').get(l.email!.toLowerCase())){putEnrollment({...current,status:'suppressed'});return null;}
   if(all<Message>('messages').some(m=>m.enrollmentId===e.id&&m.step===e.nextStep))return null;
   const message:Message={id:randomUUID(),enrollmentId:e.id,step:e.nextStep,variant:e.variant,...renderMessage(e.nextStep,e.variant,l,getCampaignSequence(e.campaignId)),sentAt:now.toISOString()};
   putMessage(message);db().prepare('INSERT INTO deliveries VALUES (?,?,?)').run(message.id,'sending',now.toISOString());return message;
  });
  if(!reserved){skipped++;continue;}
  try{
   const payload=sendGridPayload(reserved,l);
   const response=await fetch('https://api.sendgrid.com/v3/mail/send',{method:'POST',headers:{Authorization:'Bearer '+process.env.SENDGRID_API_KEY,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
   const status=response.status===202?(process.env.SENDGRID_SANDBOX==='true'?'sandbox':'accepted'):response.status>=500?'unknown':'rejected';
   transaction(()=>{db().prepare('UPDATE deliveries SET status=?,updated_at=? WHERE message_id=?').run(status,new Date().toISOString(),reserved.id);if(status==='accepted')advanceLive(reserved,now);if(status==='rejected'){const current=get<Enrollment>('enrollments',reserved.enrollmentId);if(current?.status==='active')putEnrollment({...current,status:'delivery-rejected'});}});
   if(status==='accepted')accepted++;else if(status==='unknown')unknown++;else failed++;
  }catch{db().prepare("UPDATE deliveries SET status='unknown',updated_at=? WHERE message_id=?").run(new Date().toISOString(),reserved.id);unknown++;}
 }
 return {accepted,failed,unknown,skipped,mode:'sendgrid',notice:accepted+' messages accepted by SendGrid; delivery is confirmed only by webhooks. Uncertain attempts are held for review, never automatically resent.'};
}
export const webhookSchema=z.array(z.object({sg_event_id:z.string().min(1),handos_message_id:z.string().optional(),event:z.string(),timestamp:z.number().int().nonnegative()})).max(1000);
export function verifySendGridSignature(raw:string,timestamp:string,signature:string){
 try{
  if(!/^\d+$/.test(timestamp)||Math.abs(Date.now()/1000-Number(timestamp))>300)return false;
  const key=createPublicKey({key:Buffer.from(process.env.SENDGRID_WEBHOOK_PUBLIC_KEY||'','base64'),format:'der',type:'spki'});
  return verify('sha256',Buffer.from(timestamp+raw),key,Buffer.from(signature,'base64'));
 }catch{return false;}
}
export function processSendGridEvents(input:unknown){
 const mapping:Record<string,EventType>={delivered:'delivered',open:'open',click:'click',bounce:'bounce',dropped:'bounce',unsubscribe:'unsubscribe',group_unsubscribe:'unsubscribe',spamreport:'unsubscribe'};
 const rows=webhookSchema.parse(input);let inserted=0;
 for(const row of rows){
  const type=mapping[row.event],message=row.handos_message_id?get<Message>('messages',row.handos_message_id):undefined;
  if(!type||!message)continue;
  const result=recordEvent({externalId:'sendgrid:'+row.sg_event_id,messageId:message.id,type,occurredAt:new Date(row.timestamp*1000).toISOString()});
  outbox();transaction(()=>{db().prepare("UPDATE deliveries SET status='accepted',updated_at=? WHERE message_id=?").run(new Date().toISOString(),message.id);advanceLive(message,new Date(message.sentAt));});
  if(result.inserted)inserted++;
 }
 return {inserted};
}
export function reconcileDelivery(id:string,outcome:'accepted'|'rejected'){
 outbox();return transaction(()=>{
 const message=get<Message>('messages',id);if(!message)throw new Error('Message not found.');
 const attempt=db().prepare('SELECT status FROM deliveries WHERE message_id=?').get(id) as {status:string}|undefined;
 if(!attempt||!['unknown','sending','sandbox'].includes(attempt.status))throw new Error('This delivery is not awaiting reconciliation.');
 db().prepare('UPDATE deliveries SET status=?,updated_at=? WHERE message_id=?').run(outcome,new Date().toISOString(),id);
 if(outcome==='accepted')advanceLive(message,new Date(message.sentAt));
 else {const enrollment=get<Enrollment>('enrollments',message.enrollmentId)!;if(enrollment.status==='active')putEnrollment({...enrollment,status:'delivery-rejected'});}
 return {notice:'Delivery reconciled. Rejected messages are not automatically resent.'};
 });
}
