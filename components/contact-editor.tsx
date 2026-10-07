'use client';
import { useState } from 'react';
import { api, Notice, useData } from './ui';
import type { EmailCandidate, Lead } from '@/lib/types';
type Candidate=EmailCandidate;
export function ContactEditor({lead,onSaved}:{lead:Lead;onSaved:()=>void}){
 const {data:settings}=useData<{contactEnrichment:boolean}>('/api/settings');
 const [firstName,setFirstName]=useState(lead.firstName),[email,setEmail]=useState(lead.email||''),[source,setSource]=useState(''),[confirmed,setConfirmed]=useState(false),[candidates,setCandidates]=useState<Candidate[]>(lead.emailCandidates||[]),[notice,setNotice]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function run(find:boolean){setBusy(true);setError('');try{
 if(find){const r=await api<{candidates:Candidate[];notice:string}>('/api/leads/'+lead.id+'/contacts',{});setCandidates(r.candidates);setNotice(r.notice);onSaved();}
 else{const r=await api<{notice:string}>('/api/leads/'+lead.id+'/contact',{firstName,email,source,identityConfirmed:confirmed});setNotice(r.notice);onSaved();}
 }catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <section className="panel panel-padding"><h2>Find and verify a contact</h2><p className="muted" style={{margin:'12px 0'}}>Review business identity before using a suggested email. Addresses are never guessed.</p>
 {!settings?.contactEnrichment&&<Notice>Contact verification requires a Hunter API key in the server configuration.</Notice>}
 {error&&<Notice error>{error}</Notice>}{notice&&<Notice>{notice}</Notice>}
 <button className="button secondary full" disabled={busy} onClick={()=>run(true)}>Refresh public email discovery</button>
 {lead.emailDiscovery&&!notice&&<p className="fine-print">{lead.emailDiscovery.notice}</p>}
 {candidates.map(c=><div key={c.email} style={{margin:'12px 0',overflowWrap:'anywhere'}}><button className="button subtle full" onClick={()=>{setEmail(c.email);setFirstName(c.firstName);setSource((c.sources[0]||'Hunter company suggestion')+' · reviewed for '+lead.company);setConfirmed(false);}}>{c.email} · {c.firstName} {c.lastName} {c.position}</button><small>{c.provider==='public-page'?'Published on public page':'Hunter suggestion'} · Unverified</small>{c.sources.map(url=><div key={url}><a href={url} target="_blank" rel="noreferrer" style={{color:'#2864a1',fontSize:11}}>View source ↗</a></div>)}</div>)}
 <div className="field"><label htmlFor="contact-name">First name</label><input id="contact-name" value={firstName} onChange={e=>setFirstName(e.target.value)} maxLength={100}/></div>
 <div className="field"><label htmlFor="contact-email">Business contact email</label><input id="contact-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={254}/></div>
 <div className="field"><label htmlFor="contact-source">How you confirmed this contact</label><input id="contact-source" placeholder="For example: confirmed by phone with the owner" value={source} onChange={e=>setSource(e.target.value)} maxLength={500}/></div>
 <label className="check-label" style={{margin:'16px 0'}}><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>I confirmed this email belongs to this exact business.</label>
 <button className="button primary full" disabled={busy||!confirmed||!email||source.length<3||!settings?.contactEnrichment} onClick={()=>run(false)}>{busy?'Checking…':'Verify and save contact'}</button></section>;
}

