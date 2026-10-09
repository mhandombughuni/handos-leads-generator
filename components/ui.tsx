'use client';
import { useEffect, useState } from 'react';
export async function api<T>(url:string,body?:unknown):Promise<T>{const response=await fetch(url,body===undefined?{cache:'no-store'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw new Error(data.error||'Something went wrong.');return data;}
export function useData<T>(url:string){const [data,setData]=useState<T|null>(null),[error,setError]=useState('');useEffect(()=>{let active=true;const load=()=>api<T>(url).then(d=>{if(active){setData(d);setError('');}}).catch(e=>{if(active)setError(e.message);});load();const interval=setInterval(load,15000);return()=>{active=false;clearInterval(interval);};},[url]);return {data,error,setData};}
export function Badge({children,tone='neutral'}:{children:React.ReactNode;tone?:string}){return <span className={`badge ${tone}`}>{children}</span>}
export function Notice({children,error=false}:{children:React.ReactNode;error?:boolean}){return <div role={error?'alert':'status'} className={`notice ${error?'error':''}`}>{children}</div>}
export function Loading(){return <div className="loading" role="status"><span className="spinner"/>Loading your workspace…</div>}
export function Score({value}:{value:number|null}){return <span className={`score ${value===null?'unknown':value>=70?'high':value>=40?'medium':'low'}`}>{value??'—'}<small>/100</small></span>}
export const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
export const pct=(n:number|null)=>n===null?'—':`${n.toFixed(1)}%`;
export function PageTitle({eyebrow,title,description,action}:{eyebrow:string;title:string;description:string;action?:React.ReactNode}){return <div className="page-title"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{action}</div>}
