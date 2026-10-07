import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_URL='file::memory:';
import { getCampaignSequence, saveCampaignSequence } from '../lib/campaign-sequence';
import { sequence } from '../lib/sequence';
import { all, get } from '../lib/db';
import { enroll, runDue } from '../lib/engine';
import type { Lead, Message } from '../lib/types';
test('saved campaign templates survive reads and render future demo messages',()=>{
 const draft=JSON.parse(JSON.stringify(sequence));draft[0].A.subject='Audit for {{company_name}}';draft[0].B.subject=draft[0].A.subject;
 saveCampaignSequence('campaign-1',draft);
 assert.equal(getCampaignSequence('campaign-1')[0].A.subject,draft[0].A.subject);
 const lead=get<Lead>('leads','lead-1')!;const enrollment=enroll(lead.id,'campaign-1');runDue(new Date(),'campaign-1');
 const message=all<Message>('messages').find(m=>m.enrollmentId===enrollment.id)!;
 assert.equal(message.subject,'Audit for '+lead.company);
});
test('invalid schedules, missing CTA and missing campaigns are rejected',()=>{
 const draft=JSON.parse(JSON.stringify(sequence));draft[1].delayDays=2;
 assert.throws(()=>saveCampaignSequence('campaign-1',draft));
 draft[1].delayDays=3;draft[0].A.body='No scheduling link';
 assert.throws(()=>saveCampaignSequence('campaign-1',draft));
 assert.throws(()=>getCampaignSequence('missing'),/not found/);
});
