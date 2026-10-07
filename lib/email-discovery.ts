import { fetchPublicHTML } from './website-inspection';
import type { EmailCandidate, Lead } from './types';
const decode=(s:string)=>s.replace(/&#(x[\da-f]+|\d+);?/gi,(_,n)=>{const code=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return code<=0x10ffff?String.fromCodePoint(code):'';}).replace(/&commat;/gi,'@').replace(/&period;/gi,'.').replace(/&amp;/gi,'&');
export function extractPublicEmails(html:string){
 const clean=decode(html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<!--[\s\S]*?-->/g,''));
 const values:string[]=[];
 for(const m of clean.matchAll(/mailto:([^'"\s<>]+)/gi)){try{values.push(decodeURIComponent(m[1].split('?')[0]));}catch{}}
 const text=clean.replace(/<[^>]*>/g,' ');values.push(...(text.match(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)||[]));
 return [...new Set(values.flatMap(v=>v.split(/[;,]/)).map(v=>v.trim().toLowerCase()).filter(v=>v.length<=254&&/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)&&!/@(?:example\.(?:com|org|net)|.*\.example)$/.test(v)&&!/^\w+\.(png|jpg|gif|svg|webp)@/.test(v)))].slice(0,20);
}
export function contactPageLinks(html:string,address:string){
 const base=new URL(address),links:string[]=[];
 for(const m of html.matchAll(/<a\b[^>]*href\s*=\s*['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a>/gi)){
  try{const url=new URL(decode(m[1]),base);url.hash='';if(url.origin===base.origin&&/contact|about|team/i.test(url.pathname+' '+m[2].replace(/<[^>]*>/g,'')))links.push(url.href);}catch{}
 }
 return [...new Set(links)].slice(0,2);
}
export async function discoverEmails(lead:Lead,read=fetchPublicHTML):Promise<Pick<Lead,'emailCandidates'|'emailDiscovery'>>{
 const candidates:EmailCandidate[]=[],problems:string[]=[];
 const roots=[...new Set([lead.website,...(lead.presence?.traces.filter(t=>t.kind==='directory').map(t=>t.url)||[])].filter((s):s is string=>!!s))].slice(0,2);
 let pages=0;
 for(const root of roots){
  try{const page=await read(root);pages++;const urls=root===lead.website?[page.url,...contactPageLinks(page.html,page.url)]:[page.url];
   for(const url of urls){try{const content=url===page.url?page:await read(url);if(url!==page.url)pages++;for(const email of extractPublicEmails(content.html))candidates.push({email,firstName:'',lastName:'',position:'',provider:'public-page',sources:[content.url]});}catch{problems.push('A contact page was unavailable.');}}
  }catch{problems.push('A public source was unavailable.');}
 }
 if(process.env.HUNTER_API_KEY){
  try{const params=new URLSearchParams({api_key:process.env.HUNTER_API_KEY,limit:'10'});if(lead.website){params.set('domain',new URL(lead.website).hostname.replace(/^www\./,''));}else params.set('company',lead.company);
   const response=await fetch('https://api.hunter.io/v2/domain-search?'+params,{signal:AbortSignal.timeout(15000),cache:'no-store'});if(!response.ok)throw new Error('Hunter unavailable');const data=await response.json();if(!data.data)throw new Error('Incomplete Hunter response');
   for(const e of data.data.emails||[])if(typeof e.value==='string')candidates.push({email:e.value.toLowerCase(),firstName:e.first_name||'',lastName:e.last_name||'',position:e.position||'',provider:'hunter',sources:(e.sources||[]).map((s:{uri?:string})=>s.uri).filter((s:unknown):s is string=>typeof s==='string'&&/^https?:\/\//i.test(s))});
  }catch{problems.push('Hunter unavailable or quota exhausted.');}
 }
 const unique=new Map<string,EmailCandidate>();for(const c of candidates){const prior=unique.get(c.email);unique.set(c.email,prior?{...prior,firstName:prior.firstName||c.firstName,sources:[...new Set([...prior.sources,...c.sources])]}:c);}
 const found=[...unique.values()].slice(0,20);
 return {emailCandidates:found,emailDiscovery:{checkedAt:new Date().toISOString(),status:found.length?'found':problems.length?'incomplete':'not-found',notice:`${found.length} public/provider email suggestion(s); ${pages} public pages inspected. ${problems.join(' ')} Confirm business identity and verify deliverability before outreach. Contact forms without a published address do not reveal an email.`}};
}
