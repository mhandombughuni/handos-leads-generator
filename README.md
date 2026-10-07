# Handos Lead Engine

A runnable Next.js + React + TypeScript MVP with local SQLite persistence, seeded fictional businesses, consultative outreach, campaign enrollment, A/B allocation, and live-refreshing analytics. No API keys are needed for the demo. Outbound email is disabled by default. Optional Hunter verification and SendGrid delivery are implemented; see [live setup](LIVE-SETUP.md).

## Run locally

Requires **Node.js 22.13+** (Node 22 LTS recommended) and npm. SQLite uses Node's built-in `node:sqlite`; there is no separate database server or native package to install. Node 22 may print an experimental SQLite warning.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open [localhost:3000](http://localhost:3000). The first data request creates `data/handos.sqlite` and seeds the database atomically. `npm run seed` initializes the default database ahead of time and preserves existing records. The seed command reads shell environment variables; Next.js also loads `.env.local`.

```sh
npm test
npm run typecheck
npm run build
npm start
```

## Try the full funnel

1. Discover leads using **City → Fairfax, VA → Healthcare → Home health agencies**, **ZIP → 02108**, or **State → MA**. ZIP, city, and state are mutually exclusive, combined with industry. The mock directory also contains Cambridge, Austin, and Denver (MA, TX, CO). Unknown places produce an honest empty result. The UI requires a specific niche; broad legacy API inputs remain supported for backwards compatibility.
2. Open a lead to inspect its opportunity score, three health scores, evidence, and personalized email preview. Seeded audit signals are explicitly labeled as simulated. Unknown live evidence remains unscored, never “no website.”
3. Choose a campaign and enroll. Enrollment is idempotent per lead/campaign. A/B selection happens automatically and stays consistent for that enrollment.
4. Click **Run due demo messages** to record a first delivery. Subsequent messages become eligible three days after the first and four days after the second (days 0 / 3 / 7 if processed on schedule). Running the queue repeatedly cannot create duplicate steps. The UI does not fast-forward time; tests exercise the whole timed sequence.
5. Use **Simulate a response** on the lead to record opens, clicks, replies, bounces, opt-outs, or bookings. Terminal events immediately suppress the contact across campaigns. Booking simulation records zero revenue by default.
6. Open Analytics. Filter by send-date range and category, click a campaign or day to drill down, and export the selection to CSV. The dashboard refreshes every 15 seconds; reload immediately to see a new event.

The demo directory contains the original 16 fictional businesses plus 11 targeted niche examples. Another 96 fictional branch records provide 35 days of historical campaign activity. Addresses and emails use reserved `.example` domains. Historical revenue is invented demo revenue, not a prediction. Campaign definitions and cost/value metadata are seeded; campaign creation, editing, and real sales attribution are outside this MVP.

## Implemented vs. integration boundaries

| Capability | MVP behavior |
| --- | --- |
| Discovery | `DiscoveryProvider` interface, working mock implementation, SerpApi-compatible HTTP adapter with an explicit mock mode; live failures never fall back to fictional records. |
| Live provider | With `DISCOVERY_PROVIDER=serpapi` and `SERPAPI_KEY`, searches SerpApi's `google_maps` engine and normalizes up to 20 results. This adapter is an integration starting point, not a verified production ingestion pipeline. |
| Audit | Pure rule-based scorer for supplied signals. Demo signals cover missing websites, HTTPS, mobile layout, design age, CTA, forms, booking, and workflow integration. No arbitrary URL crawler is run. Live website inspection remains outside this MVP. Hunter contact suggestions and deliverability verification are implemented. |
| Outreach | Three complete A/B email templates, merge tags `{{first_name}}` and `{{company_name}}`, and `https://handos.co` scheduling CTA. Persisted demo messages and optionally enabled live messages. |
| Email delivery | `EMAIL_PROVIDER=demo` simulates; `sendgrid` sends only with complete configuration and `LIVE_EMAIL_ENABLED=true`. Signed provider callbacks track actual delivery. OpenAI remains unused. |
| A/B | First-touch unique-open / delivered rate. 50/50 exploration until both variants have 20 deliveries and at least a 5-percentage-point gap. Then 80% goes to the leader and 20% explores. This is a heuristic, not statistical significance. |
| Event tracking | Persisted delivered/open/click/reply/bounce/unsubscribe/booked-demo events; provider event-ID deduplication; per-message metric deduplication. Bounces are treated as terminal/hard bounces. |
| Scheduler | Authenticated `POST /api/jobs/run` processes due messages using the configured provider. Invoke externally on a schedule or use the demo queue button. No unreliable background timers. |
| Analytics | Cohort-based date filtering, category/campaign filters, daily history, recent events, open/CTR/bounce/reply/conversion rates, recorded revenue and ROI, CSV export. |
| Access | Optional HTTP Basic authentication for the whole workspace. Webhook and job routes have separate required bearer secrets. Default deployment instructions keep Cloud Run private. |

