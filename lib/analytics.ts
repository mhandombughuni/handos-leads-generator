import { all } from './db';
import type { Campaign, Enrollment, Message, Metrics, TrackingEvent } from './types';
export type Filters = {
    from?: string;
    to?: string;
    category?: string;
    campaignId?: string;
};
export async function analytics(filters: Filters = {}) {
    const campaigns = (await all<Campaign>('campaigns')).filter(c => (!filters.category || c.category === filters.category) && (!filters.campaignId || c.id === filters.campaignId));
    const cids = new Set(campaigns.map(c => c.id));
    const enrollments = (await all<Enrollment>('enrollments')).filter(e => cids.has(e.campaignId));
    const byId = new Map(enrollments.map(e => [e.id, e]));
    const campaignMessages = (await all<Message>('messages')).filter(m => byId.has(m.enrollmentId));
    const from = filters.from || '0000-01-01', to = filters.to || '9999-12-31';
    const messages = campaignMessages.filter(m => m.sentAt.slice(0, 10) >= from && m.sentAt.slice(0, 10) <= to);
    const mids = new Set(messages.map(m => m.id));
    const events = (await all<TrackingEvent>('events')).filter(e => mids.has(e.messageId));
    function compute(ms: Message[], es: TrackingEvent[], cost: number): Metrics {
        const ids = new Set(ms.map(m => m.id));
        const ev = es.filter(e => ids.has(e.messageId));
        const unique = (type: TrackingEvent['type']) => new Set(ev.filter(e => e.type === type).map(e => e.messageId));
        const delivered = unique('delivered'), opens = unique('open'), clicks = unique('click'), replies = unique('reply'), bounces = unique('bounce');
        const messageById = new Map(ms.map(m => [m.id, m]));
        const booked = new Map<string, number>();
        ev.filter(e => e.type === 'booked-demo').sort((a, b) => a.occurredAt.localeCompare(b.occurredAt)).forEach(e => { const eid = messageById.get(e.messageId)!.enrollmentId; if (!booked.has(eid))
            booked.set(eid, e.revenue); });
        const deliveredCount = delivered.size, rate = (n: number, d: number) => d ? n / d * 100 : 0;
        const revenue = [...booked.values()].reduce((a, b) => a + b, 0);
        return { sent: ms.length, delivered: deliveredCount, open: opens.size, click: clicks.size, reply: replies.size, bounce: bounces.size, unsubscribe: unique('unsubscribe').size, booked: booked.size, ctr: rate([...clicks].filter(id => delivered.has(id)).length, deliveredCount), openRate: rate([...opens].filter(id => delivered.has(id)).length, deliveredCount), bounceRate: rate(bounces.size, ms.length), replyRate: rate([...replies].filter(id => delivered.has(id)).length, deliveredCount), conversionRate: rate(booked.size, new Set(ms.map(m => m.enrollmentId)).size), cost, revenue, roi: cost ? (revenue - cost) / cost * 100 : null };
    }
    const costFor = (ms: Message[]) => campaigns.reduce((sum, c) => { const total = campaignMessages.filter(m => byId.get(m.enrollmentId)?.campaignId === c.id).length; const selected = ms.filter(m => byId.get(m.enrollmentId)?.campaignId === c.id).length; return sum + (total ? c.cost * selected / total : 0); }, 0);
    const metrics = compute(messages, events, costFor(messages));
    const history = [...new Set(messages.map(m => m.sentAt.slice(0, 10)))].sort().map(date => { const ms = messages.filter(m => m.sentAt.startsWith(date)); return { date, ...compute(ms, events, costFor(ms)) }; });
    const breakdown = campaigns.map(c => { const ms = messages.filter(m => byId.get(m.enrollmentId)?.campaignId === c.id); return { ...c, metrics: compute(ms, events, costFor(ms)) }; });
    const activity = events.map(e => ({ ...e, campaign: campaigns.find(c => c.id === byId.get(messages.find(m => m.id === e.messageId)!.enrollmentId)!.campaignId)!.name })).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 100);
    return { metrics, history, breakdown, activity, updatedAt: new Date().toISOString() };
}
export function csvCell(value: unknown) { const text = String(value ?? ''); const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text; return `"${safe.replaceAll('"', '""')}"`; }
export async function exportCSV(filters: Filters) { const data = (await analytics(filters)); const fields = ['date', 'sent', 'delivered', 'open', 'click', 'reply', 'bounce', 'unsubscribe', 'booked', 'ctr', 'bounceRate', 'replyRate', 'conversionRate', 'cost', 'revenue', 'roi'] as const; return [fields.join(','), ...data.history.map(row => fields.map(k => csvCell(row[k])).join(','))].join('\r\n'); }
