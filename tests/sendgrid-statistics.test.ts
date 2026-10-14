import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sendGridStatistics} from '../lib/sendgrid-statistics';
test('SendGrid totals use provider data without inventing per-message events',async()=>{
 const original=globalThis.fetch;
 process.env.SENDGRID_STATS_API_KEY='statistics-test-success';
 let calls=0;
 try{
  globalThis.fetch=async(url,init)=>{calls++;const u=new URL(String(url));assert.equal(u.pathname,'/v3/stats');assert.equal(u.searchParams.get('start_date'),'2026-10-07');assert.equal(u.searchParams.get('end_date'),'2026-10-14');assert.equal(u.searchParams.get('aggregated_by'),'day');assert.equal((init?.headers as Record<string,string>).Authorization,'Bearer statistics-test-success');return new Response(JSON.stringify([{date:'2026-10-10',stats:[{metrics:{requests:15,delivered:15,opens:14,unique_opens:8}}]},{date:'2026-10-13',stats:[{metrics:{requests:12,delivered:12,opens:12}}]}]));};
  const value=await sendGridStatistics('2026-10-07','2026-10-14');
  assert.equal(value.available,true);assert.equal(value.totals?.requests,27);assert.equal(value.totals?.delivered,27);assert.equal(value.totals?.opens,26);assert.equal(value.totals?.clicks,0);
  assert.deepEqual(await sendGridStatistics('2026-10-07','2026-10-14'),value);assert.equal(calls,1);
 }finally{globalThis.fetch=original;delete process.env.SENDGRID_STATS_API_KEY;}
});
test('missing permissions and provider errors report unavailable rather than fake zero statistics',async()=>{
 const original=globalThis.fetch;
 try{
  for(const status of [403,503]){
   process.env.SENDGRID_STATS_API_KEY='statistics-test-'+status;
   globalThis.fetch=async()=>new Response('{}',{status});
   const value=await sendGridStatistics('2026-10-07','2026-10-14');assert.equal(value.available,false);assert.equal(value.totals,undefined);assert.ok(value.reason);if(status===403)assert.match(value.reason!,/Stats Read Access/);
  }
  await assert.rejects(sendGridStatistics('2026-10-14','2026-10-07'),/Start date/);
 }finally{globalThis.fetch=original;delete process.env.SENDGRID_STATS_API_KEY;}
});
