import {z} from 'zod';
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const metricsSchema=z.object({requests:z.number().int().nonnegative().default(0),delivered:z.number().int().nonnegative().default(0),opens:z.number().int().nonnegative().default(0),clicks:z.number().int().nonnegative().default(0),bounces:z.number().int().nonnegative().default(0),spam_reports:z.number().int().nonnegative().default(0),unsubscribes:z.number().int().nonnegative().default(0)});
const responseSchema=z.array(z.object({date,stats:z.array(z.object({metrics:metricsSchema}))}));
export type SendGridStatistics={available:boolean;reason?:string;from:string;to:string;totals?:z.infer<typeof metricsSchema>;updatedAt:string};
let cached:{key:string;until:number;value:SendGridStatistics}|undefined;
export async function sendGridStatistics(from:string,to:string):Promise<SendGridStatistics>{
 date.parse(from);date.parse(to);if(from>to)throw new Error('Start date must precede end date.');
 const token=process.env.SENDGRID_STATS_API_KEY||process.env.SENDGRID_API_KEY;
 const key=from+':'+to+':'+token;
 if(cached?.key===key&&cached.until>Date.now())return cached.value;
 const base={from,to,updatedAt:new Date().toISOString()};
 let value:SendGridStatistics;
 if(!token)value={...base,available:false,reason:'Configure a SendGrid key with Stats Read Access to load account statistics.'};
 else try{
  const response=await fetch('https://api.sendgrid.com/v3/stats?'+new URLSearchParams({start_date:from,end_date:to,aggregated_by:'day'}),{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(10000),cache:'no-store'});
  if(response.status===401||response.status===403)value={...base,available:false,reason:'SendGrid denied statistics access. In SendGrid → Settings → API Keys, grant Stats Read Access to the app’s key, or configure SENDGRID_STATS_API_KEY with read-only statistics access.'};
  else if(!response.ok)value={...base,available:false,reason:'SendGrid statistics are temporarily unavailable (HTTP '+response.status+'). Stored message reports are unchanged.'};
  else {const days=responseSchema.parse(await response.json());const totals=metricsSchema.parse({});for(const day of days)for(const row of day.stats)for(const field of Object.keys(totals) as (keyof typeof totals)[])totals[field]+=row.metrics[field];value={...base,available:true,totals};}
 }catch{value={...base,available:false,reason:'SendGrid statistics could not be retrieved. Stored message reports are unchanged.'};}
 cached={key,until:Date.now()+30000,value};return value;
}
