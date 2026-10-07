import type { Lead } from './types';
export function isPotentialClient(lead:Lead){
 return lead.source==='demo'?lead.signals.hasWebsite===false||lead.signals.staleDesign===true:['no-additional-presence-found','no-owned-website-found','outdated-website'].includes(lead.presence?.status||'');
}
export function presenceLabel(lead:Lead){
 if(lead.source==='demo')return lead.signals.staleDesign?'Outdated website · demo':'No website · demo';
 const status=lead.presence?.status;
 return status==='outdated-website'?'Outdated website · potential client':status==='no-owned-website-found'?'Directory only · no website found':status==='no-additional-presence-found'?'No website found':status==='presence-found'?(lead.website?'Website found':'Other web / social traces found'):'Unverified';
}