See [LIVE-SETUP.md](LIVE-SETUP.md) for contact verification, sender configuration, signed SendGrid events, scheduling, reply/booking callbacks, and held-delivery review. Public-page crawling is not implemented.

## Environment

See `.env.example` for every supported key. Server secrets never use a `NEXT_PUBLIC_` prefix.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | `file:./data/handos.sqlite` by default. Only local SQLite `file:` URLs are supported. |
| `DISCOVERY_PROVIDER` | `mock` (default) or `serpapi`. |
| `SERPAPI_KEY` | Enables the SerpApi discovery adapter when selected. Missing key fails explicitly in live mode. |
| `OPENAI_API_KEY` | Reserved for a future grounded audit summarizer; unused in this MVP. |
| `SENDGRID_API_KEY` | Server-side SendGrid delivery key. |
| `EMAIL_PROVIDER` | `demo` (default) or `sendgrid`. |
| `APP_URL` | Trusted app origin for browser mutation checks; e.g. `http://localhost:3000`. |
| `SCHEDULING_URL` | Reserved for future configurable CTA routing. MVP templates intentionally link directly to `https://handos.co`. |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Optional workspace HTTP Basic authentication. Set a strong password before exposing the app outside a private development environment. |
| `WEBHOOK_SECRET` | Required bearer secret for external event ingestion. Empty means endpoint rejects requests. |
| `CRON_SECRET` | Required bearer secret for scheduled queue processing. Empty means endpoint rejects requests. |
| `FROM_EMAIL`, `FROM_NAME`, `POSTAL_ADDRESS` | Verified sender, display name, and required physical mailing address. |

## API

All endpoints return JSON except CSV export. Browser mutations require JSON and reject mismatched Origin headers.

- `GET /api/health`
- `GET /api/leads`
- `POST /api/search` → `{ "locationType": "city", "location": "Fairfax", "industry": "Healthcare", "nicheId": "home-health" }`
- `GET /api/leads/:id` → lead, audit, enrollments, messages, events, campaigns
- `GET /api/campaigns` → campaigns, enrollment statuses, A/B results, templates
- `POST /api/enroll` → `{ "leadId": "lead-1", "campaignId": "campaign-1" }`
- `POST /api/demo/run` → `{ "campaignId": "campaign-1" }` (optional campaign filter)
- `POST /api/demo/events` → same event shape as below, demo leads only
- `POST /api/events` → requires `Authorization: Bearer <WEBHOOK_SECRET>`
- `POST /api/jobs/run` → requires `Authorization: Bearer <CRON_SECRET>` and JSON `{}`
- `GET /api/analytics?from=2026-09-01&to=2026-09-30&category=Membership&campaignId=campaign-3`
- `GET /api/export` → same filters, daily report CSV with spreadsheet formula escaping

Example integration event (use a real message ID returned from the lead endpoint):

```json
{
  "externalId": "provider-unique-event-id",
  "messageId": "message-id",
  "type": "booked-demo",
  "occurredAt": "2026-09-29T15:00:00.000Z",
  "revenue": 250
}
```

`occurredAt` is optional and defaults to now. Ingestion rejects future timestamps and timestamps before the message. Only booked-demo events accept attributed revenue. Record revenue deliberately; a booking alone does not establish a completed sale. Reusing `externalId` is idempotent. Replies, all bounces, unsubscribe, and booked-demo suppress that email across campaigns. Manual suppression removal is intentionally absent.

## Analytics definitions

