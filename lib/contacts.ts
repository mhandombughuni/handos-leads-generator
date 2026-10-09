import { discoverEmails } from './email-discovery';
import { z } from 'zod';
import { get, putLead, transaction } from './db';
import type { Lead } from './types';
export const contactSchema = z.object({ firstName: z.string().trim().max(100), email: z.string().trim().email().max(254), identityConfirmed: z.literal(true), approveAcceptAll: z.boolean().default(false), source: z.string().trim().min(3).max(500) });
async function hunter(path: string, params: Record<string, string>) {
    if (!process.env.HUNTER_API_KEY)
        throw new Error('HUNTER_API_KEY is required for email verification.');
    const query = new URLSearchParams({ ...params, api_key: process.env.HUNTER_API_KEY });
    const r = await fetch('https://api.hunter.io/v2/' + path + '?' + query, { signal: AbortSignal.timeout(25000), cache: 'no-store' });
    if (r.status === 202)
        throw new Error('Hunter is still verifying this address. Wait a moment, then choose Verify and save again.');
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
    // Hunter may omit the legacy result field; status is the current verdict.
    // Reject conflicting legacy evidence and explicit catch-all/disposable flags.
    const manuallyApproved = value.approveAcceptAll && result.status === 'accept_all' && result.disposable !== true && (result.result === undefined || result.result === 'risky' || result.result === 'deliverable');
    if (!manuallyApproved && (result.status !== 'valid' || (result.result !== undefined && result.result !== 'deliverable') || result.accept_all === true || result.disposable === true))
        throw new Error('Email verification did not confirm a deliverable address (Hunter status: ' + (typeof result.status === 'string' ? result.status : 'missing') + '). Unknown and invalid addresses cannot be enrolled. Accept-all addresses require explicit manual approval.');
    return (await transaction(async () => {
        const current = (await get<Lead>('leads', id))!;
        if (current.email && current.email.toLowerCase() !== value.email.toLowerCase()) {
            const active = (await dbActiveContact(id));
            if (active)
                throw new Error('Stop active enrollments before changing their contact email.');
        }
        const updated = { ...current, firstName: value.firstName, email: value.email.toLowerCase(), contactVerification: { status: manuallyApproved ? 'manually-approved' as const : 'verified' as const, ...(manuallyApproved ? { hunterStatus: 'accept_all' as const, manualApprovedAt: new Date().toISOString() } : {}), email: value.email.toLowerCase(), provider: 'hunter', identityConfirmed: true, source: value.source, verifiedAt: new Date().toISOString() } };
        (await putLead(updated));
        return { lead: updated, notice: manuallyApproved ? 'Accept-all address manually approved for outreach. Hunter has not confirmed this mailbox exists.' : 'Contact identity confirmed by you; email deliverability verified by Hunter.' };
    }));
}
import { all } from './db';
import type { Enrollment } from './types';
async function dbActiveContact(id: string) { return (await all<Enrollment>('enrollments')).some(e => e.leadId === id && e.status === 'active'); }
