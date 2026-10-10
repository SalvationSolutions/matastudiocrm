# Isolated POS-to-CRM sync worker

This code is **not deployed** and does not activate customer data sharing.

## Components
- RMATA POS branch `feature/scoped-crm-export`: `crm-export.js` and a single read-only route in `worker.js` at `/internal/crm-export`.
- CRM branch `feature/secure-pos-crm-sync`: `pos-sync-worker.js` and `lib/pos-import.js`.
- CRM D1 schema `database/003_customer360_pos.sql` must already be applied.

## Deployment prerequisites
1. Review both branches and run unit tests before merging.
2. Generate one random 32+ byte secret; set it as **POS** `CRM_EXPORT_SECRET` and **CRM sync Worker** `POS_EXPORT_SECRET` using Cloudflare secret management. Never commit the value.
3. Configure CRM sync Worker `POS_EXPORT_URL=https://rmataclothing.pages.dev/internal/crm-export`; bind `CRM_DB` to the existing D1 database.
4. Deploy the CRM sync Worker as a **separate Worker** with a controlled cron schedule. Do not expose it as a browser API. Test manually against synthetic data before scheduling.
5. Ensure POS Worker bundling includes `crm-export.js` and the route responds 401 without a valid signature.
6. Confirm that no POS checkout, invoice, inventory, print, or EOD behavior changed.

## Security and limitations
- The POS export is GET-only, signed with HMAC-SHA256 and a 60-second timestamp window. Nonces are included in the signature but **not stored**: replay within the window is still possible. Because the endpoint is read-only, a repeated authorized request does not mutate POS; consider Cloudflare Access service tokens and/or nonce tracking before production.
- The export intentionally includes customer name, phone, email, and transaction amounts. Treat all responses and logs as sensitive.
- Import uses deterministic upserts and D1 batch writes. It scans all source records each run to capture changes to older sales and reversals; this may be expensive at scale and is not a transactional snapshot of Google Sheets.
- Source tables are processed in dependency order: Customers, Sales, SaleItems, VoidsRefunds. Missing referenced invoices will fail their batches; investigate rather than silently discarding reversals.
- Do not enable live Customer 360 APIs until staff authentication, role authorization, privacy controls, and audit are implemented.
- The purchase-summary view needs a separate reconciliation test for partial refunds, statuses, and duplicate reversal handling.
- A scheduled run's checkpoint is a last-success marker, **not** a source cursor. Re-running is safe but potentially expensive.
- No production deployment, secret configuration, live sync, or reconciliation test has been completed by these commits.

## Required QA before merge
- Unsigned, expired, tampered and invalid-table requests fail.
- Valid signed requests return only the whitelisted columns and at most 100 rows.
- Empty tables, multiple pages, repeated runs and source updates behave correctly.
- Verify centavo rounding, source IDs, no auto-merging on phone/email, no customer PII in browser before auth.
- Verify sale/line-item/refund totals and closed-day invoices against RMATA POS.
- Validate build, Worker deployment and D1 binding in preview/staging before production.