- The selected UTC date range identifies **sent-message cohorts**, not the dates events happened. All currently known events for those messages are included, including later replies.
- Opens, clicks, replies, deliveries, bounces, and unsubscribes are distinct-message counts. Repeated opens/clicks do not inflate the corresponding count.
- CTR / open rate / reply rate = matching delivered messages with that event divided by delivered messages.
- Bounce rate = bounced messages divided by sent messages.
- Conversions = distinct booked enrollments; conversion rate divides those by distinct enrollments represented in the selected sent-message cohort.
- Revenue = first booked-demo event's recorded revenue per enrollment **within the selected cohort**. Do not sum independently filtered daily revenue reports for an enrollment with booking events on different messages; use the complete range for deduplicated totals.
- Cost = campaign's seeded total cost × selected sent messages / all campaign sent messages.
- ROI = `(recorded revenue − allocated cost) / allocated cost × 100`. Zero cost displays “—”.
- Opens are directional because email privacy proxies and bots can distort them. Reply and booked-demo outcomes are stronger signals.

## Architecture and persistence

```text
app/                      Next.js routes and responsive screens
app/api/[...path]/route.ts Validated API, webhook and scheduler contracts
components/               Shared shell, UI and polling utilities
lib/discovery.ts          Mock and SerpApi provider abstraction
lib/audit.ts              Evidence-aware scoring
lib/sequence.ts           Six consultative email templates + merge rendering
lib/engine.ts             Enrollment, A/B allocation, due queue, suppression
lib/analytics.ts          Metrics, cohort filters, historical data, CSV
lib/db.ts                 SQLite schema, queries, transactions, automatic seed
proxy.ts                  Optional workspace Basic auth and origin checks
tests/                    Meaningful funnel and metric regression coverage
```

SQLite uses WAL mode, foreign keys, a busy timeout, transactional seeding, unique lead/campaign enrollment and message/step constraints, and unique event IDs. Entity payloads are stored as JSON alongside indexed relation keys to keep the MVP lightweight. All writes use prepared statements. This is a single-operator, small-dataset MVP; analytics loads records into memory. For larger datasets, move metric aggregation into SQL and paginate events.

The local database persists across restarts. To reset the demo, stop the app, move `data/handos.sqlite` and its `-wal` / `-shm` files aside, then restart. Never reset a database containing work you need.

## Docker and Google Cloud Run

Local container with persistent Docker volume:

```sh
docker build -t handos-lead-engine .
docker run --rm -p 8080:8080 \
  -v handos-data:/app/data \
  -e ADMIN_PASSWORD='replace-with-a-strong-password' \
  -e APP_URL=http://localhost:8080 \
  handos-lead-engine
```

A standalone Next.js server listens on `0.0.0.0` and respects Cloud Run's `PORT` environment variable. After setting your Google Cloud project and enabling its build/deployment services, a **private, disposable demo** can be deployed with:

```sh
gcloud run deploy handos-lead-engine \
  --source . \
  --region us-central1 \
  --no-allow-unauthenticated \
  --max-instances 1 \
  --concurrency 1 \
  --memory 512Mi \
  --set-env-vars 'DATABASE_URL=file:/app/data/handos.sqlite,DISCOVERY_PROVIDER=mock,EMAIL_PROVIDER=demo,APP_URL=http://localhost:8080'
```

Use `gcloud run services proxy handos-lead-engine --region us-central1 --port 8080` for a locally authenticated preview. The command above trusts that local proxy origin; before direct browser access, set `APP_URL` to the service's exact HTTPS origin. For any other local port or hostname, update `APP_URL` to match. The app rejects browser mutations from other origins. Supply secrets through Secret Manager when connecting integrations. The Docker image excludes local env files and data.

**Cloud Run's writable filesystem is ephemeral.** This deployment reseeds after instance replacement and is only a demo. A maximum of one instance does not make storage durable or guarantee a single instance during rollouts. For a production multi-instance service, replace the SQLite repository with Cloud SQL/PostgreSQL (including schema migrations and queue locking) before storing real leads. Do not put this SQLite WAL database on a Cloud Storage FUSE mount. Container packaging has been prepared; no Google Cloud deployment is performed by this project.

