import { AsyncLocalStorage } from 'node:async_hooks';
import postgres from 'postgres';
import { db as sqlite } from './sqlite';
import type { Lead, Enrollment, Message, TrackingEvent } from './types';
const context=new AsyncLocalStorage<{sql?:any;sqlite?:boolean}>();
let pool:ReturnType<typeof postgres>|undefined;
const usePostgres=()=>process.env.DATABASE_PROVIDER==='supabase';
function connection(){
 if(!process.env.SUPABASE_DATABASE_URL)throw new Error('SUPABASE_DATABASE_URL is required.');
 return pool??=postgres(process.env.SUPABASE_DATABASE_URL,{prepare:false,ssl:'require',max:3,connect_timeout:10,idle_timeout:20,onnotice:()=>{},connection:{search_path:'handos'}});
}
function postgresSQL(input:string){
 let i=0;let sql=input.replace(/\?/g,()=>'$'+(++i));
 if(/INSERT OR IGNORE/i.test(sql))sql=sql.replace(/INSERT OR IGNORE/i,'INSERT')+' ON CONFLICT DO NOTHING';
 if(/INSERT OR REPLACE INTO suppressions/i.test(sql))sql=sql.replace(/INSERT OR REPLACE/i,'INSERT')+' ON CONFLICT(email) DO UPDATE SET reason=excluded.reason';
 return sql;
}
function normalize(row:Record<string,unknown>){return Object.fromEntries(Object.entries(row).map(([k,v])=>[k,v instanceof Date?v.toISOString():v]));}
export function db(){
 return {exec:async(sql:string)=>{if(!usePostgres()){sqlite().exec(sql);return;}await (context.getStore()?.sql||connection()).unsafe(postgresSQL(sql));},prepare:(sql:string)=>({
 all:async(...params:any[]):Promise<any[]>=>{if(!usePostgres())return sqlite().prepare(sql).all(...params);return (await (context.getStore()?.sql||connection()).unsafe(postgresSQL(sql),params)).map(normalize);},
 get:async(...params:any[]):Promise<any>=>{if(!usePostgres())return sqlite().prepare(sql).get(...params);return (await (context.getStore()?.sql||connection()).unsafe(postgresSQL(sql),params)).map(normalize)[0];},
 run:async(...params:any[])=>{if(!usePostgres())return sqlite().prepare(sql).run(...params);const result=await (context.getStore()?.sql||connection()).unsafe(postgresSQL(sql),params);return {changes:result.count};}
 })};
}
let serial=Promise.resolve();
export async function transaction<T>(fn:()=>T|Promise<T>):Promise<T>{
 if(context.getStore())return fn();
 if(usePostgres())return connection().begin(async sql=>{await sql`select pg_advisory_xact_lock(73490201)`;return context.run({sql},fn);}) as Promise<T>;
 let unlock!:()=>void;const previous=serial;serial=new Promise<void>(r=>unlock=r);await previous;
 // Initialize/seed before BEGIN because SQLite demo seeding opens its own transaction.
 const local=sqlite();local.exec('BEGIN IMMEDIATE');
 try{const result=await context.run({sqlite:true},fn);local.exec('COMMIT');return result;}catch(e){local.exec('ROLLBACK');throw e;}finally{unlock();}
}
type Table='leads'|'campaigns'|'enrollments'|'messages'|'events';
export async function all<T>(table:Table):Promise<T[]>{return (await db().prepare(`SELECT data FROM ${table}`).all()).map(r=>JSON.parse(r.data));}
export async function get<T>(table:Table,id:string):Promise<T|undefined>{const row=await db().prepare(`SELECT data FROM ${table} WHERE id=?`).get(id);return row?JSON.parse(row.data):undefined;}
export async function putLead(l:Lead){await db().prepare('INSERT INTO leads(id,data) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(l.id,JSON.stringify(l));}
export async function putEnrollment(e:Enrollment){await db().prepare('INSERT INTO enrollments(id,lead_id,campaign_id,data) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(e.id,e.leadId,e.campaignId,JSON.stringify(e));}
export async function putMessage(m:Message){await db().prepare('INSERT INTO messages(id,enrollment_id,step,data) VALUES (?,?,?,?)').run(m.id,m.enrollmentId,m.step,JSON.stringify(m));}
export async function putEvent(e:TrackingEvent){return (await db().prepare('INSERT OR IGNORE INTO events(id,external_id,message_id,data) VALUES (?,?,?,?)').run(e.id,e.externalId,e.messageId,JSON.stringify(e))).changes>0;}
