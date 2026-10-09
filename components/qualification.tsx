'use client';
import { Check, Phone, Target } from 'lucide-react';
import { Badge, Score } from './ui';
import { readinessCount } from '@/lib/targeting';
import type { Lead, SalesReadiness } from '@/lib/types';
export function QualificationPanel({lead,busy,onSave}:{lead:Lead;busy:boolean;onSave:(value:Omit<SalesReadiness,'updatedAt'>)=>void}){
 const q=lead.qualification;
 const checked={decisionMaker:lead.salesReadiness?.decisionMaker||false,needConfirmed:lead.salesReadiness?.needConfirmed||false,budgetConfirmed:lead.salesReadiness?.budgetConfirmed||false,timelineConfirmed:lead.salesReadiness?.timelineConfirmed||false};
 return <>
 {q&&<section className="panel"><div className="panel-heading"><div><h2>Prospect fit for Handos</h2><p>{q.nicheLabel} · Based on listing evidence</p></div><Score value={q.score}/></div><div className="panel-padding qualification-detail"><Badge tone={q.status==='priority'?'green':q.status==='exclude'?'red':'amber'}>{q.status==='priority'?'Promising fit — verify first':q.status==='exclude'?'Flagged by screening rules':'Needs more research'}</Badge><h3>Why it appears here</h3>{q.evidence.length?q.evidence.map(e=><p className="evidence-line" key={e}><Check size={16}/>{e}</p>):<p className="muted">No strong listing signals support this niche yet.</p>}<h3>What to verify</h3><ul>{q.cautions.map(c=><li key={c}>{c}</li>)}</ul><div className="suggested-offer"><Target size={20}/><div><h3>Suggested audit offer</h3><p>{q.offer}</p><small>Person to ask for: {q.buyer}</small><p><strong>Possible first project:</strong> {q.pilot}</p></div></div></div></section>}
 <section className="panel"><div className="panel-heading"><div><h2>Buying-readiness checklist</h2><p>Confirm these through a real conversation.</p></div><Badge tone={readinessCount(lead)===4?'green':'neutral'}>{readinessCount(lead)} / 4 confirmed</Badge></div><div className="panel-padding readiness-checks">{([
 ['decisionMaker','I have reached someone who can approve the project.'],
 ['needConfirmed','The prospect has confirmed a specific problem to solve.'],
 ['budgetConfirmed','We have discussed an achievable project budget.'],
 ['timelineConfirmed','The prospect wants to start within 30 days.']
 ] as const).map(([key,label])=><label key={key} className="check-label"><input type="checkbox" checked={checked[key]} disabled={busy} onChange={e=>onSave({...checked,[key]:e.target.checked})}/>{label}</label>)}<p className="fine-print">These checks are saved by you, never inferred from search results. A complete checklist is a signal to pursue a scoped proposal, not a predicted closing date.</p>{lead.salesReadiness?.updatedAt&&<small>Last updated {new Date(lead.salesReadiness.updatedAt).toLocaleString()}</small>}</div></section>
 {lead.listing?.phone&&<section className="panel"><div className="panel-padding contact-list"><p><Phone size={17}/><a href={`tel:${lead.listing.phone.replace(/[^+\d]/g,'')}`}>{lead.listing.phone}</a></p><p className="muted">Public business phone from the listing. Confirm the appropriate contact before outreach.</p>{lead.listing.categories.length>0&&<p className="muted">Listed as: {lead.listing.categories.join(', ')}</p>}</div></section>}
 </>;
}
