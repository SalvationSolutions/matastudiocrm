# Customer 360 / RMATA POS integration — implementation plan

## Verified source architecture
RMATA POS repository: SalvationSolutions/rmataclothing. Its Cloudflare Worker reads and writes Google Sheets. Relevant source sheets: Customers (CustomerID, FirstName, LastName, Mobile, Email), Sales (InvoiceNo, BusinessDate, CustomerID, Total, Status, ClientTransactionID), SaleItems (SaleItemID, InvoiceNo, SKU, Qty, LineTotal), and VoidsRefunds (ReversalID, InvoiceNo, Type, Amount, Status).

## Safety boundaries
- RMATA POS remains authoritative for sales, invoices, inventory, voids, refunds, and EOD/Z readings.
- CRM receives a minimum necessary, read-only projection. No payment references, staff credentials, PINs, or Google service account keys are replicated.
- Do not call the existing generic gettable endpoint from a browser or embed POS staff tokens in CRM source.
- Do not connect to live customer data before staff authentication, role authorization, and consent/privacy review are complete.
- Existing CRM /api/customers and /api/guests stay 403 until those protections are implemented.
- No direct writes to POS Sheets or Worker from CRM.

## Connection design
1. Implement a narrowly scoped, server-to-server POS export endpoint in RMATA's Worker, with a separate Cloudflare secret and replay-resistant authentication (HMAC with timestamp and nonce, or a dedicated service identity). Explicitly whitelist Customers, Sales, SaleItems, VoidsRefunds; filter by source watermark; never expose unrestricted table access.
2. Implement a CRM scheduled Worker to fetch the export over HTTPS and validate records. Keep secret values in Cloudflare secrets, not GitHub.
3. Apply database/003_customer360_pos.sql to CRM D1. Sync each source record with stable IDs and deterministic upsert. Store a checkpoint in crm_sync_state only after successful batch commit; retry safely.
4. Match exact POS CustomerID first. For unknown IDs create a new CRM profile and link; for email/phone similarity, queue manual review rather than auto-merge. Guests with no POS CustomerID remain guests.
5. Handle sale status changes and reversals as distinct source records. Never delete original sales. Reconcile per-customer totals against POS.
6. Expose CRM Customer 360 via authenticated, role-checked API, with PII minimized and audit logs. Replace fictional UI data only after validation.
7. Test with synthetic records, void/refund, retries, missing customer IDs, partial batch failure, duplicate delivery, and closed-day transactions.

## Migration notes
All money is stored in integer centavos. The current SQL view is a preliminary projection: the exact POS status and reversal vocabulary must be verified before relying on totals. Partial refunds and repeated reversals require reconciliation tests. No live sync is active from this commit.

## Launch checklist
- [ ] Staff authentication and role checks
- [ ] Scoped POS export endpoint with server-side authorization
- [ ] Secrets configured on both projects
- [ ] D1 migration applied
- [ ] Scheduled sync with idempotent upserts and checkpoints
- [ ] Consent, privacy, retention and audit review
- [ ] Reconciliation and reversal QA
- [ ] Replace demo data with authorized CRM API
