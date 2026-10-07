# Verification

Validated locally on September 29, 2026 with Node 22 and Next.js 16.3.7.

- Production build passed (`npm run build`).
- TypeScript validation passed (`npm run typecheck`).
- Eight automated regression tests passed (`npm test`): location/industry search, evidence-aware audit scoring, idempotent enrollment and due times, all terminal suppression outcomes, event/metric deduplication, date/category/CSV behavior, merge tags and CTA, and adaptive A/B routing.
- Production standalone server started with `npm start` and served the UI and API.
- Browser flow passed: Boston + Nonprofit returned two leads, lead details opened, enrollment persisted, demo delivery appeared in the timeline, a reply stopped further queue processing, and analytics category/campaign drill-down worked.
- Desktop analytics rendered correctly; at a 390px viewport, document width was 390px (no page overflow). Wide tables scroll inside their own containers.
- HTTP smoke checks passed: health 200, invalid ZIP 400, untrusted request origin 403, missing webhook secret 401, missing scheduler secret 401, CSV export 200.

Live SerpApi calls were not tested because no API key was supplied. Live email, website crawling, enrichment, and booking-provider callbacks remain explicit integration boundaries. Docker was not available in the environment; the Dockerfile was inspected but no container build or Cloud Run deployment was performed.

The provided running local demo contains one QA enrollment for Harbor Community Center, with a recorded delivery and reply. The source archive excludes the database; a clean install seeds fresh data.

## Targeted prospecting update

- All 16 regression tests pass, including niche query construction, evidence-based fit, word-boundary exclusions, chain-name flags, permanent-vs-temporary closure, deduplication/shared websites, preserved readiness on rediscovery, additive demo seeding, and provider normalization.
- Production build and its TypeScript checks passed after the final changes.
- One live Boston home-health search returned 20 listings with business phone/category/address evidence. Replaying those saved records through the final screening rules retained 17 and flagged 3 network-name matches, without a second provider call. Remaining records are research candidates, not verified SMBs or guaranteed quick closes.
- Browser checks passed for dependent industry/niche selectors, fit filtering, and saving/reloading/reverting a buying-readiness check on a fictional demo lead.
- An invalid industry/niche pair was rejected with HTTP 400 before provider access.
- Mobile check: at 390px viewport, document width remains 390px.
- Existing real leads and campaign records were retained. No outreach was sent.
