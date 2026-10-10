export const nonprofitCampaigns=[
 {id:'campaign-nonprofit',name:'Nonprofits · Programs and community connections',category:'Nonprofit',audience:'community'},
 {id:'campaign-churches',name:'Churches · Visitors and ministry connections',category:'Nonprofit',audience:'churches'},
 {id:'campaign-christian-ngos',name:'Christian NGOs · Supporters and volunteers',category:'Nonprofit',audience:'christian-ngos'}
];
export function audienceForCampaign(id:string){return nonprofitCampaigns.find(c=>c.id===id)?.audience||'general';}
