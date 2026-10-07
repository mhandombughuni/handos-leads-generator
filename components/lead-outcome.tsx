'use client';
import { useState } from 'react';
import { api, Notice } from './ui';
export function LeadOutcome({leadId,onSaved}:{leadId:string;onSaved:()=>void}){
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 async function record(type:'reply'|'booked-demo'){setBusy(true);setError('');try{const r=await api<{notice:string}>('/api/leads/'+leadId+'/outcome',{type,revenue:0});setNotice(r.notice);onSaved();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <section className="panel panel-padding"><h2>Record a conversation outcome</h2><p className="muted" style={{margin:'12px 0'}}>Use this when a reply or consultation booking is confirmed. No revenue is assumed.</p>{error&&<Notice error>{error}</Notice>}{notice&&<Notice>{notice}</Notice>}<button className="button secondary full" disabled={busy} onClick={()=>record('reply')}>Record confirmed reply</button><button className="button secondary full" disabled={busy} onClick={()=>record('booked-demo')}>Record booked consultation</button></section>;
}

