-- Customer 360 foundation: POS remains the sole authority for sales, invoices and reversals.
-- This migration stores read-only replicas and source identifiers; it does not modify RMATA POS.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS crm_pos_customer_links (
  pos_customer_id TEXT PRIMARY KEY,
  crm_customer_id TEXT NOT NULL,
  match_method TEXT NOT NULL CHECK(match_method IN ('exact_id','staff_verified','new_profile')),
  verified_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (crm_customer_id) REFERENCES crm_profiles(customer_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_customer_links_crm ON crm_pos_customer_links(crm_customer_id);
CREATE TABLE IF NOT EXISTS crm_pos_customers (
  pos_customer_id TEXT PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  mobile TEXT,
  source_updated_at TEXT,
  synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS crm_pos_sales (
  invoice_no TEXT PRIMARY KEY,
  pos_customer_id TEXT,
  business_date TEXT,
  sold_at TEXT,
  status TEXT NOT NULL,
  total_centavos INTEGER NOT NULL DEFAULT 0,
  source_updated_at TEXT,
  synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pos_sales_customer ON crm_pos_sales(pos_customer_id,business_date);
CREATE TABLE IF NOT EXISTS crm_pos_sale_items (
  sale_item_id TEXT PRIMARY KEY,
  invoice_no TEXT NOT NULL,
  sku TEXT,
  product_name TEXT,
  quantity REAL NOT NULL DEFAULT 0,
  line_total_centavos INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (invoice_no) REFERENCES crm_pos_sales(invoice_no)
);
CREATE INDEX IF NOT EXISTS idx_pos_sale_items_invoice ON crm_pos_sale_items(invoice_no);
CREATE TABLE IF NOT EXISTS crm_pos_reversals (
  reversal_id TEXT PRIMARY KEY,
  invoice_no TEXT NOT NULL,
  reversal_type TEXT NOT NULL,
  status TEXT NOT NULL,
  amount_centavos INTEGER NOT NULL DEFAULT 0,
  occurred_at TEXT,
  synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_no) REFERENCES crm_pos_sales(invoice_no)
);
CREATE INDEX IF NOT EXISTS idx_pos_reversals_invoice ON crm_pos_reversals(invoice_no);
CREATE TABLE IF NOT EXISTS crm_pos_sync_events (
  event_key TEXT PRIMARY KEY,
  source_table TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  source_fingerprint TEXT NOT NULL,
  processed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pos_sync_events_record ON crm_pos_sync_events(source_table,source_record_id);
CREATE VIEW IF NOT EXISTS crm_customer_purchase_summary AS
SELECT l.crm_customer_id, COUNT(DISTINCT CASE WHEN lower(s.status) IN ('completed','paid','success') THEN s.invoice_no END) AS completed_purchase_count,
 COALESCE(SUM(CASE WHEN lower(s.status) IN ('completed','paid','success') THEN s.total_centavos ELSE 0 END),0)
 - COALESCE((SELECT SUM(r.amount_centavos) FROM crm_pos_reversals r JOIN crm_pos_sales rs ON rs.invoice_no=r.invoice_no WHERE rs.pos_customer_id=l.pos_customer_id AND lower(r.status) IN ('completed','approved','processed')),0) AS net_spend_centavos
FROM crm_pos_customer_links l LEFT JOIN crm_pos_sales s ON s.pos_customer_id=l.pos_customer_id GROUP BY l.crm_customer_id;
