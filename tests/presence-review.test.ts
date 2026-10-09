import {test} from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_URL='file::memory:';
import {reviewLeadPresence} from '../lib/presence-review';
import {get,putLead} from '../lib/db';
import type {Lead} from '../lib/types';
test('a deferred prospect can run its own identity checks without losing saved contact details',async()=>{
 const seed=(await get<Lead>('leads','lead-1'))!;
 const lead:Lead={...seed,id:'pending-presence',source:'serpapi',website:null,email:'saved@localbusiness.org',listing:{categories:[],address:'100 Main St, Fairfax, VA 22030',phone:'+1 703-555-0101',fetchedAt:new Date().toISOString()},presence:{status:'unknown',checkedAt:new Date().toISOString(),queries:[],traces:[],reason:'Per-search verification limit reached. Not qualified.'}};await putLead(lead);
 let calls=0;const result=await reviewLeadPresence(lead.id,{search:async()=>{calls++;return {organic_results:[],search_information:{organic_results_state:'Fully empty'}};}});
 assert.equal(calls,2);assert.equal(result.lead.presence?.queries.length,2);assert.equal(result.lead.presence?.status,'no-additional-presence-found');assert.equal(result.lead.email,lead.email);assert.match(result.notice,/completed/);
 const failed=await reviewLeadPresence(lead.id,{search:async()=>{throw new Error('Unavailable');}});assert.equal(failed.lead.presence?.status,'unknown');assert.match(failed.notice,/incomplete/);
 await assert.rejects(()=>reviewLeadPresence('missing',{search:async()=>({})}),/Lead not found/);
});
