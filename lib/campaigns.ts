import {all,db,get} from './db';
import type {Campaign} from './types';
import {nonprofitCampaigns} from './campaign-profiles';
export {audienceForCampaign} from './campaign-profiles';
export async function ensureCampaigns(){
 for(const {audience:_,...profile} of nonprofitCampaigns){
  const campaign:Campaign={...profile,cost:0,demoValue:0,createdAt:'2026-10-10T00:00:00.000Z'};
  await db().prepare('INSERT INTO campaigns(id,data) VALUES (?,?) ON CONFLICT(id) DO NOTHING').run(campaign.id,JSON.stringify(campaign));
 }
}
export async function listCampaigns(){await ensureCampaigns();return all<Campaign>('campaigns');}
export async function getCampaign(id:string){if(nonprofitCampaigns.some(c=>c.id===id))await ensureCampaigns();return get<Campaign>('campaigns',id);}
