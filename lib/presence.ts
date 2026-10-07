import type { Lead } from './types';

export type PresenceEvidence = {
 status: 'presence-found' | 'no-additional-presence-found' | 'no-owned-website-found' | 'outdated-website' | 'unknown';
 checkedAt: string;
 queries: string[];
 traces: { title: string; url: string; kind: 'website' | 'social' | 'directory' }[];
 reason: string;
};
type SearchResponse = { organic_results?: {title?:string;link?:string}[]; search_information?: {organic_results_state?:string}; error?:string };
export interface PresenceSearch { search(query:string):Promise<SearchResponse> }
export class SerpApiPresenceSearch implements PresenceSearch {
 constructor(private key:string){}
 async search(q:string):Promise<SearchResponse>{
  const params=new URLSearchParams({engine:'google',q,api_key:this.key,num:'10',hl:'en',gl:'us'});
  const response=await fetch(`https://serpapi.com/search.json?${params}`,{signal:AbortSignal.timeout(15000),cache:'no-store'});
  if(!response.ok)throw new Error('Presence search unavailable');
  const data=await response.json();
  if(data.error)throw new Error('Presence search failed');
  return data;
 }
}
const social=/(^|\.)(facebook\.com|instagram\.com|linkedin\.com|tiktok\.com|youtube\.com|x\.com)$/i;
const directory=/(^|\.)(yelp\.com|yellowpages\.com|bbb\.org|mapquest\.com|google\.com|chamberofcommerce\.com|manta\.com|superpages\.com|angi\.com|care\.com)$/i;
export async function checkPresence(lead:Lead,search:PresenceSearch):Promise<PresenceEvidence>{
 const base={checkedAt:new Date().toISOString(),queries:[] as string[],traces:[] as PresenceEvidence['traces']};
 if(lead.website)return {...base,status:'presence-found',traces:[{title:lead.company,url:lead.website,kind:'website'}],reason:'The business listing includes a website.'};
 // Require identity anchors rather than using the requested location as if verified.
 if(!lead.company||!lead.listing?.address||!lead.listing.phone)return {...base,status:'unknown',reason:'An address and phone are required for independent identity checks.'};
 const quote=(s:string)=>`"${s.replace(/["\\]/g,' ')}"`;
 base.queries=[`${quote(lead.company)} ${quote(lead.listing.address)}`,`${quote(lead.company)} ${quote(lead.listing.phone)}`];
 try{
  for(const query of base.queries){
   const data=await search.search(query);
   if(data.error)throw new Error('Incomplete response');
   const rows=data.organic_results;
   if(!Array.isArray(rows)&&data.search_information?.organic_results_state!=='Fully empty')throw new Error('Incomplete response');
   for(const row of rows||[]){
    if(!row.link)throw new Error('Result missing link');
    const url=new URL(row.link);
    if(!['http:','https:'].includes(url.protocol))throw new Error('Unsupported result link');
    base.traces.push({title:row.title||'',url:url.href,kind:social.test(url.hostname)?'social':directory.test(url.hostname)?'directory':'website'});
   }
  }
  base.traces=[...new Map(base.traces.map(t=>[t.url,t])).values()];
  const owned=base.traces.some(t=>t.kind!=='directory');
  return {...base,status:owned?'presence-found':base.traces.length?'no-owned-website-found':'no-additional-presence-found',reason:owned?'Website or social results were found independently, even though the Maps listing had no website address. Inspect the evidence links to confirm identity.':base.traces.length?'Only directory listings were found; no business website or social account was found in the two identity searches. Potential client for an online presence audit.':'Two identity searches found no additional indexed traces. Potential client; this is not proof of absolute absence.'};
 }catch{
  return {...base,status:'unknown',reason:'Independent presence verification was incomplete or unavailable. This business is not qualified.'};
 }
}
