'use client';
import { validEmail } from '@/lib/email-format';
import { useState } from 'react';
import { api, Badge, Notice } from './ui';
import { ContactEditor } from './contact-editor';
import type { EmailCandidate, Lead } from '@/lib/types';
export const hasContact=(lead:Lead)=>!!(lead.email||lead.emailCandidates?.length);
export function BulkContacts({leads,onUpdated,onBusy}:{leads:Lead[];onUpdated:(leads:Lead[])=>void;onBusy:(busy:boolean)=>void}){
 const [busy,setBusy]=useState(false),[progress,setProgress]=useState(''),[errors,setErrors]=useState<string[]>([]),[editing,setEditing]=useState('');
 const missing=leads.filter(l=>!hasContact(l));
 async function find(){
  setBusy(true);onBusy(true);setErrors([]);const failures:string[]=[];let found=0,checked=0;
  try{for(const lead of leads.filter(l=>!l.email)){
   setProgress('Finding emails: '+(++checked)+' / '+leads.filter(l=>!l.email).length+' · '+lead.company);
   try{const r=await api<{candidates:EmailCandidate[];notice:string}>('/api/leads/'+lead.id+'/contacts',{});if(r.candidates.length)found++;
    const saved=await api<{lead:Lead}>('/api/leads/'+lead.id);onUpdated([saved.lead]);
    if(!r.candidates.length)failures.push(lead.company+': '+(r.notice||'No email found. Add one manually.'));
   }catch(e){failures.push(lead.company+': '+(e as Error).message);}
  }setProgress('Lookup complete · '+found+' lead(s) with email suggestions. Select and send to approve these contacts together.');setErrors(failures);
  }finally{setBusy(false);onBusy(false);}
 }
 async function reload(id:string){try{const r=await api<{lead:Lead}>('/api/leads/'+id);onUpdated([r.lead]);}catch(e){setErrors([(e as Error).message]);}}
 return <section className="bulk-contacts panel-padding" aria-label="Selected lead emails">
 <div className="toolbar"><strong>{leads.length} selected</strong><Badge tone={missing.length?'red':'green'}>{missing.length} missing email</Badge><button className="button secondary" disabled={busy||!leads.some(l=>!l.email)} onClick={find}>{busy?'Finding emails…':'Find emails for selected leads'}</button></div>
 <p className="fine-print">Lookup uses published business pages and Hunter. Suggestions are populated automatically; email-format validation is sufficient when approving a selected campaign batch.</p>
 {progress&&<Notice>{progress}</Notice>}{!!errors.length&&<details><summary>{errors.length} lookup issue(s)</summary><ul>{errors.map((e,i)=><li key={i}>{e}</li>)}</ul></details>}
 <div className="selected-contact-list">{leads.map(lead=><div className="selected-contact" key={lead.id}><div className="toolbar"><strong>{lead.company}</strong><span>{lead.email||lead.emailCandidates?.[0]?.email||'No email found'}</span><Badge tone={!hasContact(lead)?'red':validEmail(lead.email)?'green':'amber'}>{!hasContact(lead)?'Missing email':lead.contactVerification?.email===lead.email?(lead.contactVerification.status==='manually-approved'?'Accept-all · manually approved':'Verified'):validEmail(lead.email)?'Ready for bulk approval':'Suggestion · save email'}</Badge><button className="button subtle" disabled={busy} onClick={()=>setEditing(editing===lead.id?'':lead.id)}>{editing===lead.id?'Close':hasContact(lead)?'Review / edit email':'Add email manually'}</button></div>{editing===lead.id&&<ContactEditor key={lead.id} lead={lead} onSaved={()=>void reload(lead.id)}/>}</div>)}</div>
 </section>;
}
