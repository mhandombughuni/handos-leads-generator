import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_URL = 'file::memory:';
import { getCampaignSequence, saveCampaignSequence } from '../lib/campaign-sequence';
import { sequence } from '../lib/sequence';
import { all, get } from '../lib/db';
import { enroll, runDue } from '../lib/engine';
import type { Lead, Message } from '../lib/types';
test('saved campaign templates survive reads and render future demo messages', async () => {
    const draft = JSON.parse(JSON.stringify(sequence));
    draft[0].A.subject = 'Audit for {{company_name}}';
    draft[0].B.subject = draft[0].A.subject;
    (await saveCampaignSequence('campaign-1', draft));
    assert.equal((await getCampaignSequence('campaign-1'))[0].A.subject, draft[0].A.subject);
    const lead = (await get<Lead>('leads', 'lead-1'))!;
    const enrollment = (await enroll(lead.id, 'campaign-1'));
    (await runDue(new Date(), 'campaign-1'));
    const message = (await all<Message>('messages')).find(m => m.enrollmentId === enrollment.id)!;
    assert.equal(message.subject, 'Audit for ' + lead.company);
});
test('invalid schedules, missing CTA and missing campaigns are rejected', async () => {
    const draft = JSON.parse(JSON.stringify(sequence));
    draft[1].delayDays = 2;
    await assert.rejects(async () => (await saveCampaignSequence('campaign-1', draft)));
    draft[1].delayDays = 3;
    draft[0].A.body = 'No scheduling link';
    await assert.rejects(async () => (await saveCampaignSequence('campaign-1', draft)));
    await assert.rejects(async () => (await getCampaignSequence('missing')), /not found/);
});
