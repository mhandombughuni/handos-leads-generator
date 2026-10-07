import { discoverEmails } from './email-discovery';
import { z } from 'zod';
import { get, putLead, transaction } from './db';
import type { Lead } from './types';
export const contactSchema = z.object({ firstName: z.string().trim().max(100), email: z.string().trim().email().max(254), identityConfirmed: z.literal(true), source: z.string().trim().min(3).max(500) });
async function hunter(path: string, params: Record<string, string>) {
    if (!process.env.HUNTER_API_KEY)
        throw new Error('HUNTER_API_KEY is required for email verification.');
    const query = new URLSearchParams({ ...params, api_key: process.env.HUNTER_API_KEY });
    const r = await fetch('https://api.hunter.io/v2/' + path + '?' + query, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
    if (!r.ok)
        throw new Error('Contact provider unavailable or quota exhausted.');
    const data = await r.json();
    if (!data.data)
        throw new Error('Contact provider returned incomplete evidence.');
    return data.data;
}
export async function contactCandidates(id: string) {
    const lead = (await get<Lead>('leads', id));
    if (!lead)
        throw new Error('Lead not found.');
    const result = await discoverEmails(lead);
    (await transaction(async () => { const current = (await get<Lead>('leads', id))!; (await putLead({ ...current, ...result })); }));
    return { candidates: result.emailCandidates || [], notice: result.emailDiscovery?.notice };
}
export async function verifyContact(id: string, input: unknown) {
    const value = contactSchema.parse(input);
    const lead = (await get<Lead>('leads', id));
    if (!lead)
        throw new Error('Lead not found.');
    const result = await hunter('email-verifier', { email: value.email });
    if (result.status !== 'valid' || result.result !== 'deliverable')
        throw new Error('Email verification did not confirm a deliverable address. Unknown, invalid and accept-all addresses cannot be enrolled.');
    return (await transaction(async () => {
        const current = (await get<Lead>('leads', id))!;
        if (current.email && current.email.toLowerCase() !== value.email.toLowerCase()) {
            const active = (await dbActiveContact(id));
            if (active)
                throw new Error('Stop active enrollments before changing their contact email.');
        }
        const updated = { ...current, firstName: value.firstName, email: value.email.toLowerCase(), contactVerification: { status: 'verified' as const, email: value.email.toLowerCase(), provider: 'hunter', identityConfirmed: true, source: value.source, verifiedAt: new Date().toISOString() } };
        (await putLead(updated));
        return { lead: updated, notice: 'Contact identity confirmed by you; email deliverability verified by Hunter.' };
    }));
}
import { all } from './db';
import type { Enrollment } from './types';
async function dbActiveContact(id: string) { return (await all<Enrollment>('enrollments')).some(e => e.leadId === id && e.status === 'active'); }
