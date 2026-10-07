import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_URL='file::memory:';
import { inspectHTML, publicIPv4 } from '../lib/website-inspection';
import { isPotentialClient } from '../lib/opportunity';
import { checkPresence } from '../lib/presence';
import { normalizeListing, SerpApiDiscoveryProvider, discover } from '../lib/discovery';
const input={locationType:'city' as const,location:'Fairfax',industry:'Healthcare',nicheId:'home-health'};
const row={place_id:'offline',title:'Fairfax Home Health',type:'Home health care service',address:'1 Main St, Fairfax, VA 22030',phone:'703-555-0100'};
const lead=()=>normalizeListing(row,input);
test('listed websites are excluded without spending verification requests',async()=>{
 const l=lead();l.website='https://example.com';
 const result=await checkPresence(l,{search:async()=>{throw new Error('must not call');}});
 assert.equal(result.status,'presence-found');
});
test('social traces exclude; directory-only results remain potential clients',async()=>{
 for(const link of ['https://facebook.com/fairfaxhome','https://yelp.com/biz/fairfax-home']){
 const result=await checkPresence(lead(),{search:async()=>({organic_results:[{title:row.title,link}]})});
 assert.equal(result.status,link.includes('yelp.com')?'no-owned-website-found':'presence-found');assert.equal(result.traces.length,1);
 }
});
test('both independent searches must finish; empty missing data is unknown',async()=>{
 let calls=0;
 const result=await checkPresence(lead(),{search:async()=>{calls++;return {organic_results:[]};}});
 assert.equal(calls,2);assert.equal(result.status,'no-additional-presence-found');
 assert.equal((await checkPresence(lead(),{search:async()=>({})})).status,'unknown');
 assert.equal((await checkPresence(lead(),{search:async()=>{throw new Error('quota');}})).status,'unknown');
 const l=lead();delete l.listing!.phone;
 assert.equal((await checkPresence(l,{search:async()=>({organic_results:[]})})).status,'unknown');
});
test('live provider returns only independently screened candidates and persists rejection evidence',async()=>{
 const original=globalThis.fetch;let calls=0;
 globalThis.fetch=async(url)=>{
  calls++;const params=new URL(String(url)).searchParams;
  return new Response(JSON.stringify(params.get('engine')==='google_maps'?{local_results:[row,{...row,place_id:'online',website:'https://online.example'}]}:{organic_results:[]}));
 };
 try{
  const result=await new SerpApiDiscoveryProvider('test-secret',async url=>({url,checkedAt:new Date().toISOString(),status:'unknown',signals:{hasWebsite:true},evidence:[]})).search(input);
  assert.equal(calls,3);assert.equal(result.leads.length,1);assert.equal(result.excludedLeads!.length,1);
  assert.equal(result.leads[0].presence?.status,'no-additional-presence-found');
  assert.equal(result.leads[0].signals.hasWebsite,null);
 }finally{globalThis.fetch=original;}
});
test('live mode with missing key never silently returns demo data',async()=>{
 const provider=process.env.DISCOVERY_PROVIDER,key=process.env.SERPAPI_KEY;
 process.env.DISCOVERY_PROVIDER='serpapi';delete process.env.SERPAPI_KEY;
 try{await assert.rejects(discover(input),/SERPAPI_KEY/);}
 finally{if(provider===undefined)delete process.env.DISCOVERY_PROVIDER;else process.env.DISCOVERY_PROVIDER=provider;if(key===undefined)delete process.env.SERPAPI_KEY;else process.env.SERPAPI_KEY=key;}
});

test('legacy HTML qualifies websites without inventing missing workflow evidence',()=>{
 const old=inspectHTML('<!DOCTYPE HTML PUBLIC "old"><html><font>Business</font><table width="800"></table></html>','https://business.example');
 assert.equal(old.signals.staleDesign,true);assert.equal(old.signals.intakeForm,undefined);
 const modern=inspectHTML('<!doctype html><html><meta name="viewport" content="width=device-width"><p>Business</p></html>','https://business.example/index.html');
 assert.equal(modern.signals.staleDesign,false);
 const l=lead();l.presence={status:'outdated-website',checkedAt:'now',queries:[],traces:[],reason:'legacy'};assert.equal(isPotentialClient(l),true);
});
test('website inspection rejects local and metadata destinations',()=>{
 for(const ip of ['127.0.0.1','10.0.0.1','169.254.169.254','172.16.0.1','192.168.1.1','100.64.0.1','::1'])assert.equal(publicIPv4(ip),false);
 assert.equal(publicIPv4('93.184.216.34'),true);
});
test('discovery includes inspected outdated websites while excluding modern websites',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({local_results:[{...row,place_id:'old',website:'https://old.example'},{...row,place_id:'new',website:'https://new.example'}]}));
 try{const result=await new SerpApiDiscoveryProvider('key',async url=>inspectHTML(url.includes('old')?'<html><frameset></frameset></html>':'<html><meta name="viewport"></html>',url)).search(input);
 assert.equal(result.leads.length,1);assert.equal(result.leads[0].presence?.status,'outdated-website');assert.equal(result.excludedLeads?.length,1);
 }finally{globalThis.fetch=original;}
});
