'use client';
import { useState } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { api } from './ui';
export function SaveLeadButton({leadId,saved,onChanged}:{leadId:string;saved:boolean;onChanged:()=>void}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function toggle(){setBusy(true);setError('');try{await api(`/api/leads/${leadId}/saved`,{saved:!saved});onChanged();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <span><button className="button secondary" disabled={busy} aria-pressed={saved} onClick={toggle}>{saved?<BookmarkCheck size={16}/>:<Bookmark size={16}/>} {busy?'Saving…':saved?'Remove':'Save for later'}</button>{error&&<small role="alert" style={{display:'block',color:'#923d17'}}>{error}</small>}</span>;
}
