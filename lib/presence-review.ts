import { get,putLead,transaction } from './db';
import { checkPresence,SerpApiPresenceSearch,type PresenceSearch } from './presence';
import { inspectWebsite } from './website-inspection';
import {scoreAudit} from './audit';
import type {Lead} from './types';
export async function reviewLeadPresence(id:string,search?:PresenceSearch,inspect=inspectWebsite){
 const lead=await get<Lead>('leads',id);if(!lead)throw new Error('Lead not found.');
 if(!search&&!process.env.SERPAPI_KEY)throw new Error('SERPAPI_KEY is required for independent presence checks.');
 let presence=await checkPresence(lead,search||new SerpApiPresenceSearch(process.env.SERPAPI_KEY!));
 const inspection=lead.website?await inspect(lead.website):undefined;
 if(inspection?.signals.staleDesign)presence={...presence,status:'outdated-website',reason:inspection.evidence.join(' ')+' Potential website refresh opportunity; review visually.'};
 const updated=await transaction(async()=>{const current=await get<Lead>('leads',id);if(!current)throw new Error('Lead not found.');const value={...current,presence,...inspection?{websiteInspection:inspection,signals:inspection.signals,audit:scoreAudit(inspection.signals,inspection.status==='inspected'?'observed':'unverified')}: {}};await putLead(value);return value;});
 return {lead:updated,notice:presence.status==='unknown'?'Presence check remains incomplete: '+presence.reason:'Presence check completed. '+presence.reason};
}
