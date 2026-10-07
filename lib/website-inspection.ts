import { lookup } from 'node:dns/promises';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import type { Signals } from './types';
export type WebsiteInspection={url:string;checkedAt:string;status:'inspected'|'unknown';signals:Signals;evidence:string[]};
export function publicIPv4(ip:string){
 const p=ip.split('.').map(Number);if(p.length!==4||p.some(n=>!Number.isInteger(n)||n<0||n>255))return false;
 const [a,b]=p;return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&(b===168||b===0)||a===100&&b>=64&&b<=127||a===198&&(b===18||b===19||b===51)||a===203&&b===0);
}
export function inspectHTML(html:string,url:string):WebsiteInspection{
 const evidence:string[]=[];
 const markup=html.replace(/<!--[\s\S]*?-->/g,'').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'');
 const viewport=/<meta\b[^>]*name\s*=\s*['"]?viewport\b/i.test(markup);
 const oldEditor=/<meta\b[^>]*content\s*=\s*['"][^'"]*(?:Microsoft FrontPage|Adobe GoLive|Dreamweaver [1-4]\b)/i.test(markup);
 const legacy=/<(?:frameset|frame|font|center)\b/i.test(markup)||/<!doctype\s+html\s+(?:public|system)/i.test(markup);
 const tableLayout=/<table\b[^>]*(?:width\s*=\s*['"]?[6-9]\d{2}|layout)/i.test(markup);
 if(oldEditor)evidence.push('A legacy website editor generator tag was observed.');
 if(legacy)evidence.push('Legacy HTML elements or an older HTML doctype were observed.');
 if(tableLayout)evidence.push('A fixed-width table layout was observed.');
 if(!viewport)evidence.push('No mobile viewport declaration was found in the fetched HTML; visual review is recommended.');
 const signals:Signals={hasWebsite:true,https:new URL(url).protocol==='https:',...(viewport?{mobile:true}:{}),staleDesign:oldEditor||legacy||tableLayout&&!viewport};
 // HTML alone cannot establish missing forms, booking, or internal integrations.
 return {url,checkedAt:new Date().toISOString(),status:'inspected',signals,evidence};
}
async function readPage(url:URL):Promise<{html:string;location?:string}>{
 if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.port&&!['80','443'].includes(url.port))throw new Error('Unsupported URL');
 const addresses=await lookup(url.hostname,{all:true,family:4});
 if(!addresses.length||addresses.some(a=>!publicIPv4(a.address)))throw new Error('Non-public destination');
 // Pin the validated address; DNS cannot change between verification and connection.
 return new Promise((resolve,reject)=>{
 const request=(url.protocol==='https:'?httpsRequest:httpRequest)(url,{agent:false,family:4,lookup:(_hostname,_options,callback)=>callback(null,addresses[0].address,4),headers:{'User-Agent':'HandosAudit/1.0','Accept':'text/html','Accept-Encoding':'identity'},signal:AbortSignal.timeout(6000)},response=>{
  if([301,302,303,307,308].includes(response.statusCode||0)){response.resume();resolve({html:'',location:response.headers.location});return;}
  if(response.statusCode!==200||!response.headers['content-type']?.includes('text/html')){response.resume();reject(new Error('HTML unavailable'));return;}
  const parts:Buffer[]=[];let bytes=0;response.on('data',(chunk:Buffer)=>{bytes+=chunk.length;if(bytes>512000){response.destroy(new Error('Page too large'));return;}parts.push(chunk);});response.on('error',reject);response.on('end',()=>resolve({html:Buffer.concat(parts).toString('utf8')}));
 });request.on('error',reject);request.end();
 });
}
export async function fetchPublicHTML(address:string){
 let url=new URL(address);for(let i=0;i<3;i++){const page=await readPage(url);if(page.location){url=new URL(page.location,url);continue;}if(!/<html\b|<!doctype/i.test(page.html))throw new Error('Incomplete HTML');return {html:page.html,url:url.href};}throw new Error('Too many redirects');
}
export async function inspectWebsite(address:string):Promise<WebsiteInspection>{
 try{const page=await fetchPublicHTML(address);return inspectHTML(page.html,page.url);}
 catch{return {url:address,checkedAt:new Date().toISOString(),status:'unknown',signals:{hasWebsite:true},evidence:['Website inspection was unavailable or blocked; age and quality remain unknown.']};}
}