References: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Node SQLite](https://nodejs.org/download/release/latest-jod/docs/api/sqlite.html), [Cloud Run filesystem contract](https://docs.cloud.google.com/run/docs/container-contract), [Cloud Run source deployment](https://docs.cloud.google.com/run/docs/deploying-source-code).


## Targeted small-business prospecting

The search UI now has 23 concrete niches across Healthcare, Construction, Legal, Finance, Home Services, Nonprofit, Education, Membership, and Automotive. Each search starts with one SerpApi request with that niche's actual service phrase (for example, `home health care agency in Boston`, `physical therapy clinic in Boston`, or `roofing contractor in Boston`). It does not label every result a match just because it appeared in the requested search.

Supported examples include home health, physiotherapy, dental and chiropractic practices; remodelers, roofing, HVAC, plumbing and electrical contractors; family, immigration and estate-planning law; accounting/bookkeeping, tax preparation, insurance agencies and mortgage brokers.

### Screening and fit

- Listing name and categories are compared to the selected niche. Unmatched results are flagged by default.
- Configurable exclusion phrases screen institution or unwanted-chain names. Defaults include hospital, health system, university, medical school, bank, credit union, and corporate headquarters. Matching respects word boundaries: “bank” does not match “Riverbank.” These are screening signals, not verified company classifications.
- Permanently closed results are flagged. “Closed now” is not treated as permanent closure.
- Multiple listings sharing a website are downgraded to **Needs review**, because they may indicate multiple locations or a shared directory. This is not proof of a national chain or large employer. Detection covers the returned batch only.
- Flagged candidates are retained and can be inspected using **Review flagged matches**, without another provider request. Uncheck screening before search to include all candidates.
- Missing websites are still **unverified**; they are never automatically classified as having no website. Ratings and review counts do not establish employee count or closing speed and do not contribute to fit scores.

The transparent fit heuristic awards 45 points for observed niche keywords, 15 for a public business phone, 10 for a website, 10 for an address, 10 for an explicit independent/local-ownership phrase, and up to 10 for a separately observed high-opportunity audit. Shared websites subtract 15; exclusion matches subtract 40; permanent closure sets the score to zero. Scores are clamped to 0–100. A niche match with at least 65 points and no screening/shared-website flags is a **Promising fit**, not a verified small business. All live records retain uncertainty about ownership, headcount, buying authority, budget, and timeline.

Lead details show supporting evidence, caution flags, a suggested buyer role, a consultative audit offer, and one small potential first project. These are suggestions, not claims about the business. Healthcare/finance/legal suggestions focus on general inquiries rather than sensitive records.

### Buying readiness

The lead-detail checklist is operator-confirmed and persists independently of listing refreshes:

1. Decision-maker reached.
2. Specific need confirmed.
3. Achievable project budget discussed.
4. Prospect wants to start within 30 days.

A 4/4 checklist means the operator has confirmed those points; it is not a promise of a close. Search results never tick these boxes automatically. Saved contact information, observed audits, original creation dates, and buying-readiness checks survive rediscovery.

New API fields:

```json
{
  "locationType": "city",
  "location": "Fairfax",
  "industry": "Healthcare",
  "nicheId": "home-health",
  "excludeLarge": true,
  "excludeTerms": "hospital, health system, university, medical school, bank, credit union, corporate headquarters"
}
```

`POST /api/search` returns `leads`, `excludedLeads`, `totalReviewed`, and the actual `query`. A niche from a different industry is rejected. `POST /api/leads/:id/readiness` accepts exactly four booleans: `decisionMaker`, `needConfirmed`, `budgetConfirmed`, and `timelineConfirmed`. `GET /api/settings` reports discovery/contact configuration and email readiness, never secret values. The header now distinguishes live search from demo email delivery.

Provider evidence fields follow the [SerpApi local-results contract](https://serpapi.com/maps-local-results). Returned addresses are preserved; the requested city/ZIP is no longer fabricated as the business location. Google may return nearby or out-of-area matches, so verify the displayed address. Search makes no employee-count guarantee. A versioned, additive demo migration preserves existing leads and campaigns.

Default screening also flags three home-care network names observed in live testing: Home Instead, Visiting Angels, and Home Helpers. Franchise offices may be independently owned, so these flags invite a check of local purchasing authority; they do not establish that the local office is a large business. Remove those phrases if franchise owners are desired prospects. Network references: [Home Instead](https://franchises.homeinstead.com/), [Visiting Angels](https://www.visitingangels.com/), [Home Helpers](https://homehelpershomecare.com/privacy-policy/).

State abbreviations expand to full names in US search queries (for example, VA → Virginia) to reduce confusion with Veterans Affairs. ZIP queries explicitly include “ZIP code” and “United States.”

## Live integrations

See [LIVE-SETUP.md](LIVE-SETUP.md) for all new environment variables and endpoints. Hunter verifies deliverability; the operator confirms business identity. SendGrid delivery attempts are persisted before transmission, uncertain attempts are held, signed callbacks are deduplicated, and signed unsubscribe links stop follow-ups. Replies and bookings require a configured external callback or a confirmed manual outcome; this app does not monitor a mailbox or calendar automatically.
