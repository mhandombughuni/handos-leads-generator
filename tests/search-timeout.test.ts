import {test} from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_URL='file::memory:';
import {SerpApiDiscoveryProvider} from '../lib/discovery';
const input={locationType:'city' as const,location:'Fairfax, VA',industry:'Healthcare',nicheId:'home-health'};
const timing={listingTimeoutMs:10,screeningBudgetMs:25,candidateTimeoutMs:10,emailTimeoutMs:5};
test('listing timeouts retry once and return results without exposing provider credentials',async()=>{
 const original=globalThis.fetch;let calls=0;
 try{
  globalThis.fetch=async()=>{if(++calls===1)throw new DOMException('The operation timed out','TimeoutError');return new Response(JSON.stringify({local_results:[]}));};
  const result=await new SerpApiDiscoveryProvider('secret',undefined,timing).search(input);
  assert.equal(calls,2);assert.equal(result.totalReviewed,0);
  assert.ok(!JSON.stringify(result).includes('secret'));
  calls=0;globalThis.fetch=async()=>{calls++;throw new DOMException('The operation timed out','TimeoutError');};
  await assert.rejects(new SerpApiDiscoveryProvider('secret',undefined,timing).search(input),/search provider.*two attempts/i);
  assert.equal(calls,2);
 }finally{globalThis.fetch=original;}
});
test('a shared budget returns completed inspections and leaves slow listings available for individual review',async()=>{
 const original=globalThis.fetch;let inspected=0;
 try{
  globalThis.fetch=async()=>new Response(JSON.stringify({local_results:Array.from({length:20},(_,i)=>({place_id:'budget-'+i,title:'Home Health '+i,type:'Home health care service',website:'https://agency'+i+'.example'}))}));
  const started=Date.now();
  const result=await new SerpApiDiscoveryProvider('key',async url=>{
   inspected++;
   if(url.includes('agency0.'))return {url,checkedAt:new Date().toISOString(),status:'inspected',signals:{hasWebsite:true,staleDesign:false},evidence:['Complete']};
   return new Promise(()=>{});
  },timing).search(input);
  assert.ok(Date.now()-started<500);
  assert.equal(result.totalReviewed,20);assert.equal(result.excludedLeads?.length,20);
  assert.ok(inspected<=10);
  assert.equal(result.excludedLeads?.find(l=>l.website?.includes('agency0.'))?.websiteInspection?.status,'inspected');
  assert.ok(result.excludedLeads?.some(l=>l.presence?.status==='unknown'));
 }finally{globalThis.fetch=original;}
});
