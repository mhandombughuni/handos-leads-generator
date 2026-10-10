import type {Lead} from './types';
import {TARGET_INDUSTRIES} from './targeting';
export const sequenceAudiences=[{id:'general',label:'General outreach'},...TARGET_INDUSTRIES.flatMap(i=>i.niches.map(n=>({id:n.id,label:i.name+' · '+n.label})))];
export function audienceForLead(lead:Lead){
 if(lead.source==='demo')return 'general';
 if(lead.qualification?.nicheId&&sequenceAudiences.some(a=>a.id===lead.qualification?.nicheId))return lead.qualification.nicheId;
 if(lead.industry==='Nonprofit'){
  const text=[lead.company,...lead.listing?.categories||[]].join(' ');
  return /church|chapel|parish|congregation/i.test(text)?'churches':/christian|ministry|ministries|mission/i.test(text)?'christian-ngos':'community';
 }
 return 'general';
}
