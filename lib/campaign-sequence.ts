import { z } from 'zod';
import { db, get } from './db';
import { sequence } from './sequence';
import type { Campaign } from './types';
const template = z.object({ subject: z.string().trim().min(1).max(200), body: z.string().trim().min(1).max(6000).refine(s => /https:\/\/handos\.co(?:\b|\/)/.test(s), 'Each message needs a handos.co scheduling link.') });
export const sequenceSchema = z.array(z.object({ step: z.number().int().min(1).max(3), delayDays: z.number().int().min(0).max(30), label: z.string().trim().min(1).max(100), A: template, B: template })).length(3).refine(s => s.every((v, i) => v.step === i + 1 && v.delayDays === [0, 3, 7][i]), 'Sequence steps must be 1, 2, 3 at days 0, 3, 7.');
export type CampaignSequence = z.infer<typeof sequenceSchema>;
export async function getCampaignSequence(campaignId: string): Promise<CampaignSequence> {
    if (!(await get<Campaign>('campaigns', campaignId)))
        throw new Error('Campaign not found.');
    const row = (await db().prepare('SELECT value FROM metadata WHERE key=?').get('sequence:' + campaignId)) as {
        value: string;
    } | undefined;
    return row ? sequenceSchema.parse(JSON.parse(row.value)) : sequenceSchema.parse(sequence);
}
export async function saveCampaignSequence(campaignId: string, input: unknown) {
    if (!(await get<Campaign>('campaigns', campaignId)))
        throw new Error('Campaign not found.');
    const parsed = sequenceSchema.parse(input);
    (await db().prepare('INSERT INTO metadata (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run('sequence:' + campaignId, JSON.stringify(parsed)));
    return parsed;
}
