import {test} from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_URL='file::memory:';
import {get,putLead,all} from '../lib/db';
import {getCampaignSequence,saveCampaignSequence} from '../lib/campaign-sequence';
import {audienceForCampaign,nonprofitCampaigns} from '../lib/campaign-profiles';
import {listCampaigns} from '../lib/campaigns';
import {generateSequenceDraft} from '../lib/sequence-draft';
import {renderMessage} from '../lib/sequence';
import {enroll} from '../lib/engine';
import {runLiveDue} from '../lib/delivery';
import type {Lead} from '../lib/types';
test('church and nonprofit sequences use sector language and saved audience drafts are isolated',async()=>{
 const base=(await get<Lead>('leads','lead-1'))!;
 const church:Lead={...base,id:'church-sequence',source:'manual',industry:'Nonprofit',company:'Grace Church',email:'office@example.test',contactVerification:{status:'verified',email:'office@example.test',provider:'hunter',identityConfirmed:true,source:'Church office',verifiedAt:new Date().toISOString()}};
 assert.equal(audienceForCampaign('campaign-churches'),'churches');
 assert.ok((await listCampaigns()).some(c=>c.id==='campaign-nonprofit'));
 for(const campaign of nonprofitCampaigns){
  const seq=await getCampaignSequence(campaign.id);
  for(const step of seq)for(const v of ['A','B'] as const){const msg=renderMessage(step.step,v,church,seq);assert.doesNotMatch(msg.subject+' '+msg.body,/\b(customers?|company|companies)\b/i);assert.match(msg.body,/https:\/\/handos.co/);}
 }
 const generic=await getCampaignSequence('campaign-1');
 const draft=await getCampaignSequence('campaign-churches');draft[0].A.subject='Church-specific reviewed draft';draft[0].B.subject=draft[0].A.subject;
 await saveCampaignSequence('campaign-churches',draft);
 assert.equal((await getCampaignSequence('campaign-churches'))[0].A.subject,draft[0].A.subject);
 assert.deepEqual(await getCampaignSequence('campaign-1'),generic);
 await putLead(church);const e=await enroll(church.id,'campaign-churches');
 Object.assign(process.env,{EMAIL_PROVIDER:'sendgrid',LIVE_EMAIL_ENABLED:'true',SENDGRID_SANDBOX:'false',SENDGRID_API_KEY:'test',FROM_EMAIL:'sender@example.test',APP_URL:'https://app.example.test',POSTAL_ADDRESS:'Test',UNSUBSCRIBE_SECRET:'test',CRON_SECRET:'test',SENDGRID_WEBHOOK_PUBLIC_KEY:'test',ADMIN_PASSWORD:'test',OPENAI_API_KEY:'test'});
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async(_url,init)=>{assert.equal(JSON.parse(String(init?.body)).subject,draft[0].A.subject);return new Response(null,{status:202});};
  assert.equal((await runLiveDue(new Date(Date.now()+1000),'campaign-churches',[e.id])).accepted,1);
  globalThis.fetch=async(_url,init)=>{const request=JSON.parse(String(init?.body));assert.equal(request.store,false);assert.equal(request.text.format.type,'json_schema');assert.ok(!request.input.includes(church.email!));return new Response(JSON.stringify({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({sequence:draft})}]}]}));};
  const generated=await generateSequenceDraft('churches');assert.deepEqual(generated.sequence,draft);assert.match(generated.notice,/Nothing has been sent or saved/);
  assert.deepEqual(await getCampaignSequence('campaign-1'),generic);
 }finally{globalThis.fetch=original;}
});

test('campaign choice controls wording regardless of the lead industry or legacy audience parameter',async()=>{
 const nonprofit=await getCampaignSequence('campaign-nonprofit');
 const business=await getCampaignSequence('campaign-2');
 assert.deepEqual(await getCampaignSequence('campaign-nonprofit','roofing'),nonprofit);
 assert.deepEqual(await getCampaignSequence('campaign-2','churches'),business);
 assert.match(business[0].A.body,/customers/);
 const base=(await get<Lead>('leads','lead-1'))!;
 const customized=structuredClone(nonprofit);customized[0].A.subject='Reviewed nonprofit campaign';customized[0].B.subject=customized[0].A.subject;
 await saveCampaignSequence('campaign-nonprofit',customized,'dental');
 assert.equal((await getCampaignSequence('campaign-nonprofit'))[0].A.subject,'Reviewed nonprofit campaign');
 assert.deepEqual(await getCampaignSequence('campaign-2'),business);
 const lead:Lead={...base,id:'campaign-choice',source:'manual',industry:'Construction',company:'Example organization',email:'campaign-choice@example.test',contactVerification:{status:'verified',email:'campaign-choice@example.test',provider:'hunter',identityConfirmed:true,source:'Office',verifiedAt:new Date().toISOString()}};
 await putLead(lead);const e=await enroll(lead.id,'campaign-nonprofit');
 const original=globalThis.fetch;
 try{globalThis.fetch=async(_url,init)=>{assert.equal(JSON.parse(String(init?.body)).subject,'Reviewed nonprofit campaign');return new Response(null,{status:202});};assert.equal((await runLiveDue(new Date(Date.now()+1000),'campaign-nonprofit',[e.id])).accepted,1);}finally{globalThis.fetch=original;}
});
