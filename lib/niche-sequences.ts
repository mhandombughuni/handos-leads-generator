import { TARGET_INDUSTRIES } from './targeting';
import nonprofitSequences from './nonprofit-sequences.json';
import type { CampaignSequence } from './campaign-sequence';

// Share the discovery profiles with outreach so every selected niche has a matching offer.
export function defaultNicheSequence(audience: string): CampaignSequence | undefined {
 const nonprofit = (nonprofitSequences as Record<string, CampaignSequence>)[audience];
 if (nonprofit) return nonprofit;
 const niche = TARGET_INDUSTRIES.flatMap(i => i.niches).find(n => n.id === audience);
 if (!niche) return undefined;
 const offer = niche.offer.charAt(0).toLowerCase() + niche.offer.slice(1).replace(/\.$/, '');
 const pilot = niche.pilot.charAt(0).toLowerCase() + niche.pilot.slice(1).replace(/\.$/, '');
 const close = '\n\nIf useful, choose a time for a free 15-minute walkthrough: https://handos.co\n\nBest,\nThe Handos team';
 return [
  {step:1, delayDays:0, label:'A useful first conversation',
   A:{subject:'A free review for {{company_name}}', body:`Hi {{company_name}} Team,\n\nWe work on websites and inquiry workflows for ${niche.label.toLowerCase()}. We would be happy to ${offer}.\n\nWould a complimentary review and a few practical suggestions be useful?${close}`},
   B:{subject:`${niche.label}: a clearer next step at {{company_name}}`, body:`Hi {{company_name}} Team,\n\nCould we offer a fresh perspective on how people connect with {{company_name}}? For ${niche.label.toLowerCase()}, our starting point is to ${offer}.\n\nWe can discuss what is working well and whether a small improvement would help.${close}`}},
  {step:2, delayDays:3, label:'Explore the niche-specific inquiry journey',
   A:{subject:'A practical first project for {{company_name}}', body:`Hi {{first_name}},\n\nFollowing up on the free review: one possible first project for {{company_name}} is ${pilot}.\n\nWe would first learn how your team handles inquiries today and agree on what would be useful.${close}`},
   B:{subject:'Following up on the review for {{company_name}}', body:`Hi {{first_name}},\n\nWould it help to ${offer}? We can walk through the experience together and suggest a manageable next step, such as ${pilot}.\n\nThere is no need to commit to a project to have the conversation.${close}`}},
  {step:3, delayDays:7, label:'Close with a manageable next step',
   A:{subject:'Should we close the loop at {{company_name}}?', body:`Hi {{first_name}},\n\nOne last note about our offer to ${offer}. If this is a priority for {{company_name}}, we would be glad to explore ${pilot}.\n\nIf now is not a good time, no problem.${close}`},
   B:{subject:'A small next step for {{company_name}}', body:`Hi {{first_name}},\n\nI will close the loop after this. Our offer is a free conversation about ${niche.label.toLowerCase()} and whether ${pilot} would make day-to-day work easier for your team.\n\nYou are welcome to revisit it when the timing suits you.${close}`}}
 ];
}
