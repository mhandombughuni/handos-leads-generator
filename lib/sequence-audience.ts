import {TARGET_INDUSTRIES} from './targeting';
export const sequenceAudiences=[{id:'general',label:'General outreach'},...TARGET_INDUSTRIES.flatMap(i=>i.niches.map(n=>({id:n.id,label:i.name+' · '+n.label})))];
