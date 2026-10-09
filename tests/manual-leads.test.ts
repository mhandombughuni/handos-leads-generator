import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_URL='file::memory:';
import { approveManualOutreach, createManualLead, saveContactDraft } from '../lib/manual-leads';
import { savedLeads } from '../lib/saved-leads';
import { get, putLead, putEnrollment } from '../lib/db';
import { enroll } from '../lib/engine';
import type { Lead } from '../lib/types';
test('manual leads persist in the shortlist without inventing qualification or email verification',async()=>{
 const {lead}=await createManualLead({company:'New Local Business',industry:'Healthcare',email:'Owner@localbusiness.org',website:'https://localbusiness.org'});
 assert.equal(lead.email,'owner@localbusiness.org');assert.equal(lead.source,'manual');assert.equal(lead.contactVerification,undefined);assert.equal(lead.audit.opportunity,null);
 assert.ok((await savedLeads()).some(l=>l.id===lead.id));assert.equal((await get<Lead>('leads',lead.id))?.company,'New Local Business');
 await assert.rejects(()=>enroll(lead.id,'campaign-1'));
 const {lead:withoutEmail}=await createManualLead({company:'Another Local Business',industry:'Healthcare'});assert.equal(withoutEmail.email,null);
 await assert.rejects(()=>createManualLead({company:'Invalid Business',industry:'Healthcare',email:'invalid'}));
 await assert.rejects(()=>createManualLead({company:'Invalid Business',industry:'Healthcare',website:'file:///etc/passwd'}));
});
test('saving a different draft email removes verification and cannot change an active enrollment contact',async()=>{
 const {lead}=await createManualLead({company:'Draft Contact Business',industry:'Healthcare',email:'old@localbusiness.org'});
 await putLead({...lead,contactVerification:{status:'verified',email:lead.email!,provider:'hunter',identityConfirmed:true,source:'Confirmed by owner',verifiedAt:new Date().toISOString()}});
 const {lead:updated}=await saveContactDraft(lead.id,{firstName:'Pat',email:'New@localbusiness.org'});
 assert.equal(updated.email,'new@localbusiness.org');assert.equal(updated.contactVerification,undefined);assert.equal(updated.firstName,'Pat');
 await putEnrollment({id:'manual-active-test',leadId:lead.id,campaignId:'campaign-1',variant:'A',status:'active',nextStep:1,nextDueAt:new Date().toISOString(),createdAt:new Date().toISOString()});
 await assert.rejects(()=>saveContactDraft(lead.id,{firstName:'Pat',email:'other@localbusiness.org'}),/Stop active enrollments/);
 assert.equal((await get<Lead>('leads',lead.id))?.email,'new@localbusiness.org');
 await assert.rejects(()=>saveContactDraft(lead.id,{firstName:'Pat',email:'invalid'}));
 await assert.rejects(()=>saveContactDraft('missing',{firstName:'Pat',email:'valid@localbusiness.org'}),/Lead not found/);
});

test('manual approval permits verified manual contacts without inventing screening and can be revoked',async()=>{
 const {isPotentialClient}=await import('../lib/opportunity');
 const {lead}=await createManualLead({company:'Approved Manual Prospect',industry:'Healthcare',email:'manual@localbusiness.org'});
 assert.equal(isPotentialClient(lead),false);
 await assert.rejects(()=>approveManualOutreach(lead.id,{approved:true,note:''}),/Add a note/);
 const {lead:approved}=await approveManualOutreach(lead.id,{approved:true,note:'Owner requested an audit'});
 assert.equal(isPotentialClient(approved),true);assert.equal(approved.presence,undefined);assert.equal(approved.audit.opportunity,null);
 await assert.rejects(()=>enroll(lead.id,'campaign-2'),/Verify the email/);
 await putLead({...approved,contactVerification:{status:'verified',email:approved.email!,provider:'hunter',identityConfirmed:true,source:'Owner confirmed by phone',verifiedAt:new Date().toISOString()}});
 const enrollment=await enroll(lead.id,'campaign-2');assert.equal(enrollment.status,'active');
 const {runLiveDue}=await import('../lib/delivery');
 Object.assign(process.env,{EMAIL_PROVIDER:'sendgrid',LIVE_EMAIL_ENABLED:'true',SENDGRID_SANDBOX:'false',SENDGRID_API_KEY:'test',FROM_EMAIL:'sender@example.test',APP_URL:'https://app.example.test',POSTAL_ADDRESS:'Test address',UNSUBSCRIBE_SECRET:'test',CRON_SECRET:'test',SENDGRID_WEBHOOK_PUBLIC_KEY:'test',ADMIN_PASSWORD:'test'});
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;return new Response(null,{status:202});};
 try{assert.equal((await runLiveDue(new Date(Date.now()+1000),'campaign-2',[enrollment.id])).accepted,1);assert.equal(calls,1);
 await approveManualOutreach(lead.id,{approved:false,note:''});
 assert.equal((await runLiveDue(new Date(Date.now()+4*86400000),'campaign-2',[enrollment.id])).accepted,0);assert.equal(calls,1);
 }finally{globalThis.fetch=original;}
 assert.equal(isPotentialClient((await approveManualOutreach(lead.id,{approved:false,note:''})).lead),false);
 await assert.rejects(()=>approveManualOutreach('lead-1',{approved:true,note:'Test'}),/only available/);
});
