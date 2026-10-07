'use client';
import { useState } from 'react';
import { api, Badge, Notice, useData } from './ui';
export function DeliveryReview(){
 const {data,setData}=useData<{deliveries:{messageId:string;status:string;updatedAt:string}[]}>('/api/deliveries');
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function reconcile(id:string,outcome:'accepted'|'rejected'){
  if(!window.confirm('Confirm you checked this message in SendGrid and it was '+outcome+'. This does not resend the message.'))return;
  setBusy(true);setError('');try{await api('/api/deliveries/'+id+'/reconcile',{outcome});setData(await api('/api/deliveries'));}catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 if(!data?.deliveries.length)return null;
 return <section className="panel"><div className="panel-heading"><h2>Live delivery attempts</h2><Badge>Provider acceptance is not delivery</Badge></div>{error&&<Notice error>{error}</Notice>}<div className="table-wrap"><table><thead><tr><th>Message</th><th>Status</th><th>Last updated</th><th>Review</th></tr></thead><tbody>{data.deliveries.map(d=><tr key={d.messageId}><td>{d.messageId}</td><td><Badge>{d.status}</Badge></td><td>{new Date(d.updatedAt).toLocaleString()}</td><td>{['unknown','sending','sandbox'].includes(d.status)&&<><button className="button secondary" disabled={busy} onClick={()=>reconcile(d.messageId,'accepted')}>Confirmed accepted</button><button className="button secondary" disabled={busy} onClick={()=>reconcile(d.messageId,'rejected')}>Confirmed rejected</button></>}</td></tr>)}</tbody></table></div></section>;
}
