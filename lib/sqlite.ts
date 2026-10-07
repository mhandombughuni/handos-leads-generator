import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { targetDemoLeads } from './demo-targets';
import { scoreAudit } from './audit';
import { renderMessage } from './sequence';
import type { Campaign, Enrollment, Lead, Message, TrackingEvent, Signals } from './types';
let connection: DatabaseSync | undefined;
export function db() {
 if(connection) return connection;
 const url=process.env.DATABASE_URL || 'file:./data/handos.sqlite';
 if(!url.startsWith('file:')) throw new Error('This MVP supports file: SQLite DATABASE_URL values only.');
 const filename=url.slice(5); if(filename!==':memory:') mkdirSync(dirname(resolve(filename)),{recursive:true});
 connection=new DatabaseSync(filename);
 connection.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS campaigns (id TEXT PRIMARY KEY, data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS enrollments (id TEXT PRIMARY KEY, lead_id TEXT NOT NULL REFERENCES leads(id), campaign_id TEXT NOT NULL REFERENCES campaigns(id), data TEXT NOT NULL, UNIQUE(lead_id,campaign_id));
 CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, enrollment_id TEXT NOT NULL REFERENCES enrollments(id), step INTEGER NOT NULL, data TEXT NOT NULL, UNIQUE(enrollment_id,step));
 CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, external_id TEXT NOT NULL UNIQUE, message_id TEXT NOT NULL REFERENCES messages(id), data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS suppressions (email TEXT PRIMARY KEY, reason TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS events_message ON events(message_id);
 `);
 if(!connection.prepare("SELECT key FROM metadata WHERE key='seeded'").get()) seed();
 if(!connection.prepare("SELECT key FROM metadata WHERE key='target-niches-v1'").get()) transaction(()=>{
  if(!db().prepare("SELECT key FROM metadata WHERE key='target-niches-v1'").get()){
   targetDemoLeads().forEach(l=>{if(!get<Lead>('leads',l.id))putLead(l);});
   db().prepare("INSERT INTO metadata VALUES ('target-niches-v1','1')").run();
  }
 });
 return connection;
}
export function transaction<T>(fn:()=>T):T {const d=db();d.exec('BEGIN IMMEDIATE');try{const result=fn();d.exec('COMMIT');return result;}catch(e){d.exec('ROLLBACK');throw e;}}
type Table = 'leads'|'campaigns'|'enrollments'|'messages'|'events';
export function all<T>(table:Table):T[] {return (db().prepare(`SELECT data FROM ${table}`).all() as {data:string}[]).map(r=>JSON.parse(r.data));}
export function get<T>(table:Table,id:string):T|undefined {const row=db().prepare(`SELECT data FROM ${table} WHERE id=?`).get(id) as {data:string}|undefined;return row?JSON.parse(row.data):undefined;}
export function putLead(lead:Lead){db().prepare('INSERT INTO leads (id,data) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(lead.id,JSON.stringify(lead));}
export function putEnrollment(e:Enrollment){db().prepare('INSERT INTO enrollments (id,lead_id,campaign_id,data) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(e.id,e.leadId,e.campaignId,JSON.stringify(e));}
export function putMessage(m:Message){db().prepare('INSERT INTO messages (id,enrollment_id,step,data) VALUES (?,?,?,?)').run(m.id,m.enrollmentId,m.step,JSON.stringify(m));}
export function putEvent(e:TrackingEvent){return db().prepare('INSERT OR IGNORE INTO events (id,external_id,message_id,data) VALUES (?,?,?,?)').run(e.id,e.externalId,e.messageId,JSON.stringify(e)).changes>0;}
function seed(){transaction(()=>{
 const now=Date.now(), ago=(n:number)=>new Date(now-n*86400000).toISOString();
 const businesses=[
 ['Harbor Community Center','Nora','Nonprofit','Boston','MA','02108',null],['Maple & Main Dental','James','Healthcare','Boston','MA','02108','https://maple-main.example'],['Bright Path Learning','Avery','Education','Boston','MA','02116','https://bright-path.example'],['Northside Auto Care','Marcus','Automotive','Cambridge','MA','02139',null],['Evergreen Member Alliance','Sofia','Membership','Boston','MA','02108','https://evergreen.example'],['Beacon Home Services','Liam','Home Services','Boston','MA','02116','https://beacon.example'],['Riverbend Wellness','Emma','Healthcare','Austin','TX','78701','https://riverbend.example'],['Oak Street Collective','Olivia','Nonprofit','Austin','TX','78702',null],['Summit Youth Club','Noah','Membership','Denver','CO','80202','https://summit.example'],['Parkside Tutoring','Mia','Education','Denver','CO','80203',null],['Cedar Family Practice','Ethan','Healthcare','Cambridge','MA','02139','https://cedar.example'],['Community Roots','Isla','Nonprofit','Boston','MA','02108','https://roots.example'],['Bridgeway Services','Aria','Home Services','Austin','TX','78701','https://bridgeway.example'],['East End Motors','Leo','Automotive','Boston','MA','02108','https://eastend.example'],['Common Ground Association','Grace','Membership','Cambridge','MA','02139',null],['Little Lantern School','Amelia','Education','Boston','MA','02108','https://lantern.example']
 ];
 const leads:Lead[]=businesses.map((b,i)=>{
 const signals:Signals={hasWebsite:!!b[6],https:i%3!==0,mobile:i%3===2,clearCTA:i%4===0,intakeForm:i%4===2,booking:i%5===0,integratedWorkflow:false,staleDesign:!!b[6]&&i%3!==2};
 return {id:`lead-${i+1}`,company:b[0]!,firstName:b[1]!,industry:b[2]!,city:b[3]!,state:b[4]!,zip:b[5]!,website:b[6],email:`${b[1]!.toLowerCase()}@business-${i+1}.example`,source:'demo',signals,audit:scoreAudit(signals),createdAt:ago(45)};
 });leads.forEach(putLead);
 // Historical synthetic cohort enables meaningful A/B and date drill-down.
 for(let i=16;i<112;i++){const original=leads[i%16];const lead={...original,id:`lead-${i+1}`,company:`${original.company} · Demo branch ${Math.floor(i/16)}`,email:`contact-${i+1}@handos-demo.example`,createdAt:ago(45)};putLead(lead);leads.push(lead);}
 const campaigns:Campaign[]=[{id:'campaign-1',name:'Local presence, better first impressions',category:'Digital presence',cost:180,demoValue:250,createdAt:ago(45)},{id:'campaign-2',name:'A simpler path from inquiry to intake',category:'Client intake',cost:140,demoValue:300,createdAt:ago(45)},{id:'campaign-3',name:'Connected communities',category:'Membership',cost:100,demoValue:200,createdAt:ago(45)}];
 campaigns.forEach(c=>db().prepare('INSERT INTO campaigns VALUES (?,?)').run(c.id,JSON.stringify(c)));
 leads.slice(16).forEach((lead,i)=>{
 const campaign=campaigns[i%3],variant=i%2===0?'A':'B',sentAt=ago(1+(i%35));
 const e:Enrollment={id:`enrollment-${i}`,leadId:lead.id,campaignId:campaign.id,variant,status:i%17===0?'bounce':'completed',nextStep:4,nextDueAt:sentAt,createdAt:sentAt};putEnrollment(e);
 if(i%17===0&&lead.email)db().prepare('INSERT OR IGNORE INTO suppressions VALUES (?,?)').run(lead.email.toLowerCase(),'bounce');
 for(let step=1;step<=(i%17===0?1:3);step++){
 const at=new Date(new Date(sentAt).getTime()-(3-step)*86400000).toISOString();
 const m:Message={id:`message-${i}-${step}`,enrollmentId:e.id,step,variant,...renderMessage(step,variant,lead),sentAt:at};putMessage(m);
 const types:TrackingEvent['type'][]=i%17===0?['bounce']:['delivered'];
 if(types[0]==='delivered') {if(i%(variant==='A'?3:4)!==0) types.push('open');if(i%4===0)types.push('click');if(step===3&&i%9===0)types.push('reply');if(step===3&&i%13===0)types.push('booked-demo');if(step===3&&i%29===0)types.push('unsubscribe');}
 types.forEach((type,j)=>putEvent({id:randomUUID(),externalId:`seed-${m.id}-${type}`,messageId:m.id,type,occurredAt:new Date(new Date(at).getTime()+j*60000).toISOString(),revenue:type==='booked-demo'?campaign.demoValue:0}));
 }
 });
 db().prepare("INSERT INTO metadata VALUES ('seeded','1')").run();
 });}
