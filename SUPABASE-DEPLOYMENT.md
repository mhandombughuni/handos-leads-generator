# Publishing Handos at prospect.handos.co

Status: preparation only; no service, database migration, or DNS change has been deployed. The running app still uses local SQLite. The SQL migration is a starting schema, not a working Postgres adapter.

Target architecture:

- Next.js application and API: Cloud Run (existing container) or Vercel, pending hosting selection.
- Persistent database: Supabase Postgres with server-only database credentials.
- Website domain: prospect.handos.co points to the web host using its supplied DNS records.
- SendGrid callback: https://prospect.handos.co/api/webhooks/sendgrid.
- Production APP_URL: https://prospect.handos.co.

Needed account details: existing Supabase project URL, chosen web host/account, and DNS provider for handos.co. Database passwords and API keys must be configured through environment variables or the host's secret store, never committed or pasted into chat.

Before publishing:

1. Convert the synchronous SQLite repository and all transaction callers to asynchronous Postgres operations. Preserve atomic message reservations, suppression checks, event deduplication, and campaign scheduling across multiple instances.
2. Apply supabase/migrations/202610070001_handos.sql. This uses a private handos schema with no anonymous/client access. Configure a suitable server database role; no public RLS policies are provided.
3. Export and migrate existing leads, saved leads, campaigns, sequences, suppressions, messages, events, and delivery attempts. Preserve identifiers and timestamps. Compare source/destination counts and avoid importing invented demo activity as real campaign performance.
4. Validate the application against Supabase, including concurrent queue calls and duplicate callbacks. Do not deploy the existing SQLite implementation onto ephemeral server storage for real campaigns.
5. Configure production environment variables and workspace authentication. Start production with live delivery disabled until the public callback, sender verification, and unsubscribe links have been tested.
6. Deploy Next.js, attach prospect.handos.co, and use the exact DNS record returned by the host. Do not guess a CNAME target or change handos.co mail/DNS records unrelated to this subdomain.
7. Configure the signed SendGrid Event Webhook, copy the public verification key, test signatures, and enable scheduled follow-ups. Enable live delivery after this validation.

References: https://supabase.com/docs/guides/platform/custom-domains and https://supabase.com/docs/guides/database/connecting-to-postgres.
