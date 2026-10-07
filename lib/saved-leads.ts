import { enroll } from './engine';
import type { Enrollment } from './types';
import { db, get } from './db';
import type { Lead } from './types';
function table(){db().exec('CREATE TABLE IF NOT EXISTS saved_leads (lead_id TEXT PRIMARY KEY REFERENCES leads(id), saved_at TEXT NOT NULL)');}
export function savedLeads(){table();return (db().prepare('SELECT leads.data,saved_leads.saved_at FROM saved_leads JOIN leads ON leads.id=saved_leads.lead_id ORDER BY saved_at DESC,lead_id').all() as {data:string;saved_at:string}[]).map(r=>({...JSON.parse(r.data) as Lead,savedAt:r.saved_at}));}
export function saveLead(id:string,saved:boolean){
 if(!get<Lead>('leads',id))throw new Error('Lead not found.');table();
 if(saved)db().prepare('INSERT OR IGNORE INTO saved_leads VALUES (?,?)').run(id,new Date().toISOString());
 else db().prepare('DELETE FROM saved_leads WHERE lead_id=?').run(id);
 return {saved,notice:saved?'Lead saved for later outreach.':'Lead removed from saved list. The business record and campaign history are retained.'};
}

export function enrollSavedLeads(ids:string[],campaignId:string){
 const saved=new Set(savedLeads().map(l=>l.id));
 const results:{leadId:string;enrollmentId?:string;status?:string;error?:string}[]=[];
 for(const leadId of new Set(ids)){
  if(!saved.has(leadId)){results.push({leadId,error:'Lead is not in the saved list.'});continue;}
  try{const e:Enrollment=enroll(leadId,campaignId);results.push({leadId,enrollmentId:e.id,status:e.status});}
  catch(e){results.push({leadId,error:e instanceof Error?e.message:'Enrollment failed.'});}
 }
 return results;
}
