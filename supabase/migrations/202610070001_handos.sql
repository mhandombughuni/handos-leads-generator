-- Preparation for migrating the local SQLite repository to Supabase Postgres.
-- The application must be updated to use async Postgres transactions before deployment.
-- Tables live in a private schema, not the public browser-facing Data API.
BEGIN;
CREATE SCHEMA IF NOT EXISTS handos;
REVOKE ALL ON SCHEMA handos FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS handos.leads (id text PRIMARY KEY, data text NOT NULL CHECK (jsonb_typeof(data::jsonb) = 'object'));
CREATE TABLE IF NOT EXISTS handos.campaigns (id text PRIMARY KEY, data text NOT NULL CHECK (jsonb_typeof(data::jsonb) = 'object'));
CREATE TABLE IF NOT EXISTS handos.enrollments (id text PRIMARY KEY, lead_id text NOT NULL REFERENCES handos.leads(id), campaign_id text NOT NULL REFERENCES handos.campaigns(id), data text NOT NULL CHECK (jsonb_typeof(data::jsonb) = 'object'), UNIQUE(lead_id,campaign_id));
CREATE TABLE IF NOT EXISTS handos.messages (id text PRIMARY KEY, enrollment_id text NOT NULL REFERENCES handos.enrollments(id), step integer NOT NULL CHECK (step BETWEEN 1 AND 3), data text NOT NULL CHECK (jsonb_typeof(data::jsonb) = 'object'), UNIQUE(enrollment_id,step));
CREATE TABLE IF NOT EXISTS handos.events (id text PRIMARY KEY, external_id text NOT NULL UNIQUE, message_id text NOT NULL REFERENCES handos.messages(id), data text NOT NULL CHECK (jsonb_typeof(data::jsonb) = 'object'));
CREATE TABLE IF NOT EXISTS handos.suppressions (email text PRIMARY KEY, reason text NOT NULL);
CREATE TABLE IF NOT EXISTS handos.metadata (key text PRIMARY KEY, value text NOT NULL);
CREATE TABLE IF NOT EXISTS handos.saved_leads (lead_id text PRIMARY KEY REFERENCES handos.leads(id), saved_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS handos.deliveries (message_id text PRIMARY KEY REFERENCES handos.messages(id), status text NOT NULL, updated_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS events_message ON handos.events(message_id);
ALTER TABLE handos.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE handos.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE handos.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE handos.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE handos.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE handos.suppressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE handos.metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE handos.saved_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE handos.deliveries ENABLE ROW LEVEL SECURITY;
COMMIT;
