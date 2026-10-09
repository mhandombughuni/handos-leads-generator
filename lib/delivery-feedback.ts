export type SendResult={scheduled?:number;nextDueAt?:string;accepted?:number;failed?:number;unknown?:number;skipped?:number;sandbox?:number;sent?:number;mode?:string;notice?:string};
export function sendNotice(r:SendResult){
 if(r.mode==='demo')return `${r.sent||0} demo message(s) simulated. No real email was sent.`;
 const n=r.accepted||0;
 const success=n?`${n} email${n===1?' was':'s were'} successfully submitted to SendGrid. Delivery confirmation is pending.`:r.scheduled&&!r.failed&&!r.unknown?'No email is due now. '+r.scheduled+' follow-up(s) scheduled'+(r.nextDueAt?' starting '+r.nextDueAt:'')+'.':r.unknown?'No email submission was confirmed. Provider outcome is uncertain.':'No email was submitted to SendGrid.';
 return [success,r.failed?`${r.failed} rejected attempt(s).`:null,r.unknown?`${r.unknown} uncertain attempt(s) held for review; do not resend.`:null,r.sandbox?`${r.sandbox} sandbox validation(s); no real email sent.`:null,r.skipped?`${r.skipped} lead(s) skipped (not eligible, suppressed, or already attempted).`:null].filter(Boolean).join(' ');
}
