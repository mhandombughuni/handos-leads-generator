import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_URL = 'file::memory:';
process.env.EMAIL_PROVIDER = 'demo';
import { all, db, get, putLead } from '../lib/db';
import { enroll, runDue, recordEvent, experiment, chooseVariant } from '../lib/engine';
import { scoreAudit } from '../lib/audit';
import { analytics, csvCell, exportCSV } from '../lib/analytics';
import { MockDiscoveryProvider } from '../lib/discovery';
import { renderMessage } from '../lib/sequence';
import type { Enrollment, Lead, Message } from '../lib/types';
test('search combines exactly one location selector and industry', async () => {
    const provider = new MockDiscoveryProvider();
    for (const [locationType, location] of [['city', 'Boston'], ['zip', '02108'], ['state', 'Massachusetts']] as const) {
        const result = await provider.search({ locationType, location, industry: 'Nonprofit' });
        assert.ok(result.leads.length);
        assert.ok(result.leads.every(l => l.industry === 'Nonprofit' && l.state === 'MA'));
    }
    assert.equal((await provider.search({ locationType: 'city', location: 'No Such City', industry: 'Healthcare' })).leads.length, 0);
});
test('audit does not confuse missing evidence with a missing website', () => {
    assert.equal(scoreAudit({ hasWebsite: null }, 'unverified').opportunity, null);
    assert.equal(scoreAudit({ hasWebsite: true }, 'unverified').presence, null);
    assert.equal(scoreAudit({ hasWebsite: false }).opportunity, 100);
    const weak = scoreAudit({ hasWebsite: true, https: true, mobile: false, clearCTA: false, intakeForm: false, booking: false, integratedWorkflow: false, staleDesign: true });
    assert.equal(weak.classification, 'Weak / outdated website');
    assert.ok(weak.opportunity! > 80);
});
test('enrollment is idempotent; sends obey due times and stop after reply', async () => {
    const enrollment = (await enroll('lead-1', 'campaign-1'));
    assert.equal((await enroll('lead-1', 'campaign-1')).id, enrollment.id);
    const start = new Date(Date.now() + 1000);
    assert.equal((await runDue(start, 'campaign-1')).sent, 1);
    assert.equal((await runDue(start, 'campaign-1')).sent, 0);
    assert.equal((await runDue(new Date(start.getTime() + 2 * 86400000), 'campaign-1')).sent, 0);
    assert.equal((await runDue(new Date(start.getTime() + 3 * 86400000), 'campaign-1')).sent, 1);
    const messages = (await all<Message>('messages')).filter(m => m.enrollmentId === enrollment.id);
    assert.equal(messages.length, 2);
    const second = messages.find(m => m.step === 2)!;
    (await recordEvent({ externalId: 'reply-once', messageId: second.id, type: 'reply', occurredAt: second.sentAt }));
    assert.equal((await get<Enrollment>('enrollments', enrollment.id))?.status, 'reply');
    assert.equal((await runDue(new Date(start.getTime() + 10 * 86400000), 'campaign-1')).sent, 0);
    await assert.rejects(async () => (await enroll('lead-1', 'campaign-2')), /suppressed/);
});
test('all terminal outcomes suppress across campaigns', async () => {
    for (const [index, type] of (['bounce', 'unsubscribe', 'booked-demo'] as const).entries()) {
        const leadId = `lead-${index + 2}`;
        const e = (await enroll(leadId, 'campaign-1'));
        (await enroll(leadId, 'campaign-2'));
        (await runDue(new Date(Date.now() + 1000)));
        const m = (await all<Message>('messages')).find(m => m.enrollmentId === e.id)!;
        (await recordEvent({ externalId: `terminal-${type}`, messageId: m.id, type, occurredAt: m.sentAt }));
        assert.ok((await all<Enrollment>('enrollments')).filter(n => n.leadId === leadId).every(n => n.status === type));
        await assert.rejects(async () => (await enroll(leadId, 'campaign-3')), /suppressed/);
    }
});
test('deduplicates webhook retries and unique message metrics', async () => {
    const e = (await enroll('lead-5', 'campaign-3'));
    (await runDue(new Date(Date.now() + 1000), 'campaign-3'));
    const m = (await all<Message>('messages')).find(m => m.enrollmentId === e.id)!;
    const event = { externalId: 'click-one', messageId: m.id, type: 'click' as const, occurredAt: m.sentAt };
    const before = (await analytics({ campaignId: 'campaign-3' })).metrics.click;
    assert.equal((await recordEvent(event)).inserted, true);
    assert.equal((await recordEvent(event)).inserted, false);
    (await recordEvent({ ...event, externalId: 'click-two' }));
    assert.equal((await analytics({ campaignId: 'campaign-3' })).metrics.click, before + 1);
    (await recordEvent({ ...event, externalId: 'booking-one', type: 'booked-demo', revenue: 100 }));
    (await recordEvent({ ...event, externalId: 'booking-two', type: 'booked-demo', revenue: 100 }));
    const today = m.sentAt.slice(0, 10);
    const metrics = (await analytics({ campaignId: 'campaign-3', from: today, to: today })).metrics;
    assert.equal(metrics.revenue, 100);
    assert.equal(metrics.booked, 1);
    await assert.rejects(async () => (await recordEvent({ ...event, externalId: 'bad-time', occurredAt: '2000-01-01T00:00:00.000Z' })), /precede/);
});
test('date and category filters agree with campaign totals and exports', async () => {
    const data = (await analytics({ category: 'Digital presence' }));
    assert.equal(data.breakdown.length, 1);
    assert.equal(data.metrics.delivered, data.breakdown[0].metrics.delivered);
    assert.ok(data.metrics.ctr <= 100);
    const empty = (await analytics({ from: '1999-01-01', to: '1999-01-02' })).metrics;
    assert.equal(empty.sent, 0);
    assert.equal(empty.roi, null);
    assert.match((await exportCSV({ category: 'Membership' })), /^date,sent,delivered/);
    assert.equal(csvCell('=CMD()'), '"\'=CMD()"');
    assert.equal(csvCell('a"b'), '"a""b"');
});
test('personalization resolves tags and keeps the audit CTA', async () => {
    const lead = (await get<Lead>('leads', 'lead-6'))!;
    for (const step of [1, 2, 3])
        for (const variant of ['A', 'B'] as const) {
            const m = renderMessage(step, variant, lead);
            if (step === 1) assert.ok(m.body.startsWith(`Hi ${lead.company} Team,`));
            else assert.ok(m.body.includes(lead.firstName));
            assert.ok(m.body.includes(lead.company));
            assert.ok(m.body.includes('https://handos.co'));
            assert.ok(!m.body.includes('{{'));
        }
});
test('A/B routing learns from first-touch data and preserves deterministic allocation', async () => {
    const id = 'campaign-test';
    (await db().prepare('INSERT INTO campaigns VALUES (?,?)').run(id, JSON.stringify({ id, name: 'Experiment', category: 'Test', cost: 0, demoValue: 0, createdAt: new Date().toISOString() })));
    const original = (await get<Lead>('leads', 'lead-6'))!;
    for (let i = 0; i < 100; i++) {
        const lead = { ...original, id: `experiment-${i}`, email: `experiment-${i}@demo.example` };
        (await putLead(lead));
        (await enroll(lead.id, id));
    }
    (await runDue(new Date(Date.now() + 1000), id));
    const es = (await all<Enrollment>('enrollments')).filter(e => e.campaignId === id);
    for (const m of (await all<Message>('messages')).filter(m => es.some(e => e.id === m.enrollmentId) && m.variant === 'A'))
        (await recordEvent({ externalId: `open-${m.id}`, messageId: m.id, type: 'open', occurredAt: m.sentAt }));
    assert.equal((await experiment(id)).winner, 'A');
    assert.equal((await chooseVariant(id, 'stable-id')), (await chooseVariant(id, 'stable-id')));
    const allocations = await Promise.all(Array.from({ length: 1000 }, async (_, i) => (await chooseVariant(id, `new-${i}`))));
    const share = allocations.filter(v => v === 'A').length / 1000;
    assert.ok(share > .75 && share < .85);
});
