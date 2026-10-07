# Handos on Vercel + Supabase

The backend now supports Supabase Postgres using DATABASE_PROVIDER=supabase and server-only SUPABASE_DATABASE_URL. SQLite remains supported for isolated local demos and tests. The private handos schema stores leads, saved leads, campaigns, templates, events, messages, suppressions, and delivery attempts. Transaction-pooler connections disable prepared statements and use TLS. Transaction-scoped advisory locking serializes campaign mutations across instances; network sends happen after message reservations commit.

Migration: npm run migrate:supabase snapshots the local database into data/backups, creates the schema, copies and verifies every row/field in one transaction, and refuses to overwrite a populated destination. Do not repeat it after migrating without planning a separate reconciliation. npm run verify:supabase tests concurrency and deduplication using temporary demo records and removes those records afterward.

## Vercel

Import mhandombughuni/handos-leads-generator with Next.js, Node 22 or later, npm install, and npm run build. Configure DATABASE_PROVIDER=supabase and SUPABASE_DATABASE_URL with the Supabase transaction-pooler string. Do not rely on local .env.local being uploaded: it is intentionally excluded from Git. Add the discovery, contact, and delivery keys separately in Vercel's environment settings. Never prefix server secrets with NEXT_PUBLIC_.

Configure APP_URL=https://prospect.handos.co and a strong ADMIN_PASSWORD (ADMIN_USERNAME defaults to admin). Keep LIVE_EMAIL_ENABLED=false until SendGrid callbacks and unsubscribes work at the public URL. SENDGRID_SANDBOX=true can validate payloads without real delivery. The included vercel.json requests 300-second API executions; confirm your Vercel plan supports the required duration, because discovery can take several minutes. Configure an external scheduler to POST /api/jobs/run with the CRON_SECRET bearer token; no scheduler is automatically provisioned.

Add prospect.handos.co in Vercel's domain settings, then copy the exact DNS record Vercel supplies into Wix. Do not change main-domain website or email records. Configure SendGrid's signed Event Webhook at https://prospect.handos.co/api/webhooks/sendgrid and copy its public verification key.

Publication is pending Vercel deployment and DNS configuration. Supabase custom domains do not host the Next.js frontend. References: https://supabase.com/docs/guides/platform/custom-domains and https://supabase.com/docs/guides/database/connecting-to-postgres.
