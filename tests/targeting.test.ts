import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_URL='file::memory:';
import { qualifyLead, getNiche, searchPhrase, readinessCount, TARGET_INDUSTRIES } from '../lib/targeting';
import { MockDiscoveryProvider, normalizeListing, preserveLeadHistory, rankCandidates, SerpApiDiscoveryProvider } from '../lib/discovery';
import { get, putLead } from '../lib/db';
import type { Lead, SearchInput } from '../lib/types';
const input:SearchInput={locationType:'city',location:'Boston',industry:'Healthcare',nicheId:'home-health'};
const make=(title='Harbor Home Health',type='Home health care service')=>normalizeListing({place_id:title,title,type,address:'12 Example Street, Boston, MA 02108',phone:'+1 617-555-0199',website:`https://${title.toLowerCase().replaceAll(' ','-')}.example`},input);

test('niche queries are concrete and every industry has valid unique profiles',()=>{
 assert.equal(searchPhrase(input),'home health care agency in Boston');
 assert.equal(searchPhrase({...input,nicheId:'physiotherapy'}),'physical therapy clinic in Boston');
 assert.equal(searchPhrase({...input,industry:'Construction',nicheId:'roofing'}),'roofing contractor in Boston');
 assert.equal(getNiche('Legal','home-health'),undefined);
 assert.equal(searchPhrase({...input,locationType:'state',location:'VA'}),'home health care agency in Virginia, United States');
 assert.equal(searchPhrase({...input,locationType:'zip',location:'22030'}),'home health care agency in ZIP code 22030, United States');
 const ids=TARGET_INDUSTRIES.flatMap(i=>i.niches.map(n=>n.id));assert.equal(new Set(ids).size,ids.length);
});
test('fit is grounded in listing evidence, not the selected industry or review count',()=>{
 const qualified=qualifyLead(make(),input);assert.equal(qualified.status,'priority');assert.equal(qualified.score,80);assert.ok(qualified.cautions.some(c=>c.includes('Employee count')));
 const unrelated=qualifyLead(make('Harbor Pizza','Pizza restaurant'),input);assert.equal(unrelated.matchedNiche,false);assert.equal(unrelated.status,'review');
 const a=make();const b={...a,listing:{...a.listing!,reviews:99999,rating:5}};assert.equal(qualifyLead(a,input).score,qualifyLead(b,input).score);
 assert.equal(readinessCount(a),0);
});
test('institution screening respects word boundaries and explicit custom exclusions',()=>{
 assert.equal(qualifyLead(make('University Home Health'),input).status,'exclude');
 assert.equal(qualifyLead(make('Visiting Angels Senior Home Care'),input).status,'exclude');
 assert.equal(qualifyLead(make('Riverbank Home Health'),input).status,'priority');
 assert.equal(qualifyLead(make('Harbor Home Health'),{...input,excludeTerms:'Harbor'}).status,'exclude');
 assert.equal(qualifyLead(make('University Home Health'),{...input,excludeTerms:''}).status,'priority');
 const closed=make();closed.listing!.status='Permanently closed';assert.equal(qualifyLead(closed,input).score,0);
 closed.listing!.status='Closed ⋅ Opens 9 AM';assert.notEqual(qualifyLead(closed,input).status,'exclude');
});
test('ranker deduplicates, separates flagged matches, and cautions on shared websites',()=>{
 const a=make(),b=make('Second Home Health'),c=make('Hospital Home Health'),d=make('Pizza','Restaurant');
 b.website=a.website;
 const result=rankCandidates([a,a,b,c,d],input);
 assert.equal(result.totalReviewed,4);assert.equal(result.leads.length,2);assert.equal(result.excludedLeads.length,2);
 assert.ok(result.leads.every(l=>l.qualification?.status==='review'));
 assert.ok(result.leads[0].qualification?.cautions.some(c=>c.includes('share this website')));
 assert.equal(rankCandidates([a,b,c,d],{...input,excludeLarge:false}).leads.length,4);
});
test('missing website and missing address remain unknown, not fabricated from search',()=>{
 const lead=normalizeListing({place_id:'missing',title:'Home Health',type:'Home health care service'},input);
 assert.equal(lead.audit.classification,'Needs verification');assert.equal(lead.signals.hasWebsite,null);
 assert.equal(lead.city,'');assert.equal(lead.zip,'');assert.equal(lead.state,'');
 assert.ok(qualifyLead(lead,input).cautions.some(c=>c.includes('does not prove')));
 assert.equal(make().city,'Boston');assert.equal(make().zip,'02108');
});
test('rediscovery preserves user-confirmed readiness, contacts, observed audits, and creation time',()=>{
 const old=make();old.firstName='Saved name';old.email='saved@example.test';old.createdAt='2020-01-01T00:00:00.000Z';old.audit.source='observed';old.salesReadiness={decisionMaker:true,needConfirmed:true,budgetConfirmed:false,timelineConfirmed:false,updatedAt:new Date().toISOString()};
 const fresh=make();const merged=preserveLeadHistory(fresh,old);
 assert.equal(merged.email,old.email);assert.equal(merged.firstName,old.firstName);assert.equal(merged.createdAt,old.createdAt);assert.equal(merged.audit.source,'observed');assert.equal(readinessCount(merged),2);
});
test('demo migration seeds specific niches without wiping existing work',async()=>{
 const result=await new MockDiscoveryProvider().search(input);assert.ok([...result.leads,...result.excludedLeads!].some(l=>l.id==='demo-target-home-health'));
 const lead=[...result.leads,...result.excludedLeads!][0];putLead({...lead,firstName:'Keep this'});
 await new MockDiscoveryProvider().search(input);assert.equal(get<Lead>('leads',lead.id)?.firstName,'Keep this');
});
test('provider sends one narrow query and persists returned evidence without exposing a key',async()=>{
 const original=globalThis.fetch;let calls=0;
 globalThis.fetch=async(url)=>{calls++;const query=new URL(String(url));assert.equal(query.searchParams.get('q'),'home health care agency in Boston');return new Response(JSON.stringify({local_results:[{place_id:'http-test',title:'Target Home Health',type:'Home health care service',phone:'+1 617-555-0101',website:'https://target.example',address:'1 Main St, Boston, MA 02108'}]}),{status:200});};
 try{const result=await new SerpApiDiscoveryProvider('never-log-test-key').search(input);assert.equal(calls,1);assert.equal(result.leads.length,0);assert.equal(result.provider,'SerpApi');assert.ok(!JSON.stringify(result).includes('never-log-test-key'));assert.equal(get<Lead>('leads',result.excludedLeads![0].id)?.listing?.phone,'+1 617-555-0101');}finally{globalThis.fetch=original;}
});
