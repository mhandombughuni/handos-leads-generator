# Handos Figma frontend integration

Source: https://www.figma.com/design/eBSQHVAbRayZpdSOBtbsjG/handos-leads-UI

Implemented in the existing Next.js project with plain CSS and shared React components. No separate Vite server or cross-origin API configuration is required.

| Figma frame | Route | Backend mapping |
| --- | --- | --- |
| 27:3 Lead discovery | / | GET /api/settings, GET /api/leads, POST /api/search; selected qualified leads use POST /api/enroll |
| 27:256 Lead detail | /leads/:id | GET /api/leads/:id; presence evidence, audit scores, readiness checks, enrollment, message history |
| 27:454 Campaign overview | /campaigns | GET /api/campaigns, GET /api/analytics?campaignId=…, POST /api/enroll, POST /api/demo/run |
| 27:693 Sequence editor | /sequences | GET/POST /api/campaigns/:id/sequence; persisted A/B templates, personalization preview |
| 27:901 Analytics | /analytics | GET /api/analytics with from/to/category/campaignId; GET /api/export with matching filters |
| 27:1200 / 27:1377 Mobile | Same routes | Responsive cards, two-column metrics and bottom navigation |

The logo is downloaded into public/handos-logo.png, so it does not rely on an expiring Figma asset link. Icons use the existing Lucide dependency. Layout tokens come from Figma: cream #fff4df, ink #131c23, orange #fa854f, blue #a8d3ff, border #e3dfd5.

Figma's example names, contacts, counts, audit scores and ROI assumptions are not copied into live results. Missing scores remain unknown. Search defaults to Fairfax, VA. Existing Boston demo records are kept. Live results show only independently screened candidates; exclusions remain reviewable and cannot be selected for bulk enrollment. The backend also rejects live enrollments without passed presence checks.

Sequence edits are persisted per campaign in SQLite metadata. Future demo queue messages and the lead preview read those templates; historical messages are unchanged. Every variant must contain a handos.co link. Automatic A/B behavior follows the existing backend open-rate allocation policy, not Figma's illustrative reply-rate significance policy.

Analytics uses backend metric definitions: unique events per message, booked enrollments for conversions, send-date cohort filters, and allocated campaign costs. Seeded metrics and attributed revenue remain fictional. Hunter verification and optional SendGrid delivery are implemented; see LIVE-SETUP.md.

Run from this directory:

```sh
npm run build
npm start
```

Verification:

```sh
npm run typecheck
node --import tsx --test tests/*.test.ts
```
