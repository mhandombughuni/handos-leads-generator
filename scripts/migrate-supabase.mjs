import { DatabaseSync } from 'node:sqlite';
import postgres from 'postgres';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
process.loadEnvFile('.env.local');
if(!process.env.SUPABASE_DATABASE_URL)throw new Error('Missing Supabase connection');
const source=process.env.DATABASE_URL||'file:./data/handos.sqlite';
if(!source.startsWith('file:'))throw new Error('Migration source must be local SQLite');
const local=new DatabaseSync(source.slice(5));
mkdirSync('data/backups',{recursive:true});
const backup=resolve('data/backups/handos-before-supabase-'+Date.now()+'.sqlite');
local.prepare('VACUUM INTO ?').run(backup);
const snapshot=new DatabaseSync(backup,{readOnly:true});
const remote=postgres(process.env.SUPABASE_DATABASE_URL,{prepare:false,ssl:'require',max:1,connect_timeout:10});
const tables=['leads','campaigns','enrollments','messages','events','suppressions','saved_leads','deliveries','metadata'];
try{
 await remote.unsafe(readFileSync('supabase/migrations/202610070001_handos.sql','utf8'));
 await remote.begin(async tx=>{
  await tx`select pg_advisory_xact_lock(73490201)`;
  for(const table of tables){const [row]=await tx.unsafe(`SELECT count(*)::int AS count FROM handos.${table}`);if(row.count)throw new Error('Destination is not empty: '+table+'. No records overwritten.');}
  for(const table of tables){
   if(!snapshot.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table))continue;
   const rows=snapshot.prepare(`SELECT * FROM ${table}`).all();
   for(const row of rows){const keys=Object.keys(row);await tx.unsafe(`INSERT INTO handos.${table} (${keys.join(',')}) VALUES (${keys.map((_,i)=>'$'+(i+1)).join(',')})`,keys.map(k=>row[k]));}
   const [count]=await tx.unsafe(`SELECT count(*)::int AS count FROM handos.${table}`);if(count.count!==rows.length)throw new Error('Count mismatch: '+table);
   // Verify every field, including history, contact data, saved IDs and timestamps.
   const imported=await tx.unsafe(`SELECT * FROM handos.${table}`);const key=table==='saved_leads'?'lead_id':table==='deliveries'?'message_id':table==='suppressions'?'email':table==='metadata'?'key':'id';
   const byKey=new Map(imported.map(r=>[r[key],r]));
   for(const row of rows){const dest=byKey.get(row[key]);for(const field of Object.keys(row)){const v=dest[field] instanceof Date?dest[field].toISOString():dest[field];if(v!==row[field])throw new Error('Field verification mismatch: '+table+'.'+field);}}
   console.log(table+': '+rows.length+' records copied and verified');
  }
 });console.log('Migration committed. Local backup: '+backup);
}catch(e){console.error('Migration failed: '+(e.code||e.message));process.exitCode=1;}finally{snapshot.close();local.close();await remote.end({timeout:2});}
