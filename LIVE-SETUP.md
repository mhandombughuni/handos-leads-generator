# Activating live Handos outreach

The Figma interface is connected to the backend. Live search uses SerpApi; contact verification uses Hunter; delivery uses SendGrid. No real emails are sent by default. Keys belong in `.env.local` as `NAME=value`, without a `#` prefix. Never commit that file. Restart after changing it.

## Discovery and contacts

```dotenv
DISCOVERY_PROVIDER=serpapi
SERPAPI_KEY=your-key
HUNTER_API_KEY=your-key
```

Search by location and niche. Listed websites undergo a bounded HTML inspection; observed legacy HTML signals qualify a website-refresh prospect. Remaining candidates undergo company/address and company/phone searches; directory-only results qualify as no business website found; other website or social results remain excluded. Failed checks stay unknown. A Maps listing is itself a digital trace: this workflow cannot prove absolute absence online. Searches can use up to 21 SerpApi calls and take several minutes.

Open a qualified lead, use **Find contact suggestions**, or enter a business email you independently obtained. Confirm the person belongs to the exact business and record your source. **Verify and save** accepts Hunter's valid/deliverable result. Accept-all addresses require the explicit manual approval described below; uncertain addresses remain blocked. Suggested contacts alone do not establish business identity. Normal enrollment requires a verified email or an explicitly approved accept-all address. Hunter may have no contact for businesses without websites; there is no fabricated fallback.

## SendGrid configuration

Authenticate your sending domain or verify your sender in SendGrid. Create a Mail Send API key. Use a public HTTPS deployment with durable database storage before enabling real sends.

```dotenv
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=handos-prospector
FROM_EMAIL=contact@handos.co
FROM_NAME=Handos
REPLY_TO_EMAIL=mhandom@handos.co
POSTAL_ADDRESS=9480 Main St Unit 1367 Fairfax, VA 22031
APP_URL=https://your-deployment.example
ADMIN_USERNAME=handos
ADMIN_PASSWORD=strong-unique-password
CRON_SECRET=independent-long-random-secret
WEBHOOK_SECRET=another-independent-long-random-secret
UNSUBSCRIBE_SECRET=another-independent-long-random-secret
SENDGRID_WEBHOOK_PUBLIC_KEY=base64-verification-key-from-sendgrid
EMAIL_BATCH_LIMIT=10
LIVE_EMAIL_ENABLED=false
SENDGRID_SANDBOX=true
```

Configure SendGrid's Event Webhook at `APP_URL/api/webhooks/sendgrid`. Enable signed requests and copy its verification public key. Subscribe to delivered, open, click, bounce, dropped, unsubscribe, group unsubscribe, and spam report events. This endpoint validates the signature against the raw request body and deduplicates provider event IDs; it does not use `WEBHOOK_SECRET`.

Review your three-step campaign templates, verify contacts, and enroll selected leads. Set `LIVE_EMAIL_ENABLED=true` while leaving `SENDGRID_SANDBOX=true` for payload validation. Sandbox messages do not reach recipients and remain held. They are not automatically retried: reconcile rejected sandbox attempts in Campaigns and enroll a different verified test contact for the eventual real test. When ready, set `SENDGRID_SANDBOX=false` and restart. Existing held steps remain held.

Invoke `POST /api/jobs/run` with `Authorization: Bearer <CRON_SECRET>`, `Content-Type: application/json`, and `{}`. Configure an external scheduler to invoke it regularly. The dashboard's demo button never sends real mail. Each invocation processes at most `EMAIL_BATCH_LIMIT` real attempts. Follow-ups become eligible after three and then four days.

A provider acceptance is not a delivered event. Only delivery callbacks count as delivered. Every attempt is reserved before transmission; timeout, server error, or interrupted sends are held to avoid duplicates. Check SendGrid activity and use Campaigns' delivery review to reconcile uncertain attempts. Rejected attempts stop enrollment; there is no automatic retry. Signed unsubscribe links provide confirmation on GET and suppress the email on POST, including one-click unsubscribe.

## Replies, bookings, and sales outcomes

This MVP does not automatically read your mailbox or calendar. Connect your mailbox/booking automation to `POST /api/events` using `Authorization: Bearer <WEBHOOK_SECRET>` and a JSON body:

