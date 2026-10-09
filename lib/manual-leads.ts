import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { all, get, putLead, transaction } from './db';
import { saveLead } from './saved-leads';
import { scoreAudit } from './audit';
import type { Enrollment, Lead } from './types';
const email = z.union([z.string().trim().email().max(254), z.literal('')]).default('');
export const manualLeadSchema = z.object({company:z.string().trim().min(2).max(200),industry:z.string().trim().min(2).max(100),firstName:z.string().trim().max(100).default(''),email,city:z.string().trim().max(100).default(''),state:z.string().trim().max(100).default(''),zip:z.string().trim().max(20).default(''),website:z.union([z.string().trim().url().max(1000).refine(v=>/^https?:\/\//i.test(v),'Use an HTTP or HTTPS website.'),z.literal('')]).default('')}).strict();
export async function createManualLead(input:unknown){
 const value=manualLeadSchema.parse(input),now=new Date().toISOString();
 const lead:Lead={...value,id:'manual-'+randomUUID(),email:value.email.toLowerCase()||null,website:value.website||null,source:'manual',signals:{hasWebsite:value.website?true:null},audit:scoreAudit({hasWebsite:value.website?true:null},'unverified'),createdAt:now};
 await transaction(async()=>{await putLead(lead);await saveLead(lead.id,true);});
 return {lead,notice:'Lead added to saved leads. Review business fit and verify the contact before outreach.'};
}
export async function saveContactDraft(id:string,input:unknown){
 const value=z.object({firstName:z.string().trim().max(100),email:z.string().trim().email().max(254)}).strict().parse(input);
 return transaction(async()=>{
  const lead=await get<Lead>('leads',id);if(!lead)throw new Error('Lead not found.');
  const email=value.email.toLowerCase(),changed=lead.email?.toLowerCase()!==email;
  if(changed&&(await all<Enrollment>('enrollments')).some(e=>e.leadId===id&&e.status==='active'))throw new Error('Stop active enrollments before changing their contact email.');
  const updated={...lead,firstName:value.firstName,email,contactVerification:changed?undefined:lead.contactVerification};await putLead(updated);
  return {lead:updated,notice:'Email saved. Confirm identity and verify deliverability before live sending.'};
 });
}

export async function approveManualOutreach(id:string,input:unknown){
 const value=z.object({approved:z.boolean(),note:z.string().trim().max(500)}).strict().refine(v=>!v.approved||v.note.length>=3,'Add a note explaining why this prospect is suitable for outreach.').parse(input);
 return transaction(async()=>{
  const lead=await get<Lead>('leads',id);if(!lead)throw new Error('Lead not found.');
  if(lead.source!=='manual')throw new Error('Manual outreach approval is only available for manually added leads.');
  const updated={...lead,outreachApproval:{...value,reviewedAt:new Date().toISOString()}};await putLead(updated);
  return {lead:updated,notice:value.approved?'Prospect approved for outreach. A verified contact email is still required.':'Outreach approval removed. New sending is blocked.'};
 });
}
