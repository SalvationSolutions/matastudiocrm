-- MATA Studio CRM schema. Apply through Cloudflare D1 migrations.
CREATE TABLE IF NOT EXISTS crm_profiles (customer_id TEXT PRIMARY KEY, display_name TEXT, style_preferences TEXT NOT NULL DEFAULT '{}', tags TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_consents (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, channel TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('granted','revoked')), recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, source TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES crm_profiles(customer_id));
CREATE INDEX IF NOT EXISTS idx_consents_customer ON crm_consents(customer_id,channel);
CREATE TABLE IF NOT EXISTS crm_notes (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, author_id TEXT NOT NULL, note TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(customer_id) REFERENCES crm_profiles(customer_id));
CREATE TABLE IF NOT EXISTS crm_sync_state (source TEXT PRIMARY KEY, cursor TEXT, last_success_at TEXT, last_error TEXT);
CREATE TABLE IF NOT EXISTS crm_audit (id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, action TEXT NOT NULL, target_id TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, details TEXT NOT NULL DEFAULT '{}');
CREATE TABLE IF NOT EXISTS crm_loyalty_ledger (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, source_event_id TEXT NOT NULL UNIQUE, points_delta INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
