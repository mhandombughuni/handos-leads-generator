import type { Audit, Signals } from './types';
export function scoreAudit(s: Signals, source: Audit['source'] = 'demo'): Audit {
 const base = {source, assessedAt: new Date().toISOString()};
 if(s.hasWebsite === null) return {...base,presence:null,conversion:null,workflow:null,opportunity:null,classification:'Needs verification',findings:['The discovery result did not establish whether a website exists. Verify before outreach.']};
 if(!s.hasWebsite) return {...base,presence:0,conversion:0,workflow:0,opportunity:100,classification:'No website',findings:['No website in the supplied evidence.','Offer a free review of how customers find and contact the organization.','Ask how inquiries or member registrations are handled today.']};
 const findings:string[]=[];
 if(s.mobile === false) findings.push('The supplied audit signals show no mobile-friendly layout.');
 if(s.staleDesign) findings.push('Legacy design signals suggest a website refresh opportunity; confirm visually.');
 if(s.clearCTA === false) findings.push('No clear next step for visitors in the supplied evidence.');
 if(s.intakeForm === false) findings.push('No online intake form identified. Ask how inquiries are captured.');
 if(s.booking === false) findings.push('No booking option identified. Explore the current appointment process.');
 if(s.integratedWorkflow === false) findings.push('Workflow integration is not evident. Ask how responses are tracked internally.');
 const score = (keys: (keyof Signals)[]) => keys.some(k=>s[k] === undefined) ? null : Math.round(keys.filter(k=>s[k] === true).length / keys.length * 100);
 const presence = score(['https','mobile']);
 const conversion = score(['clearCTA','intakeForm','booking']);
 const workflow = score(['intakeForm','integratedWorkflow']);
 const known = [presence,conversion,workflow].filter((n):n is number => n!==null);
 const opportunity = known.length===3 ? Math.round(100 - (presence!*.35+conversion!*.35+workflow!*.3)) : null;
 return {...base,presence,conversion,workflow,opportunity,classification:s.staleDesign||s.mobile===false?'Weak / outdated website':conversion!==null&&conversion<70?'Intake opportunity':'Needs verification',findings:findings.length?findings:['Insufficient evidence of a specific gap. Verify before making outreach claims.']};
}
