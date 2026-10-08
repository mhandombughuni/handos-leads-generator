import { z } from 'zod';
export function publicError(error:unknown){
 if(error instanceof z.ZodError)return {status:400,message:error.issues.map(i=>i.message).join(' ')};
 const e=error as {code?:string;message?:string};
 const codes=['ENOTFOUND','EAI_AGAIN','ECONNREFUSED','ECONNRESET','CONNECT_TIMEOUT','CONNECTION_CLOSED','ETIMEDOUT','28P01','28000','3D000','42P01','DATABASE_CONFIG'];
 if(codes.includes(e?.code||'')||/getaddrinfo|password authentication|SUPABASE_DATABASE_URL|postgresql:\/\//i.test(e?.message||''))return {status:503,message:'Lead data is temporarily unavailable. Please contact the workspace administrator.'};
 return {status:400,message:error instanceof Error?error.message:'Request failed. Please try again.'};
}
