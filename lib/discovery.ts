import { discoverEmails } from './email-discovery';
import { inspectWebsite } from './website-inspection';
import { isPotentialClient } from './opportunity';
import { createHash } from 'node:crypto';
import { all, get, putLead } from './db';
import { scoreAudit } from './audit';
import { qualifyLead, searchPhrase } from './targeting';
import { checkPresence, SerpApiPresenceSearch } from './presence';
import type { Lead, SearchInput } from './types';
export interface DiscoveryResult {
    leads: Lead[];
    excludedLeads?: Lead[];
    provider: string;
    notice: string;
    query?: string;
    totalReviewed?: number;
}
export interface DiscoveryProvider {
    search(input: SearchInput): Promise<DiscoveryResult>;
}
function websiteHost(lead: Lead) { try {
    return new URL(lead.website!).hostname.replace(/^www\./, '');
}
catch {
    return '';
} }
export function rankCandidates(candidates: Lead[], input: SearchInput) {
    const unique = [...new Map(candidates.map(l => [l.id, l])).values()];
    const frequencies = new Map<string, number>();
    unique.forEach(l => { const host = websiteHost(l); if (host)
        frequencies.set(host, (frequencies.get(host) || 0) + 1); });
    const ranked = unique.map(l => ({ ...l, qualification: qualifyLead(l, input, frequencies.get(websiteHost(l)) || 1) })).sort((a, b) => b.qualification.score - a.qualification.score);
    const excluded = (l: Lead) => input.excludeLarge !== false && (l.qualification?.status === 'exclude' || !l.qualification?.matchedNiche);
    return { leads: ranked.filter(l => !excluded(l)), excludedLeads: ranked.filter(excluded), totalReviewed: ranked.length };
}
export class MockDiscoveryProvider implements DiscoveryProvider {
    async search(input: SearchInput): Promise<DiscoveryResult> {
        const states: Record<string, string> = { massachusetts: 'MA', texas: 'TX', colorado: 'CO' };
        const location = states[input.location.toLowerCase()] || input.location;
        const candidates = (await all<Lead>('leads')).filter(l => !l.company.includes('Demo branch') && l.source === 'demo' && l[input.locationType].toLowerCase() === location.toLowerCase() && (input.industry === 'All industries' || l.industry.toLowerCase() === input.industry.toLowerCase()));
        const ranked = input.nicheId ? rankCandidates(candidates, input) : { leads: candidates, excludedLeads: [], totalReviewed: candidates.length };
        const result = { ...ranked, leads: ranked.leads.filter(l => isPotentialClient(l)), excludedLeads: [...ranked.excludedLeads, ...ranked.leads.filter(l => !isPotentialClient(l))] };
        await Promise.all([...result.leads, ...result.excludedLeads].map(putLead));
        return { ...result, provider: 'Demo directory', query: searchPhrase(input), notice: 'Fictional businesses and simulated listing evidence. Fit scores prioritize review; they do not verify business size or predict a sale.' };
    }
}
export type SerpListing = {
    place_id?: string;
    data_id?: string;
    title?: string;
    website?: string;
    address?: string;
    phone?: string;
    type?: string;
    types?: string[];
    rating?: number;
    reviews?: number;
    open_state?: string;
};
export function normalizeListing(r: SerpListing, input: SearchInput): Lead {
    const website = r.website && /^https?:\/\//i.test(r.website) ? r.website : null;
    const signals = { hasWebsite: website ? true : null };
    // Store the actual address separately. Search location is not a verified business location.
    const address = r.address || '';
    const usLocation = address.match(/,\s*([^,]+),\s*([A-Z]{2})\s+(\d{5})(?:-\d{4})?(?:,|$)/);
    return { id: `serp-${createHash('sha256').update(r.place_id || r.data_id || `${r.title}-${r.address}`).digest('hex').slice(0, 20)}`, company: r.title || 'Unnamed organization', firstName: '', email: null, industry: input.industry, city: usLocation?.[1] || '', state: usLocation?.[2] || '', zip: usLocation?.[3] || '', website, signals, audit: scoreAudit(signals, 'unverified'), source: 'serpapi', createdAt: new Date().toISOString(), listing: { categories: [...new Set([r.type, ...(r.types || [])].filter((v): v is string => typeof v === 'string'))], address, phone: typeof r.phone === 'string' ? r.phone : undefined, rating: typeof r.rating === 'number' ? r.rating : undefined, reviews: typeof r.reviews === 'number' ? r.reviews : undefined, status: r.open_state, fetchedAt: new Date().toISOString() } };
}
export function preserveLeadHistory(fresh: Lead, existing: Lead | undefined): Lead {
    if (!existing)
        return fresh;
    return { ...fresh, createdAt: existing.createdAt, firstName: existing.firstName, email: existing.email, contactVerification: existing.contactVerification, salesReadiness: existing.salesReadiness, ...existing.audit.source === 'observed' ? { audit: existing.audit, signals: existing.signals } : {} };
}
// Discovery plus bounded independent presence checks; missing listing URLs alone never qualify.
export class SerpApiDiscoveryProvider implements DiscoveryProvider {
    constructor(private key: string, private inspect: typeof inspectWebsite = inspectWebsite) { }
    async search(input: SearchInput): Promise<DiscoveryResult> {
        const phrase = searchPhrase(input);
        const query = new URLSearchParams({ engine: 'google_maps', q: phrase, hl: 'en', gl: 'us', api_key: this.key });
        const response = await fetch(`https://serpapi.com/search.json?${query}`, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
        if (!response.ok)
            throw new Error('Discovery provider unavailable.');
        const data = await response.json();
        if (data.error)
            throw new Error('Discovery provider could not complete the search.');
        const rows: SerpListing[] = Array.isArray(data.local_results) ? data.local_results : data.place_results ? [data.place_results] : [];
        const candidates = await Promise.all(rows.slice(0, 20).map(async (r) => { const fresh = normalizeListing(r, input); return preserveLeadHistory(fresh, (await get<Lead>('leads', fresh.id))); }));
        const ranked = rankCandidates(candidates, input);
        const verified: Lead[] = [], rejected: Lead[] = [...ranked.excludedLeads];
        const search = new SerpApiPresenceSearch(this.key);
        let checked = 0;
        for (const candidate of ranked.leads) {
            if (checked >= 10) {
                rejected.push({ ...candidate, presence: { status: 'unknown', checkedAt: new Date().toISOString(), queries: [], traces: [], reason: 'Awaiting presence checks: the initial search checked its first 10 candidates. Open this lead and run its presence check.' } });
                continue;
            }
            checked++;
            const presence = await checkPresence(candidate, search);
            let lead: Lead = { ...candidate, presence };
            if (candidate.website) {
                const inspection = await this.inspect(candidate.website);
                lead = { ...lead, websiteInspection: inspection, signals: inspection.signals, audit: scoreAudit(inspection.signals, inspection.status === 'inspected' ? 'observed' : 'unverified') };
                if (inspection.signals.staleDesign)
                    lead.presence = { ...presence, status: 'outdated-website', reason: inspection.evidence.join(' ') + ' Potential client for a website refresh; confirm visually before outreach.' };
            }
            // Never convert limited negative search evidence into a definitive no-website audit.
            if (isPotentialClient(lead)) {
                lead = { ...lead, ...await discoverEmails(lead) };
                verified.push(lead);
            }
            else
                rejected.push(lead);
        }
        const result = { leads: verified, excludedLeads: rejected, totalReviewed: ranked.totalReviewed };
        await Promise.all([...result.leads, ...result.excludedLeads].map(putLead));
        return { ...result, provider: 'SerpApi', query: phrase, notice: `Reviewed ${result.totalReviewed} listings; ${verified.length} are potential clients (no website found or observed legacy website signals); ${rejected.length} excluded or unverified. Checked up to 10 candidates using bounded website inspections or two identity searches each (up to 21 provider requests including discovery). Discovery listings themselves are digital traces. Negative results do not prove absence. Evidence is available on each lead.` };
    }
}
export async function discover(input: SearchInput) {
    if (process.env.DISCOVERY_PROVIDER === 'serpapi') {
        if (!process.env.SERPAPI_KEY)
            throw new Error('SERPAPI_KEY is required for live discovery.');
        return new SerpApiDiscoveryProvider(process.env.SERPAPI_KEY).search(input);
    }
    return new MockDiscoveryProvider().search(input);
}
