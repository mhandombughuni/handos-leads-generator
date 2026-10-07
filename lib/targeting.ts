import type { Lead, Qualification, SearchInput } from './types';

export type Niche = {
 id: string; label: string; query: string; terms: string[];
 buyer: string; offer: string; pilot: string;
};
export type TargetIndustry = { name: string; niches: Niche[] };
const niche=(id:string,label:string,query:string,terms:string[],buyer:string,offer:string,pilot:string):Niche=>({id,label,query,terms,buyer,offer,pilot});
export const TARGET_INDUSTRIES:TargetIndustry[]=[
 {name:'Healthcare',niches:[
  niche('home-health','Home health agencies','home health care agency',['home health','home care','homecare','home healthcare'],'Agency owner or administrator','Review the path from a family inquiry to a response from the agency.','A clearer service website and non-clinical inquiry follow-up process.'),
  niche('physiotherapy','Physiotherapy / physical therapy','physical therapy clinic',['physical therap','physiotherap','physio','sports rehabilitation'],'Practice owner or clinic manager','Review how a new client finds the clinic and requests an appointment.','One service page and a simpler appointment-request journey.'),
  niche('dental','Independent dental practices','dental practice',['dentist','dental','dentistry'],'Practice owner or office manager','Review the experience from a local search to a new-patient inquiry.','A focused service page and an appointment-request workflow.'),
  niche('chiropractic','Chiropractic practices','chiropractor',['chiropract'],'Practice owner or office manager','Review how prospective clients ask questions and request a first visit.','A clearer first-visit page and non-clinical inquiry follow-up.')
 ]},
 {name:'Construction',niches:[
  niche('remodeling','Remodelers & general contractors','remodeling contractor',['remodel','general contractor','home builder','construction company','renovation'],'Owner or operations manager','Review how homeowners request an estimate and hear back.','An estimate-request form and a simple inquiry tracking view.'),
  niche('roofing','Roofing contractors','roofing contractor',['roofing','roofer'],'Owner or office manager','Review how a property owner requests a quote and receives follow-up.','A quote-request page and organized follow-up for incoming requests.'),
  niche('hvac','HVAC contractors','HVAC contractor',['hvac','air conditioning contractor','heating contractor','heating and cooling'],'Owner or service manager','Review how customers request service and understand the next step.','A clearer service-request flow and one place to track responses.'),
  niche('plumbing','Plumbing businesses','plumber',['plumb'],'Owner or service manager','Review the path from finding a plumber to requesting service.','A service-request form and straightforward follow-up tracking.'),
  niche('electrical','Electrical contractors','electrician',['electrician','electrical contractor'],'Owner or office manager','Review how customers request a quote and provide job details.','A quote-request page with a lightweight job-inquiry workflow.')
 ]},
 {name:'Legal',niches:[
  niche('family-law','Family law practices','family law attorney',['family law','divorce lawyer','divorce attorney'],'Firm owner or practice manager','Review how a prospective client requests an initial consultation.','Clear consultation information and non-sensitive inquiry tracking.'),
  niche('immigration-law','Immigration law practices','immigration attorney',['immigration attorney','immigration lawyer','immigration law'],'Firm owner or office manager','Review how prospective clients understand services and request a consultation.','A clearer services page and non-sensitive consultation requests.'),
  niche('estate-law','Estate planning practices','estate planning attorney',['estate planning','probate attorney','probate lawyer','elder law'],'Firm owner or practice manager','Review the journey from a service question to a consultation request.','A focused service page and an organized inquiry follow-up process.'),
  niche('small-law','General small law practices','law office',['law office','law firm','attorney','lawyer','legal services'],'Firm owner or office manager','Review how visitors choose a service and request a consultation.','A clearer consultation path and non-sensitive inquiry tracking.')
 ]},
 {name:'Finance',niches:[
  niche('accounting','Accounting & bookkeeping firms','bookkeeping accounting firm',['accountant','accounting','bookkeep','certified public accountant','cpa'],'Firm owner or managing partner','Review how a business requests accounting help and receives a response.','A service-inquiry page and organized prospect follow-up.'),
  niche('tax','Tax preparation practices','tax preparation service',['tax preparation','tax consultant','tax service','tax advisor'],'Owner or office manager','Review how new clients understand services and request an appointment.','A clear appointment-request path and non-sensitive inquiry tracking.'),
  niche('insurance','Independent insurance agencies','independent insurance agency',['insurance agency','insurance broker'],'Agency owner or office manager','Review how customers request information and hear back from the agency.','A general inquiry flow and response tracking, without sensitive policy data.'),
  niche('mortgage','Mortgage brokers','mortgage broker',['mortgage broker'],'Broker owner or operations manager','Review how prospective clients request an initial conversation.','A consultation-request journey, separate from financial applications.')
 ]},
 {name:'Home Services',niches:[niche('cleaning','Cleaning services','house cleaning service',['cleaning','cleaner','maid'],'Owner','Review the quote-request and follow-up experience.','A quote form and inquiry tracking.'),niche('landscaping','Landscaping businesses','landscaping company',['landscap','lawn care','lawn service'],'Owner','Review how property owners request an estimate.','A service page and estimate-request workflow.')]},
 {name:'Nonprofit',niches:[niche('community','Community organizations','community nonprofit organization',['nonprofit','non-profit','community center','charity','charitable'],'Executive director or operations lead','Review how people ask about programs and receive a response.','A program-inquiry page and centralized response tracking.')]},
 {name:'Education',niches:[niche('tutoring','Tutoring & learning centers','tutoring center',['tutor','learning center','learning centre'],'Center owner or director','Review how families request information and book an introductory call.','A program-inquiry page and follow-up view.')]},
 {name:'Membership',niches:[niche('associations','Local associations & clubs','membership club association',['association','club','alliance'],'Director or membership manager','Review the journey from membership interest to a response.','A membership-inquiry form and response tracking.')]},
 {name:'Automotive',niches:[niche('auto-repair','Auto repair shops','auto repair shop',['auto repair','auto care','mechanic','automotive repair'],'Shop owner or service manager','Review how a customer requests service and hears back.','A service-request page and inquiry follow-up.')]} 
];
export const DEFAULT_EXCLUSIONS='hospital, health system, university, medical school, bank, credit union, corporate headquarters, Home Instead, Visiting Angels, Home Helpers';
export function getNiche(industry:string,id?:string):Niche|undefined {
 const sector=TARGET_INDUSTRIES.find(s=>s.name===industry);
 return id?sector?.niches.find(n=>n.id===id):sector?.niches[0];
}
export const US_STATES:Record<string,string>={AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'};
export function searchPhrase(input:SearchInput){
 const n=getNiche(input.industry,input.nicheId);
 const location=input.locationType==='state'?`${US_STATES[input.location.toUpperCase()]||input.location}, United States`:input.locationType==='zip'?`ZIP code ${input.location}, United States`:input.location;
 return `${n?.query||input.industry} in ${location}`;
}
export function exclusionTerms(value:string|undefined){return (value??DEFAULT_EXCLUSIONS).split(',').map(t=>t.trim().toLowerCase()).filter(Boolean).slice(0,30);}
function contains(text:string,term:string){
 const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`,'i').test(text);
}
export function qualifyLead(lead:Lead,input:SearchInput,similarListings=1):Qualification{
 const profile=getNiche(input.industry,input.nicheId);
 const categories=lead.listing?.categories||[];
 const text=[lead.company,...categories].join(' ').toLowerCase();
 const matched=!!profile&&profile.terms.some(t=>text.includes(t));
 const blockedTerms=exclusionTerms(input.excludeTerms).filter(t=>contains(text,t));
 const closed=/permanently closed/i.test(lead.listing?.status||'');
 const institutional=blockedTerms.length>0;
 const independent=/\b(independent|locally owned|family owned|owner operated)\b/i.test(text);
 const evidence:string[]=[],cautions:string[]=[];
 let score=0;
 if(matched){score+=45;evidence.push(`Name or listing category matches ${profile!.label.toLowerCase()}.`);}else cautions.push('The returned name and categories do not establish a match to the selected niche.');
 if(lead.listing?.phone){score+=15;evidence.push('A public business phone is available for contact verification.');}else cautions.push('No public phone was returned; verify a contact route.');
 if(lead.website){score+=10;evidence.push('A website link is available for an audit.');}else cautions.push('No website link was returned. This does not prove the business has no website.');
 if(lead.listing?.address){score+=10;evidence.push('The provider returned a business address; check it against your target area.');}
 if(independent){score+=10;evidence.push('The business name/category describes independent or local ownership; confirm it.');}
 if(lead.source==='observed'||lead.audit.source==='observed'){
  if((lead.audit.opportunity??0)>=60){score+=10;evidence.push('A separately observed audit suggests a specific digital opportunity.');}
 }
 if(similarListings>1){score-=15;cautions.push(`${similarListings} results share this website. This may indicate multiple locations or a shared directory; verify ownership.`);}
 if(institutional){score-=40;cautions.push(`Matched your exclusion terms: ${blockedTerms.join(', ')}.`);}
 if(closed){score=0;cautions.push('The provider marks this listing permanently closed.');}
 cautions.push('Employee count, ownership, decision authority, budget, and buying timeline are unverified.');
 if(lead.source==='demo')cautions.push('This is a fictional demo business; listing signals are simulated.');
 score=Math.max(0,Math.min(100,score));
 const status=closed||institutional?'exclude':matched&&score>=65&&similarListings===1?'priority':'review';
 return {nicheId:profile?.id||'',nicheLabel:profile?.label||input.industry,score,status,matchedNiche:matched,evidence,cautions,buyer:profile?.buyer||'Owner or operations manager',offer:profile?.offer||'Offer a free review of the inquiry journey.',pilot:profile?.pilot||'Agree on one small, useful first project.',assessedAt:new Date().toISOString()};
}
export function readinessCount(lead:Lead){return ['decisionMaker','needConfirmed','budgetConfirmed','timelineConfirmed'].filter(k=>lead.salesReadiness?.[k as keyof NonNullable<Lead['salesReadiness']>]===true).length;}
