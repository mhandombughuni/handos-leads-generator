import { hasApprovedContact } from './contact-eligibility';
import { validEmail } from './email-format';
import { isPotentialClient } from './opportunity';
import { createHash, randomUUID } from 'node:crypto';
import { all, db, get, putEnrollment, putEvent, putMessage, transaction } from './db';
import { renderMessage } from './sequence';
import { getCampaignSequence } from './campaign-sequence';
import type { Campaign, Enrollment, EventType, Lead, Message, TrackingEvent, Variant } from './types';
const stops: EventType[] = ['reply', 'bounce', 'unsubscribe', 'booked-demo'];
export async function experiment(campaignId: string, source: 'live'|'demo' = process.env.EMAIL_PROVIDER === 'sendgrid' ? 'live' : 'demo') {
    const leads = new Map((await all<Lead>('leads')).map(l => [l.id, l]));
    const ids = new Set((await all<Enrollment>('enrollments')).filter(e => e.campaignId === campaignId && (source === 'demo' ? leads.get(e.leadId)?.source === 'demo' : !!leads.get(e.leadId) && leads.get(e.leadId)?.source !== 'demo')).map(e => e.id));
    const messages = (await all<Message>('messages')).filter(m => ids.has(m.enrollmentId) && m.step === 1);
    const events = (await all<TrackingEvent>('events'));
    const variants = (['A', 'B'] as Variant[]).map(variant => {
        const mids = new Set(messages.filter(m => m.variant === variant).map(m => m.id));
        const delivered = new Set(events.filter(e => mids.has(e.messageId) && e.type === 'delivered').map(e => e.messageId));
        const opened = new Set(events.filter(e => delivered.has(e.messageId) && e.type === 'open').map(e => e.messageId));
        return { variant, delivered: delivered.size, opened: opened.size, rate: delivered.size ? opened.size / delivered.size : 0 };
    });
    const winner: Variant | null = variants.every(v => v.delivered >= 20) && Math.abs(variants[0].rate - variants[1].rate) >= .05 ? (variants[0].rate > variants[1].rate ? 'A' : 'B') : null;
    return { variants, winner, policy: winner ? '80% to leading variant · 20% exploration' : '50 / 50 exploration · needs 20 deliveries per variant and a 5-point open-rate gap' };
}
export async function chooseVariant(campaignId: string, leadId: string): Promise<Variant> {
    const { winner } = (await experiment(campaignId));
    const bucket = parseInt(createHash('sha256').update(`${campaignId}:${leadId}`).digest('hex').slice(0, 8), 16) % 100;
    return winner ? (bucket < 80 ? winner : winner === 'A' ? 'B' : 'A') : (bucket < 50 ? 'A' : 'B');
}
export async function enroll(leadId: string, campaignId: string, bulkApproval=false) {
    return (await transaction(async () => {
        const lead = (await get<Lead>('leads', leadId)), campaign = (await get<Campaign>('campaigns', campaignId));
        if (!lead || !campaign)
            throw new Error('Lead or campaign not found.');
        if (!bulkApproval && lead.source !== 'demo' && !isPotentialClient(lead))
            throw new Error(lead.source==='manual'?'Approve this manual prospect for outreach in Review / edit email. Email verification and business-fit approval are separate requirements.':'Business fit is unverified or excluded. This lead has not passed independent digital presence screening; an email alone does not make it eligible for outreach.');
        if (!validEmail(lead.email))throw new Error('Add an email address in a valid format before enrollment.');
        if (!bulkApproval && lead.source !== 'demo' && !hasApprovedContact(lead))
            throw new Error('Verify the email and confirm business identity before enrolling a live lead.');
        if ((await db().prepare('SELECT email FROM suppressions WHERE email=?').get(lead.email.toLowerCase())))
            throw new Error('This contact is suppressed and cannot be enrolled.');
        const existing = (await all<Enrollment>('enrollments')).find(e => e.leadId === leadId && e.campaignId === campaignId);
        if (existing){if(bulkApproval){const approved={...existing,bulkApproval:{email:lead.email.toLowerCase(),approvedAt:new Date().toISOString()}};await putEnrollment(approved);return approved;}return existing;}
        const now = new Date().toISOString();
        const enrollment: Enrollment = { ...(bulkApproval?{bulkApproval:{email:lead.email.toLowerCase(),approvedAt:now}}:{}),id: randomUUID(), leadId, campaignId, variant: (await chooseVariant(campaignId, leadId)), status: 'active', nextStep: 1, nextDueAt: now, createdAt: now };
        (await putEnrollment(enrollment));
        return enrollment;
    }));
}
export async function recordEvent(input: {
    externalId: string;
    messageId: string;
    type: EventType;
    occurredAt?: string;
    revenue?: number;
}) {
    return (await transaction(async () => {
        const message = (await get<Message>('messages', input.messageId));
        if (!message)
            throw new Error('Message not found.');
        const occurredAt = input.occurredAt || new Date().toISOString();
        if (new Date(occurredAt).getTime() < new Date(message.sentAt).getTime() - 1000)
            throw new Error('An event cannot precede its message.');
        const e: TrackingEvent = { id: randomUUID(), externalId: input.externalId, messageId: input.messageId, type: input.type, occurredAt, revenue: input.type === 'booked-demo' ? (input.revenue || 0) : 0 };
        const inserted = (await putEvent(e));
        if (!inserted)
            return { inserted: false };
        if (stops.includes(input.type)) {
            const enrollment = (await get<Enrollment>('enrollments', message.enrollmentId))!;
            const lead = (await get<Lead>('leads', enrollment.leadId))!;
            if (lead.email)
                (await db().prepare('INSERT OR REPLACE INTO suppressions VALUES (?,?)').run(lead.email.toLowerCase(), input.type));
            const matching = new Set((await all<Lead>('leads')).filter(l => l.id === lead.id || (l.email && l.email.toLowerCase() === lead.email?.toLowerCase())).map(l => l.id));
            await Promise.all((await all<Enrollment>('enrollments')).filter(n => matching.has(n.leadId) && n.status === 'active').map(async (n) => (await putEnrollment({ ...n, status: input.type }))));
        }
        return { inserted: true };
    }));
}
export async function runDue(now = new Date(), campaignId?: string, enrollmentIds?: string[]) {
    return (await transaction(async () => {
        let sent = 0;
        for (const e of (await all<Enrollment>('enrollments'))) {
            if ((enrollmentIds && !enrollmentIds.includes(e.id)) || e.status !== 'active' || new Date(e.nextDueAt) > now || (campaignId && e.campaignId !== campaignId))
                continue;
            const lead = (await get<Lead>('leads', e.leadId))!;
            if (lead.source !== 'demo')
                continue;
            if (lead.email && (await db().prepare('SELECT email FROM suppressions WHERE email=?').get(lead.email.toLowerCase()))) {
                (await putEnrollment({ ...e, status: 'suppressed' }));
                continue;
            }
            const m: Message = { id: randomUUID(), enrollmentId: e.id, step: e.nextStep, variant: e.variant, ...renderMessage(e.nextStep, e.variant, lead, (await getCampaignSequence(e.campaignId))), sentAt: now.toISOString() };
            (await putMessage(m));
            (await putEvent({ id: randomUUID(), externalId: `demo-delivery-${m.id}`, messageId: m.id, type: 'delivered', occurredAt: now.toISOString(), revenue: 0 }));
            const nextStep = e.nextStep + 1;
            (await putEnrollment({ ...e, nextStep, status: nextStep > 3 ? 'completed' : 'active', nextDueAt: new Date(now.getTime() + (nextStep === 2 ? 3 : 4) * 86400000).toISOString() }));
            sent++;
        }
        return { sent, mode: 'demo', notice: `${sent} demo message${sent === 1 ? '' : 's'} recorded. No email was sent.` };
    }));
}
