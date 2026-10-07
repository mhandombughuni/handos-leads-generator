import { enroll } from './engine';
import type { Enrollment } from './types';
import { db, get } from './db';
import type { Lead } from './types';
async function table() { (await db().exec('CREATE TABLE IF NOT EXISTS saved_leads (lead_id TEXT PRIMARY KEY REFERENCES leads(id), saved_at TEXT NOT NULL)')); }
export async function savedLeads() { (await table()); return ((await db().prepare('SELECT leads.data,saved_leads.saved_at FROM saved_leads JOIN leads ON leads.id=saved_leads.lead_id ORDER BY saved_at DESC,lead_id').all()) as {
    data: string;
    saved_at: string;
}[]).map(r => ({ ...JSON.parse(r.data) as Lead, savedAt: r.saved_at })); }
export async function saveLead(id: string, saved: boolean) {
    if (!(await get<Lead>('leads', id)))
        throw new Error('Lead not found.');
    (await table());
    if (saved)
        (await db().prepare('INSERT OR IGNORE INTO saved_leads VALUES (?,?)').run(id, new Date().toISOString()));
    else
        (await db().prepare('DELETE FROM saved_leads WHERE lead_id=?').run(id));
    return { saved, notice: saved ? 'Lead saved for later outreach.' : 'Lead removed from saved list. The business record and campaign history are retained.' };
}
export async function enrollSavedLeads(ids: string[], campaignId: string) {
    const saved = new Set((await savedLeads()).map(l => l.id));
    const results: {
        leadId: string;
        enrollmentId?: string;
        status?: string;
        error?: string;
    }[] = [];
    for (const leadId of new Set(ids)) {
        if (!saved.has(leadId)) {
            results.push({ leadId, error: 'Lead is not in the saved list.' });
            continue;
        }
        try {
            const e: Enrollment = (await enroll(leadId, campaignId));
            results.push({ leadId, enrollmentId: e.id, status: e.status });
        }
        catch (e) {
            results.push({ leadId, error: e instanceof Error ? e.message : 'Enrollment failed.' });
        }
    }
    return results;
}
