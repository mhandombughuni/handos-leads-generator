import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { db, get, putLead, transaction, all } from '../lib/db';
import { enroll, runDue, recordEvent } from '../lib/engine';
import { saveLead, savedLeads } from '../lib/saved-leads';
import type { Lead, Enrollment, Message } from '../lib/types';
async function main(){
process.loadEnvFile('.env.local');process.env.DATABASE_PROVIDER='supabase';
const prefix='migration-check-'+randomUUID(),leadId=prefix+'-lead',campaignId=prefix+'-campaign';
try{
 const template=(await get<Lead>('leads','lead-1'))!;
 await transaction(async()=>{await putLead({...template,id:leadId,email:prefix+'@verification.example',source:'demo'});await db().prepare('INSERT INTO campaigns(id,data) VALUES (?,?)').run(campaignId,JSON.stringify({id:campaignId,name:'Migration verification',category:'Test',cost:0,demoValue:0,createdAt:new Date().toISOString()}));});
 const enrollments=await Promise.all([enroll(leadId,campaignId),enroll(leadId,campaignId)]);assert.equal(enrollments[0].id,enrollments[1].id);
 await Promise.all([runDue(new Date(),campaignId),runDue(new Date(),campaignId)]);
 const messages=(await all<Message>('messages')).filter(m=>m.enrollmentId===enrollments[0].id);assert.equal(messages.length,1);
 await saveLead(leadId,true);await saveLead(leadId,true);assert.equal((await savedLeads()).filter(l=>l.id===leadId).length,1);
 const event={externalId:prefix+'-reply',messageId:messages[0].id,type:'reply' as const};assert.equal((await recordEvent(event)).inserted,true);assert.equal((await recordEvent(event)).inserted,false);
 assert.equal((await get<Enrollment>('enrollments',enrollments[0].id))!.status,'reply');
 console.log('Supabase verification passed: concurrent enrollment/send deduplication, saved leads, events, and suppression. Only demo messages simulated.');
}finally{
 await transaction(async()=>{
 await db().prepare('DELETE FROM events WHERE message_id IN (SELECT id FROM messages WHERE enrollment_id IN (SELECT id FROM enrollments WHERE campaign_id=?))').run(campaignId);
 await db().prepare('DELETE FROM messages WHERE enrollment_id IN (SELECT id FROM enrollments WHERE campaign_id=?)').run(campaignId);
 await db().prepare('DELETE FROM enrollments WHERE campaign_id=?').run(campaignId);
 await db().prepare('DELETE FROM saved_leads WHERE lead_id=?').run(leadId);
 await db().prepare('DELETE FROM suppressions WHERE email=?').run(prefix+'@verification.example');
 await db().prepare('DELETE FROM leads WHERE id=?').run(leadId);
 await db().prepare('DELETE FROM campaigns WHERE id=?').run(campaignId);
 });
}
process.exit(0);

}
main().catch(e=>{console.error("Supabase verification failed:",e.code||e.message);process.exit(1);});
