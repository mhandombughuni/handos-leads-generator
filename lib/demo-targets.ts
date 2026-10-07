import { scoreAudit } from './audit';
import { qualifyLead } from './targeting';
import type { Lead } from './types';
export function targetDemoLeads():Lead[]{
 const examples=[
 ['home-health','Healthcare','Harbor Home Health Agency','Home health care service'],
 ['physiotherapy','Healthcare','Maple Physiotherapy Clinic','Physical therapy clinic'],
 ['remodeling','Construction','Cedar Home Remodeling','Remodeler'],
 ['roofing','Construction','Beacon Roofing','Roofing contractor'],
 ['hvac','Construction','Local Heating & Cooling','HVAC contractor'],
 ['family-law','Legal','Morgan Family Law','Family law attorney'],
 ['immigration-law','Legal','Northside Immigration Law','Immigration attorney'],
 ['estate-law','Legal','Park Estate Planning','Estate planning attorney'],
 ['accounting','Finance','Elm Accounting & Bookkeeping','Accountant'],
 ['tax','Finance','Harbor Tax Preparation','Tax preparation service'],
 ['insurance','Finance','Independent Oak Insurance','Insurance agency'],
 ];
 return examples.map(([nicheId,industry,company,category],i)=>{
 const signals={hasWebsite:true,https:true,mobile:i%2===0,clearCTA:false,intakeForm:false,booking:false,integratedWorkflow:false,staleDesign:i%2!==0};
 const l:Lead={id:`demo-target-${nicheId}`,company,industry,firstName:'Alex',email:`${nicheId}@handos-demo.example`,city:'Boston',state:'MA',zip:'02108',website:`https://${nicheId}.example`,source:'demo',signals,audit:scoreAudit(signals),createdAt:new Date().toISOString(),listing:{categories:[category],address:'100 Demo Street, Boston, MA 02108',phone:`+1 617-555-01${String(i).padStart(2,'0')}`,fetchedAt:new Date().toISOString()}};
 return {...l,qualification:qualifyLead(l,{locationType:'city',location:'Boston',industry,nicheId})};
 });
}
