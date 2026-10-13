import {z} from 'zod';
import {db,get,transaction} from './db';
import {getCampaign} from './campaigns';
import {getCampaignSequence} from './campaign-sequence';
import {personalize,renderMessage} from './sequence';
import type {Lead,Variant} from './types';
export const messageDraftSchema=z.object({step:z.number().int().min(1).max(3),subject:z.string().trim().min(1).max(200).refine(s=>!/[\r\n]/.test(s),'Subject must be a single line.'),body:z.string().trim().min(1).max(6000).refine(s=>/https:\/\/handos\.co(?:\b|\/)/.test(s),'Keep the handos.co scheduling link in the message.')}).strict();
export type MessageDraft=z.infer<typeof messageDraftSchema>;
const key=(leadId:string,campaignId:string,step:number)=>'message-draft:'+leadId+':'+campaignId+':'+step;
export async function getMessageDrafts(leadId:string,campaignId:string){
 const drafts:Record<number,MessageDraft>={};
 for(const step of [1,2,3]){const row=await db().prepare('SELECT value FROM metadata WHERE key=?').get(key(leadId,campaignId,step));if(row)drafts[step]=messageDraftSchema.parse(JSON.parse(row.value));}
 return drafts;
}
export async function saveMessageDraft(leadId:string,campaignId:string,input:unknown){
 const draft=messageDraftSchema.parse(input);
 if(!await get<Lead>('leads',leadId)||!await getCampaign(campaignId))throw new Error('Lead or campaign not found.');
 await transaction(async()=>{
  const sent=await db().prepare('SELECT m.id FROM messages m JOIN enrollments e ON e.id=m.enrollment_id WHERE e.lead_id=? AND e.campaign_id=? AND m.step=?').get(leadId,campaignId,draft.step);
  if(sent)throw new Error('This step has already been attempted. Choose an unsent step to edit.');
  await db().prepare('INSERT INTO metadata(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key(leadId,campaignId,draft.step),JSON.stringify(draft));
 });
 return draft;
}
export async function renderLeadMessage(lead:Lead,campaignId:string,step:number,variant:Variant){
 const row=await db().prepare('SELECT value FROM metadata WHERE key=?').get(key(lead.id,campaignId,step));
 if(row){const draft=messageDraftSchema.parse(JSON.parse(row.value));return {subject:personalize(draft.subject,lead),body:personalize(draft.body,lead)};}
 return renderMessage(step,variant,lead,await getCampaignSequence(campaignId));
}
