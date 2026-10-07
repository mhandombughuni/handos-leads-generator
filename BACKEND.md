# Presence screening

POST /api/search accepts locationType (city, zip, state), location, industry, nicheId, excludeLarge, and excludeTerms.
Search results now include only independently screened candidates with no additional indexed web presence found. Businesses with listing website links are rejected immediately. Candidates without links require a verified listing address and phone and two Google identity searches through SerpApi: company plus address, and company plus phone. Any returned website, social account, or directory link excludes the candidate, including ambiguous results. Missing or failed responses remain unknown and are excluded.

Google Maps listings themselves are digital traces. This workflow finds no additional traces beyond the discovery listing; it cannot prove a business has zero digital presence. Exact identity searches can miss aliases or unindexed sites. False positives are deliberately rejected. Website audit scores remain unknown rather than claiming an independently confirmed absence.

Each persisted lead includes presence.status, checkedAt, queries, traces (title, url, kind), and reason. GET /api/leads/:id returns this evidence for the future Figma interface. POST /api/search returns leads, excludedLeads, totalReviewed, provider, query, notice. Existing saved leads remain in GET /api/leads as historical records; they are not newly qualified search results.

Live settings: DISCOVERY_PROVIDER=serpapi and SERPAPI_KEY in .env.local. Live failures never fall back to demo. Mock mode is explicitly fictional and filters out businesses with demo website signals.

Budget: one Maps request plus at most 20 verification requests per search (10 candidates, two requests each). Requests are sequential, have 15-second timeouts, and candidates beyond the limit remain unknown. A search can take several minutes; production infrastructure must permit that duration or move verification into a background job. There is no pagination yet; discovery checks the first 20 listings only.

Validation: npm run typecheck; node --import tsx --test tests/*.test.ts; npm run build.
Restart the production server after rebuilding to use the updated backend.

The Figma frontend is integrated; see FIGMA-INTEGRATION.md for screen-to-API mappings. Hunter verification and optional SendGrid delivery are implemented; see LIVE-SETUP.md.

## Updated opportunity rules

Directory-only search results no longer establish an owned website and qualify as potential clients. Social accounts and unknown website results remain distinguishable in evidence. Listed websites are inspected with a 512 KB HTML cap, six-second connection deadline, public IPv4 validation, pinned DNS connections, and revalidated redirects. Observed legacy HTML/editor tags or fixed table layouts without a viewport flag a potential website-refresh client. Modern static HTML and `.html` URLs alone are not negative signals. Failed inspections remain unknown. Only HTML is inspected; visual quality and business identity still require review, and missing intake/workflow features are not inferred. Up to 10 candidates are inspected per search.

The discovery screen preserves form values, result sets, tabs, selection, page, and destination campaign in browser session storage. Returning from lead detail or reloading the tab retains the current search; a new tab begins a new session. Saved searches remain separately available in local storage.
