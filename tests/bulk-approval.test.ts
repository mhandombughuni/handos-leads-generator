import {test} from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_URL='file::memory:';
import {createManualLead,saveContactDraft} from '../lib/manual-leads';
import {enrollSavedLeads} from '../lib/saved-leads';
import {enroll,recordEvent} from '../lib/engine';
import {runLiveDue} from '../lib/delivery';
import {get,putLead,all} from '../lib/db';
import type {Message,Lead} from '../lib/types';
test('explicit selection approves valid emails without Hunter or fit approval; other leads and changed addresses remain protected',async()=>{
 const {lead}=await createManualLead({company:'Selected Bulk Prospect',industry:'Healthcare',email:'bulk@localbusiness.org'});
 const {lead:other}=await createManualLead({company:'Unselected Prospect',industry:'Healthcare',email:'other@localbusiness.org'});
 await assert.rejects(()=>enroll(other.id,'campaign-1'));
 const results=await enrollSavedLeads([lead.id],'campaign-1',true);assert.ok(results[0].enrollmentId);
 const {lead:missing}=await createManualLead({company:'Missing Email',industry:'Healthcare'});assert.match((await enrollSavedLeads([missing.id],'campaign-1',true))[0].error!,/valid format/);
 await putLead({...other,email:'broken'});assert.match((await enrollSavedLeads([other.id],'campaign-1',true))[0].error!,/valid format/);
 Object.assign(process.env,{EMAIL_PROVIDER:'sendgrid',LIVE_EMAIL_ENABLED:'true',SENDGRID_SANDBOX:'false',SENDGRID_API_KEY:'test',FROM_EMAIL:'sender@example.test',APP_URL:'https://app.example.test',POSTAL_ADDRESS:'Test address',UNSUBSCRIBE_SECRET:'test',CRON_SECRET:'test',SENDGRID_WEBHOOK_PUBLIC_KEY:'test',ADMIN_PASSWORD:'test'});
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;return new Response(null,{status:202});};
 try{
 const id=results[0].enrollmentId!;assert.equal((await runLiveDue(new Date(Date.now()+1000),'campaign-1',[id])).accepted,1);
 await runLiveDue(new Date(Date.now()+1000),'campaign-1',[id]);assert.equal(calls,1);
 await putLead({...lead,email:'changed@localbusiness.org'});assert.equal((await runLiveDue(new Date(Date.now()+4*86400000),'campaign-1',[id])).accepted,0);assert.equal(calls,1);
 await putLead(lead);const message=(await all<Message>('messages')).find(m=>m.enrollmentId===id)!;
 await recordEvent({externalId:'bulk-optout',messageId:message.id,type:'unsubscribe',occurredAt:message.sentAt});
 assert.match((await enrollSavedLeads([lead.id],'campaign-2',true))[0].error!,/suppressed/);
 assert.equal((await runLiveDue(new Date(Date.now()+4*86400000),'campaign-1',[id])).accepted,0);assert.equal(calls,1);
 }finally{globalThis.fetch=original;}
});
