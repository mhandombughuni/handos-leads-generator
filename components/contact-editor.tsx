'use client';
import { useState } from 'react';
import { api, Badge, Notice, useData } from './ui';
import type { EmailCandidate, Lead } from '@/lib/types';
type Candidate=EmailCandidate;
export function ContactEditor({lead,onSaved}:{lead:Lead;onSaved:()=>void}){
 const {data:settings}=useData<{contactEnrichment:boolean}>('/api/settings');
 const [approved,setApproved]=useState(lead.outreachApproval?.approved||false),[approvalNote,setApprovalNote]=useState(lead.outreachApproval?.note||''),[approvalSaved,setApprovalSaved]=useState(lead.outreachApproval?.approved||false);
 const verified=lead.contactVerification?.status==='verified'&&lead.contactVerification.email===lead.email;
 const [approveAcceptAll,setApproveAcceptAll]=useState(false);
 const manuallyApproved=lead.contactVerification?.status==='manually-approved'&&lead.contactVerification.email===lead.email;
 const fieldId='contact-'+lead.id;
 const [firstName,setFirstName]=useState(lead.firstName),[email,setEmail]=useState(lead.email||''),[source,setSource]=useState(''),[confirmed,setConfirmed]=useState(false),[candidates,setCandidates]=useState<Candidate[]>(lead.emailCandidates||[]),[notice,setNotice]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function saveApproval(value:boolean){setBusy(true);setError('');setNotice('');try{const r=await api<{notice:string}>('/api/leads/'+lead.id+'/outreach-approval',{approved:value,note:approvalNote});setApprovalSaved(value);setApproved(value);setNotice(r.notice);onSaved();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function saveDraft(){setBusy(true);setError('');setNotice('');try{const r=await api<{notice:string}>('/api/leads/'+lead.id+'/contact-draft',{firstName,email});setNotice(r.notice);onSaved();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function run(find:boolean){setBusy(true);setError('');setNotice('');try{
 if(find){const r=await api<{candidates:Candidate[];notice:string}>('/api/leads/'+lead.id+'/contacts',{});setCandidates(r.candidates);setNotice(r.notice);onSaved();}
 else{const r=await api<{notice:string}>('/api/leads/'+lead.id+'/contact',{firstName,email,source,identityConfirmed:confirmed,approveAcceptAll});setNotice(r.notice);onSaved();}
 }catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <section className="panel panel-padding"><h2>Find and verify a contact</h2>{verified&&<p><Badge tone="green">Email verified successfully</Badge> {lead.contactVerification?.email}</p>}{manuallyApproved&&<p><Badge tone="amber">Accept-all · manually approved</Badge> {lead.contactVerification?.email} — mailbox deliverability unconfirmed</p>}<p className="muted" style={{margin:'12px 0'}}>Save an email to use it in a selected campaign batch. Hunter verification is optional for bulk approval.</p>
 {!settings?.contactEnrichment&&<Notice>Contact verification requires a Hunter API key in the server configuration.</Notice>}

 <button className="button secondary full" disabled={busy} onClick={()=>run(true)}>Refresh public email discovery</button>
 {lead.emailDiscovery&&!notice&&<p className="fine-print">{lead.emailDiscovery.notice}</p>}
 {candidates.map(c=><div key={c.email} style={{margin:'12px 0',overflowWrap:'anywhere'}}><button className="button subtle full" onClick={()=>{setEmail(c.email);setFirstName(c.firstName);setSource((c.sources[0]||'Hunter company suggestion')+' · reviewed for '+lead.company);setConfirmed(false);setApproveAcceptAll(false);}}>{c.email} · {c.firstName} {c.lastName} {c.position}</button><small>{c.provider==='public-page'?'Published on public page':'Hunter suggestion'} · Unverified</small>{c.sources.map(url=><div key={url}><a href={url} target="_blank" rel="noreferrer" style={{color:'#2864a1',fontSize:11}}>View source ↗</a></div>)}</div>)}
 <div className="field"><label htmlFor={fieldId+'-name'}>First name</label><input id={fieldId+'-name'} value={firstName} onChange={e=>setFirstName(e.target.value)} maxLength={100}/></div>
 <div className="field"><label htmlFor={fieldId+'-email'}>Business contact email</label><input id={fieldId+'-email'} type="email" value={email} onChange={e=>{setEmail(e.target.value);setApproveAcceptAll(false);setConfirmed(false);}} maxLength={254}/></div>
 <div className="field"><label htmlFor={fieldId+'-source'}>How you confirmed this contact</label><input id={fieldId+'-source'} placeholder="For example: confirmed by phone with the owner" value={source} onChange={e=>setSource(e.target.value)} maxLength={500}/></div>
 <label className="check-label" style={{margin:'16px 0'}}><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>I confirmed this email belongs to this exact business.</label>
 <button className="button secondary full" disabled={busy||!email} onClick={saveDraft}>Save email for campaign</button>
 <label className="check-label" style={{margin:'16px 0'}}><input type="checkbox" checked={approveAcceptAll} disabled={busy} onChange={e=>setApproveAcceptAll(e.target.checked)}/>If Hunter reports accept-all, I approve this address for outreach and understand mailbox deliverability is unconfirmed.</label>
 <button className="button primary full" disabled={busy||!confirmed||!email||source.length<3||!settings?.contactEnrichment} onClick={()=>run(false)}>{busy?'Checking…':approveAcceptAll?'Check and approve contact':'Verify and save contact'}</button>
 {lead.source==='manual'&&<div className="manual-outreach-approval"><h3>Manual prospect approval</h3><p className="fine-print">You added this prospect yourself. Confirm it is suitable for outreach; this does not create an automated website audit.</p>{approvalSaved?<><Badge tone="green">Prospect approved for outreach</Badge><button className="button subtle" disabled={busy} onClick={()=>saveApproval(false)}>Remove approval</button></>:<><label className="check-label"><input type="checkbox" checked={approved} disabled={busy} onChange={e=>setApproved(e.target.checked)}/>I reviewed this prospect and approve it for outreach.</label><div className="field"><label htmlFor={fieldId+'-approval'}>Reason for outreach</label><input id={fieldId+'-approval'} value={approvalNote} disabled={busy} onChange={e=>setApprovalNote(e.target.value)} placeholder="For example: owner requested an audit, or my own test contact" maxLength={500}/></div><button className="button primary full" disabled={busy||!approved||approvalNote.trim().length<3} onClick={()=>saveApproval(true)}>Approve prospect for outreach</button></>}</div>}
 {error&&<Notice error>{error}</Notice>}{notice&&<Notice>{notice}</Notice>}
 </section>;
}

