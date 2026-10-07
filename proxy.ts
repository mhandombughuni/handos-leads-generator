import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
export function proxy(req:NextRequest){
 const path=req.nextUrl.pathname;
 if(path==='/api/health'||path==='/api/events'||path==='/api/jobs/run'||path==='/api/webhooks/sendgrid'||path==='/api/unsubscribe')return NextResponse.next();
 if(req.method==='POST'){
 const origin=req.headers.get('origin');
 if(origin&&origin!==req.nextUrl.origin&&origin!==process.env.APP_URL)return NextResponse.json({error:'Cross-origin request rejected.'},{status:403});
 if(!req.headers.get('content-type')?.includes('application/json'))return NextResponse.json({error:'JSON required.'},{status:415});
 }
 const password=process.env.ADMIN_PASSWORD;
 if(password){const supplied=req.headers.get('authorization')||'';const expected=`Basic ${Buffer.from(`${process.env.ADMIN_USERNAME||'admin'}:${password}`).toString('base64')}`;const a=Buffer.from(supplied),b=Buffer.from(expected);if(a.length!==b.length||!timingSafeEqual(a,b))return new NextResponse('Sign in to Handos',{status:401,headers:{'WWW-Authenticate':'Basic realm="Handos", charset="UTF-8"'}});}
 return NextResponse.next();
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.svg).*)']};
