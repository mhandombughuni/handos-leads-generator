import { publicError } from '@/lib/public-errors';
import { savedLeads, saveLead, enrollSavedLeads } from '@/lib/saved-leads';
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { all, get, putLead, transaction } from '@/lib/db';
import { getNiche } from '@/lib/targeting';
import { discover } from '@/lib/discovery';
import { enroll, experiment, recordEvent, runDue } from '@/lib/engine';
import { analytics, exportCSV } from '@/lib/analytics';
import { sequence } from '@/lib/sequence';
import { getCampaignSequence, saveCampaignSequence } from '@/lib/campaign-sequence';
import { contactCandidates, verifyContact } from '@/lib/contacts';
import { deliveries, deliveryConfig, processSendGridEvents, reconcileDelivery, runLiveDue, validUnsubscribe, verifySendGridSignature } from '@/lib/delivery';
import type { Campaign, Enrollment, Lead, Message, TrackingEvent } from '@/lib/types';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const searchSchema = z.object({ locationType: z.enum(['zip', 'city', 'state']), location: z.string().trim().min(2).max(100), industry: z.string().trim().min(2).max(100), nicheId: z.string().max(80).optional(), excludeLarge: z.boolean().default(true), excludeTerms: z.string().max(500).optional() }).superRefine((v, c) => { if (v.nicheId && !getNiche(v.industry, v.nicheId))
    c.addIssue({ code: 'custom', message: 'Choose a niche within the selected industry.', path: ['nicheId'] }); if (v.locationType === 'zip' && !/^\d{5}$/.test(v.location))
    c.addIssue({ code: 'custom', message: 'Enter a five-digit ZIP code.', path: ['location'] }); });
const eventSchema = z.object({ externalId: z.string().min(1).max(200), messageId: z.string().min(1).max(100), type: z.enum(['delivered', 'open', 'click', 'reply', 'bounce', 'unsubscribe', 'booked-demo']), occurredAt: z.string().datetime().optional().refine(v => !v || new Date(v).getTime() <= Date.now() + 60000, 'Event time cannot be in the future.'), revenue: z.number().min(0).max(10000000).optional() });
const filterSchema = z.object({ from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), category: z.string().max(100).optional(), campaignId: z.string().max(100).optional() }).refine(v => !v.from || !v.to || v.from <= v.to, 'Start date must precede end date.');
function authorized(req: NextRequest, secret: string | undefined) { if (!secret)
    return false; const a = Buffer.from(req.headers.get('authorization') || ''), b = Buffer.from(`Bearer ${secret}`); return a.length === b.length && timingSafeEqual(a, b); }
