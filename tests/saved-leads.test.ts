import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_URL='file::memory:';
import { savedLeads, saveLead } from '../lib/saved-leads';
import { get, putLead } from '../lib/db';
import type { Lead } from '../lib/types';
test('saved shortlist is idempotent, uses current lead data, and removal preserves lead history',()=>{
 assert.equal(savedLeads().length,0);
 saveLead('lead-1',true);const at=savedLeads()[0].savedAt;saveLead('lead-1',true);
 assert.equal(savedLeads().length,1);assert.equal(savedLeads()[0].savedAt,at);
 const lead=get<Lead>('leads','lead-1')!;putLead({...lead,firstName:'Updated contact'});
 assert.equal(savedLeads()[0].firstName,'Updated contact');
 saveLead('lead-1',false);assert.equal(savedLeads().length,0);assert.equal(get<Lead>('leads','lead-1')?.firstName,'Updated contact');
 assert.throws(()=>saveLead('missing',true),/Lead not found/);
});

test('bulk campaign enrollment reports partial failures, deduplicates, and sends only selected recipients',async()=>{
 const { enrollSavedLeads }=await import('../lib/saved-leads');
 const { runDue, enroll }=await import('../lib/engine');
 const { all }=await import('../lib/db');
 saveLead('lead-1',true);saveLead('lead-8',true);
 const bad=get<Lead>('leads','lead-8')!;putLead({...bad,email:null});
 const results=enrollSavedLeads(['lead-1','lead-1','lead-8','lead-9'],'campaign-1');
 assert.equal(results.length,3);assert.ok(results[0].enrollmentId);assert.match(results[1].error!,/email/);assert.match(results[2].error!,/saved list/);
 const unrelated=enroll('lead-4','campaign-1');
 const result=runDue(new Date(),'campaign-1',[results[0].enrollmentId!]);
 const messages=all<import('../lib/types').Message>('messages');
 assert.equal(messages.filter(m=>m.enrollmentId===unrelated.id).length,0);
 const message=messages.find(m=>m.enrollmentId===results[0].enrollmentId)!;
 assert.ok(message.body.includes('Harbor Community Center'));assert.ok(message.body.includes('Updated contact'));assert.ok(!message.body.includes('{{'));
 assert.equal(enrollSavedLeads(['lead-1'],'campaign-1')[0].enrollmentId,results[0].enrollmentId);
});