```json
{
  "externalId": "your-system-unique-event-id",
  "messageId": "the-handos-message-id",
  "type": "reply",
  "occurredAt": "2026-10-07T15:00:00.000Z"
}
```

Use `type: "booked-demo"` for confirmed bookings. Optional `revenue` is accepted only for booked-demo events; record actual attributable value deliberately, not presumed sales. Map the callback to the message ID stored on the lead detail API. SendGrid receives the same ID as `handos_message_id` in custom arguments. Use stable external IDs for idempotency. Until an automation is configured, use the lead detail's confirmed reply/booking controls. Recorded replies, bounces, opt-outs, and bookings stop sequences across campaigns.

## New endpoints

- `POST /api/leads/:id/contacts` — Hunter suggestions, body `{}`.
- `POST /api/leads/:id/contact` — verify and save `{firstName,email,identityConfirmed:true,source}`.
- `POST /api/leads/:id/outcome` — record confirmed `reply` or `booked-demo`.
- `GET /api/deliveries` — recent provider attempts.
- `POST /api/deliveries/:messageId/reconcile` — confirmed `accepted` or `rejected` outcome.
- `GET/POST /api/unsubscribe` — signed recipient link.
- `POST /api/webhooks/sendgrid` — provider-signed event ingestion.

SQLite needs a persistent local disk. The supplied Cloud Run container remains suitable for disposable demos; Cloud Run's ephemeral filesystem cannot safely store live campaign state. A durable database migration is required before live Cloud Run use. Public callbacks must be reachable without Cloud Run IAM authentication; workspace Basic auth and callback-specific verification protect app routes.

Provider references: [Hunter API](https://hunter.io/api-documentation/), [SendGrid Mail Send](https://www.twilio.com/docs/sendgrid/api-reference/mail-send/mail-send), [signed Event Webhooks](https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/getting-started-event-webhook-security-features).

## Bulk campaigns from Saved leads

Select up to 100 saved leads, choose a campaign, and use **Queue selected for outreach** or **Review & send selected**. The preview shows one recipient and Variant A; actual delivery renders the saved templates using each lead's first name, company, and assigned A/B variant. Existing campaign enrollments are reused without creating duplicate steps. Review per-lead failures for missing verified email, suppression, or invalid qualification.

The send action processes only selected enrollments' currently due steps. Live delivery respects `LIVE_EMAIL_ENABLED`, `SENDGRID_SANDBOX`, and `EMAIL_BATCH_LIMIT`; additional queued messages and follow-ups require the scheduler. Demo mode explicitly simulates selected messages. Individual enrollment from a lead profile remains available.

`POST /api/saved-leads/campaign` accepts `{leadIds:[...],campaignId:"campaign-1",action:"queue"}` or `action:"send"`. It uses workspace authentication and origin checks. It returns per-lead enrollment/error results and delivery processing results. No campaign emails are sent merely by saving a lead.

## Automatic public email discovery

Qualified live search results automatically inspect public email sources: the listed homepage and up to two same-origin contact/about/team links, up to two directory source roots already present in search evidence, plus Hunter domain/company search when configured. Addresses found in visible HTML or mailto links are saved as suggestions with source URLs. This adds website requests and up to one Hunter lookup per qualified lead; quota failures appear as incomplete enrichment rather than silently claiming no email exists.

Open the lead profile to review candidates, inspect source links, select an address, confirm the exact business identity, and verify deliverability. Existing saved leads can use **Refresh public email discovery**. Public discovery works without Hunter, but deliverability verification still requires it. An unpublished form recipient, private record, or inaccessible/JavaScript-only email is not guessed. No contact form is submitted. Found suggestions do not replace an existing verified email or automatically authorize outreach.

### Accept-all manual approval
In the contact editor, confirm business identity and record your source, then explicitly select the accept-all approval checkbox and choose **Check and approve contact**. Hunter still checks the address. Only an accept-all verdict can receive this override; unknown, invalid, and disposable addresses remain blocked. The saved contact displays **Accept-all · manually approved**, with the approval time and Hunter status retained. This approval permits normal enrollment and sending subject to business fit and suppression checks; it does not confirm mailbox deliverability.
