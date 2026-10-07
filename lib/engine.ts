import { isPotentialClient } from './opportunity';
import { createHash, randomUUID } from 'node:crypto';
import { all, db, get, putEnrollment, putEvent, putMessage, transaction } from './db';
import { renderMessage } from './sequence';
import { getCampaignSequence } from './campaign-sequence';
import type { Campaign, Enrollment, EventType, Lead, Message, TrackingEvent, Variant } from './types';
const stops:EventType[]=['reply','bounce','unsubscribe','booked-demo'];
export function experiment(campaignId:string){
 const ids=new Set(all<Enrollment>('enrollments').filter(e=>e.campaignId===campaignId).map(e=>e.id));
 const messages=all<Message>('messages').filter(m=>ids.has(m.enrollmentId)&&m.step===1);
 const events=all<TrackingEvent>('events');
 const variants=(['A','B'] as Variant[]).map(variant=>{
 const mids=new Set(messages.filter(m=>m.variant===variant).map(m=>m.id));
 const delivered=new Set(events.filter(e=>mids.has(e.messageId)&&e.type==='delivered').map(e=>e.messageId));
 const opened=new Set(events.filter(e=>delivered.has(e.messageId)&&e.type==='open').map(e=>e.messageId));
 return {variant,delivered:delivered.size,opened:opened.size,rate:delivered.size?opened.size/delivered.size:0};
 });
 const winner:Variant|null=variants.every(v=>v.delivered>=20)&&Math.abs(variants[0].rate-variants[1].rate)>=.05?(variants[0].rate>variants[1].rate?'A':'B'):null;
 return {variants,winner,policy:winner?'80% to leading variant · 20% exploration':'50 / 50 exploration · needs 20 deliveries per variant and a 5-point open-rate gap'};
}
export function chooseVariant(campaignId:string,leadId:string):Variant{
 const {winner}=experiment(campaignId);const bucket=parseInt(createHash('sha256').update(`${campaignId}:${leadId}`).digest('hex').slice(0,8),16)%100;
 return winner?(bucket<80?winner:winner==='A'?'B':'A'):(bucket<50?'A':'B');
}
export function enroll(leadId:string,campaignId:string){return transaction(()=>{
 const lead=get<Lead>('leads',leadId),campaign=get<Campaign>('campaigns',campaignId);
 if(!lead||!campaign)throw new Error('Lead or campaign not found.');
 if(lead.source!=='demo'&&!isPotentialClient(lead))throw new Error('This live lead has not passed independent digital presence screening.');
 if(!lead.email)throw new Error('Add and verify a contact email before enrollment.');
 if(lead.source!=='demo'&&(lead.contactVerification?.status!=='verified'||lead.contactVerification.email!==lead.email.toLowerCase()||!lead.contactVerification.identityConfirmed))throw new Error('Verify the email and confirm business identity before enrolling a live lead.');
 if(db().prepare('SELECT email FROM suppressions WHERE email=?').get(lead.email.toLowerCase()))throw new Error('This contact is suppressed and cannot be enrolled.');
 const existing=all<Enrollment>('enrollments').find(e=>e.leadId===leadId&&e.campaignId===campaignId);if(existing)return existing;
 const now=new Date().toISOString();const enrollment:Enrollment={id:randomUUID(),leadId,campaignId,variant:chooseVariant(campaignId,leadId),status:'active',nextStep:1,nextDueAt:now,createdAt:now};putEnrollment(enrollment);return enrollment;
 });}
export function recordEvent(input:{externalId:string;messageId:string;type:EventType;occurredAt?:string;revenue?:number}){return transaction(()=>{
 const message=get<Message>('messages',input.messageId);if(!message)throw new Error('Message not found.');
 const occurredAt=input.occurredAt||new Date().toISOString();if(new Date(occurredAt).getTime()<new Date(message.sentAt).getTime()-1000)throw new Error('An event cannot precede its message.');
 const e:TrackingEvent={id:randomUUID(),externalId:input.externalId,messageId:input.messageId,type:input.type,occurredAt,revenue:input.type==='booked-demo'?(input.revenue||0):0};
 const inserted=putEvent(e);if(!inserted)return {inserted:false};
 if(stops.includes(input.type)){
 const enrollment=get<Enrollment>('enrollments',message.enrollmentId)!;const lead=get<Lead>('leads',enrollment.leadId)!;
 if(lead.email)db().prepare('INSERT OR REPLACE INTO suppressions VALUES (?,?)').run(lead.email.toLowerCase(),input.type);
 const matching=new Set(all<Lead>('leads').filter(l=>l.id===lead.id||(l.email&&l.email.toLowerCase()===lead.email?.toLowerCase())).map(l=>l.id));
 all<Enrollment>('enrollments').filter(n=>matching.has(n.leadId)&&n.status==='active').forEach(n=>putEnrollment({...n,status:input.type}));
 }
 return {inserted:true};
 });}
export function runDue(now=new Date(),campaignId?:string,enrollmentIds?:string[]){
 return transaction(()=>{
 let sent=0;
 for(const e of all<Enrollment>('enrollments')){
 if((enrollmentIds&&!enrollmentIds.includes(e.id))||e.status!=='active'||new Date(e.nextDueAt)>now||(campaignId&&e.campaignId!==campaignId))continue;
 const lead=get<Lead>('leads',e.leadId)!;
 if(lead.source!=='demo')continue;
 if(lead.email&&db().prepare('SELECT email FROM suppressions WHERE email=?').get(lead.email.toLowerCase())){putEnrollment({...e,status:'suppressed'});continue;}
 const m:Message={id:randomUUID(),enrollmentId:e.id,step:e.nextStep,variant:e.variant,...renderMessage(e.nextStep,e.variant,lead,getCampaignSequence(e.campaignId)),sentAt:now.toISOString()};putMessage(m);
 putEvent({id:randomUUID(),externalId:`demo-delivery-${m.id}`,messageId:m.id,type:'delivered',occurredAt:now.toISOString(),revenue:0});
 const nextStep=e.nextStep+1;putEnrollment({...e,nextStep,status:nextStep>3?'completed':'active',nextDueAt:new Date(now.getTime()+(nextStep===2?3:4)*86400000).toISOString()});sent++;
 }return {sent,mode:'demo',notice:`${sent} demo message${sent===1?'':'s'} recorded. No email was sent.`};
 });
}
