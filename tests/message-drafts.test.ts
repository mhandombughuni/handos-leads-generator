import {test} from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_URL='file::memory:';
import {get,putLead,all} from '../lib/db';
import {getCampaignSequence} from '../lib/campaign-sequence';
import {saveMessageDraft,getMessageDrafts,renderLeadMessage,messageDraftSchema} from '../lib/message-drafts';
import {enroll} from '../lib/engine';
import {runLiveDue} from '../lib/delivery';
import type {Lead,Message} from '../lib/types';
test('reviewed drafts are isolated and actual delivery uses the edited subject and body for each step',async()=>{
 const base=(await get<Lead>('leads','lead-1'))!;
 const lead:Lead={...base,id:'reviewed-message',source:'manual',company:'Grace Church',firstName:'Alex',email:'reviewed@example.test',contactVerification:{status:'verified',email:'reviewed@example.test',provider:'hunter',identityConfirmed:true,source:'Office',verifiedAt:new Date().toISOString()}};
 await putLead(lead);
 const templates=await getCampaignSequence('campaign-churches');
 const draft={step:1,subject:'A personal note for Grace Church',body:'Hi Alex,\n\nCould we discuss your visitor information page? https://handos.co\n\nThanks, Handos'};
 await saveMessageDraft(lead.id,'campaign-churches',draft);
 assert.deepEqual((await getMessageDrafts(lead.id,'campaign-churches'))[1],draft);
 for(const variant of ['A','B'] as const)assert.deepEqual(await renderLeadMessage(lead,'campaign-churches',1,variant),{subject:draft.subject,body:draft.body});
 assert.deepEqual(await getMessageDrafts(base.id,'campaign-churches'),{});
 assert.deepEqual(await getMessageDrafts(lead.id,'campaign-1'),{});
 assert.deepEqual(await getCampaignSequence('campaign-churches'),templates);
 assert.throws(()=>messageDraftSchema.parse({...draft,body:'Missing link'}));
 assert.throws(()=>messageDraftSchema.parse({...draft,subject:'Invalid\nsubject'}));
 const e=await enroll(lead.id,'campaign-churches');
 Object.assign(process.env,{EMAIL_PROVIDER:'sendgrid',LIVE_EMAIL_ENABLED:'true',SENDGRID_SANDBOX:'false',SENDGRID_API_KEY:'test',FROM_EMAIL:'sender@example.test',APP_URL:'https://app.example.test',POSTAL_ADDRESS:'Test',UNSUBSCRIBE_SECRET:'test',CRON_SECRET:'test',SENDGRID_WEBHOOK_PUBLIC_KEY:'test',ADMIN_PASSWORD:'test'});
 const original=globalThis.fetch;let sent=0;
 try{
  globalThis.fetch=async(_url,init)=>{const request=JSON.parse(String(init?.body));assert.equal(request.subject,sent===0?draft.subject:'Edited follow-up');assert.ok(request.content.some((c:{value:string})=>c.value.includes(sent===0?draft.body:'A specific follow-up for Alex')));sent++;return new Response(null,{status:202});};
  assert.equal((await runLiveDue(new Date(Date.now()+1000),'campaign-churches',[e.id])).accepted,1);
  await assert.rejects(saveMessageDraft(lead.id,'campaign-churches',{...draft,subject:'Too late'}),/already been attempted/);
  await saveMessageDraft(lead.id,'campaign-churches',{step:2,subject:'Edited follow-up',body:'A specific follow-up for {{first_name}}. https://handos.co'});
  assert.equal((await runLiveDue(new Date(Date.now()+4*86400000),'campaign-churches',[e.id])).accepted,1);
  const messages=(await all<Message>('messages')).filter(m=>m.enrollmentId===e.id);
  assert.equal(messages.length,2);assert.equal(messages[0].body,draft.body);assert.match(messages[1].body,/for Alex/);
 }finally{globalThis.fetch=original;}
});


test('every default campaign greeting uses a first name or falls back to the organization team',async()=>{
 const {renderMessage}=await import('../lib/sequence');
 const base=(await get<Lead>('leads','lead-1'))!;
 for(const campaignId of ['campaign-1','campaign-nonprofit','campaign-churches','campaign-christian-ngos']){
  const templates=await getCampaignSequence(campaignId);
  for(const step of [1,2,3])for(const variant of ['A','B'] as const){
   assert.ok(renderMessage(step,variant,{...base,company:'Grace Church',firstName:' Alex '},templates).body.startsWith('Hi Alex,'));
   for(const firstName of ['', '   '])assert.ok(renderMessage(step,variant,{...base,company:'Grace Church',firstName},templates).body.startsWith('Hi Grace Church Team,'));
  }
 }
});