export async function GET(req: NextRequest, { params }: {
    params: Promise<{
        path: string[];
    }>;
}) {
    try {
        const { path } = await params;
        const key = path.join('/');
        if (key === 'settings')
            return NextResponse.json({ liveDiscovery: process.env.DISCOVERY_PROVIDER === 'serpapi' && !!process.env.SERPAPI_KEY, contactEnrichment: !!process.env.HUNTER_API_KEY, email: deliveryConfig() });
        if (key === 'saved-leads')
            return NextResponse.json({ leads: (await savedLeads()) });
        if (key === 'health')
            return NextResponse.json({ status: 'ok' });
        if (key === 'deliveries')
            return NextResponse.json({ deliveries: (await deliveries()) });
        if (key === 'unsubscribe') {
            const id = req.nextUrl.searchParams.get('messageId') || '', token = req.nextUrl.searchParams.get('token') || '';
            if (!validUnsubscribe(id, token) || !(await get<Message>('messages', id)))
                return new NextResponse('Invalid unsubscribe link', { status: 403 });
            const action = req.nextUrl.pathname + req.nextUrl.search;
            return new NextResponse('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Handos unsubscribe</title></head><body><h1>Stop Handos emails</h1><form method="POST" action="' + action.replaceAll('&', '&amp;').replaceAll('"', '&quot;') + '"><button type="submit">Unsubscribe</button></form></body></html>', { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
        }
        if (path[0] === 'campaigns' && path[2] === 'sequence' && path.length === 3)
            return NextResponse.json({ sequence: (await getCampaignSequence(path[1])) });
        if (key === 'leads')
            return NextResponse.json({ leads: (await all<Lead>('leads')).filter(l => req.nextUrl.searchParams.get('includeHistorical') === '1' || !l.company.includes('Demo branch')) });
        if (path[0] === 'leads' && path[1]) {
            const lead = (await get<Lead>('leads', path[1]));
            if (!lead)
                return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
            const enrollments = (await all<Enrollment>('enrollments')).filter(e => e.leadId === lead.id);
            const messages = (await all<Message>('messages')).filter(m => enrollments.some(e => e.id === m.enrollmentId));
            return NextResponse.json({ lead, enrollments, messages, events: (await all<TrackingEvent>('events')).filter(e => messages.some(m => m.id === e.messageId)), campaigns: (await all<Campaign>('campaigns')) });
        }
        if (key === 'campaigns')
            return NextResponse.json({ campaigns: await Promise.all((await all<Campaign>('campaigns')).map(async (c) => ({ ...c, experiment: (await experiment(c.id)), enrollments: (await all<Enrollment>('enrollments')).filter(e => e.campaignId === c.id) }))), sequence });
        if (key === 'analytics' || key === 'export') {
            const filters = filterSchema.parse(Object.fromEntries(req.nextUrl.searchParams));
            return key === 'export' ? new NextResponse((await exportCSV(filters)), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="handos-performance.csv"', 'Cache-Control': 'no-store' } }) : NextResponse.json((await analytics(filters)));
        }
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    catch (e) {
        return failure(e);
    }
}
export async function POST(req: NextRequest, { params }: {
    params: Promise<{
        path: string[];
    }>;
}) {
    try {
        const { path } = await params;
        const key = path.join('/');
        if (Number(req.headers.get('content-length') || 0) > 100000)
            return NextResponse.json({ error: 'Request too large' }, { status: 413 });
        if (key === 'webhooks/sendgrid') {
            const raw = await req.text();
            if (raw.length > 100000)
                return NextResponse.json({ error: 'Request too large' }, { status: 413 });
            if (!verifySendGridSignature(raw, req.headers.get('x-twilio-email-event-webhook-timestamp') || '', req.headers.get('x-twilio-email-event-webhook-signature') || ''))
                return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
            return NextResponse.json((await processSendGridEvents(JSON.parse(raw))));
        }
        if (key === 'unsubscribe') {
            const id = req.nextUrl.searchParams.get('messageId') || '', token = req.nextUrl.searchParams.get('token') || '';
            if (!validUnsubscribe(id, token))
                return new NextResponse('Invalid unsubscribe link', { status: 403 });
            (await recordEvent({ externalId: 'unsubscribe:' + id, messageId: id, type: 'unsubscribe' }));
            return new NextResponse('You have been unsubscribed from Handos outreach.', { headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' } });
        }
        if (key === 'events' && !authorized(req, process.env.WEBHOOK_SECRET))
            return NextResponse.json({ error: 'A valid webhook bearer secret is required.' }, { status: 401 });
        if (key === 'jobs/run' && !authorized(req, process.env.CRON_SECRET))
            return NextResponse.json({ error: 'A valid scheduler bearer secret is required.' }, { status: 401 });
        const body = await req.json();
        if (path[0] === 'leads' && path[2] === 'saved' && path.length === 3) {
            const p = z.object({ saved: z.boolean() }).strict().parse(body);
            return NextResponse.json((await saveLead(path[1], p.saved)));
        }
        if (key === 'saved-leads/campaign') {
            const p = z.object({ leadIds: z.array(z.string().min(1)).min(1).max(100), campaignId: z.string().min(1), action: z.enum(['queue', 'send']).default('queue') }).strict().parse(body);
            if (!(await get<Campaign>('campaigns', p.campaignId)))
                throw new Error('Campaign not found.');
            if (p.action === 'send' && process.env.EMAIL_PROVIDER === 'sendgrid') {
                const config = deliveryConfig();
                if (!config.enabled || !config.ready)
                    throw new Error('Live sending is disabled or incomplete. Configure SendGrid before sending.');
            }
            const results = (await enrollSavedLeads(p.leadIds, p.campaignId));
            const ids = results.flatMap(r => r.enrollmentId ? [r.enrollmentId] : []);
            const delivery = p.action === 'send' && ids.length ? (process.env.EMAIL_PROVIDER === 'sendgrid' ? await runLiveDue(new Date(), p.campaignId, ids) : (await runDue(new Date(), p.campaignId, ids))) : null;
            return NextResponse.json({ results, delivery, notice: p.action === 'queue' ? 'Selected eligible leads are queued. Each message uses the saved campaign templates and its own contact details.' : 'Due messages processed only for selected eligible leads. Follow-ups remain scheduled; inspect per-lead results and delivery attempts.' });
        }
        if (key === 'search')
            return NextResponse.json(await discover(searchSchema.parse(body)));
        if (path[0] === 'leads' && path[2] === 'contacts' && path.length === 3)
            return NextResponse.json(await contactCandidates(path[1]));
        if (path[0] === 'leads' && path[2] === 'contact' && path.length === 3)
            return NextResponse.json(await verifyContact(path[1], body));
        if (path[0] === 'leads' && path[2] === 'outcome' && path.length === 3) {
            const p = z.object({ type: z.enum(['reply', 'booked-demo']), revenue: z.number().min(0).max(10000000).default(0) }).parse(body);
            const enrolled = new Set((await all<Enrollment>('enrollments')).filter(e => e.leadId === path[1]).map(e => e.id));
            const message = (await all<Message>('messages')).filter(m => enrolled.has(m.enrollmentId)).sort((a, b) => b.sentAt.localeCompare(a.sentAt))[0];
            if (!message)
                throw new Error('No sent message exists for this lead.');
            (await recordEvent({ externalId: 'manual:' + crypto.randomUUID(), messageId: message.id, type: p.type, revenue: p.revenue }));
            return NextResponse.json({ notice: 'Outcome recorded. Follow-ups stopped across campaigns.' });
        }
        if (path[0] === 'deliveries' && path[2] === 'reconcile' && path.length === 3) {
            const p = z.object({ outcome: z.enum(['accepted', 'rejected']) }).parse(body);
            return NextResponse.json((await reconcileDelivery(path[1], p.outcome)));
        }
        if (path[0] === 'campaigns' && path[2] === 'sequence' && path.length === 3)
            return NextResponse.json({ sequence: (await saveCampaignSequence(path[1], body)), notice: 'Campaign sequence saved. Future messages use these templates.' });
        if (path[0] === 'leads' && path[2] === 'readiness' && path.length === 3) {
            const readiness = z.object({ decisionMaker: z.boolean(), needConfirmed: z.boolean(), budgetConfirmed: z.boolean(), timelineConfirmed: z.boolean() }).strict().parse(body);
            const lead = (await transaction(async () => { const lead = (await get<Lead>('leads', path[1])); if (!lead)
                throw new Error('Lead not found.'); const updated = { ...lead, salesReadiness: { ...readiness, updatedAt: new Date().toISOString() } }; (await putLead(updated)); return updated; }));
            return NextResponse.json({ lead, notice: 'Buying-readiness checks saved.' });
        }
        if (key === 'enroll') {
            const p = z.object({ leadId: z.string(), campaignId: z.string() }).parse(body);
            return NextResponse.json({ enrollment: (await enroll(p.leadId, p.campaignId)) });
        }
        if (key === 'demo/run' || key === 'jobs/run') {
            const p = z.object({ campaignId: z.string().optional() }).parse(body);
            return NextResponse.json(key === 'jobs/run' && process.env.EMAIL_PROVIDER === 'sendgrid' ? await runLiveDue(new Date(), p.campaignId) : (await runDue(new Date(), p.campaignId)));
        }
        if (key === 'events')
            return NextResponse.json((await recordEvent(eventSchema.parse(body))));
        if (key === 'demo/events') {
            const p = eventSchema.parse(body);
            const message = (await get<Message>('messages', p.messageId));
            const enrollment = message && (await get<Enrollment>('enrollments', message.enrollmentId));
            const lead = enrollment && (await get<Lead>('leads', enrollment.leadId));
            if (lead?.source !== 'demo')
                throw new Error('Simulation is only available for demo leads.');
            return NextResponse.json((await recordEvent(p)));
        }
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    catch (e) {
        return failure(e);
    }
}
function failure(e: unknown) {
 const result=publicError(e);
 return NextResponse.json({error:result.message},{status:result.status});
}
