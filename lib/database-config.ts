export function validateDatabaseURL(value:string){
 try{
 const url=new URL(value);
 if(!['postgres:','postgresql:'].includes(url.protocol)||!url.username||!url.password||!url.pathname||url.pathname==='/')throw new Error();
 if(!url.hostname.endsWith('.supabase.co')&&!url.hostname.endsWith('.pooler.supabase.com'))throw new Error();
 if(/YOUR.PASSWORD|\[|\]/i.test(decodeURIComponent(url.password)))throw new Error();
 return value;
 }catch{throw Object.assign(new Error('Database connection is not configured correctly. Please contact the workspace administrator.'),{code:'DATABASE_CONFIG'});}
}
