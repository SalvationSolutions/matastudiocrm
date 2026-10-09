# Guest Database and Google Email Campaigns

## Database
Cloudflare D1 stores guest records, opt-in status, draft campaigns, and delivery logs. Apply `database/002_guests_email.sql` if provisioning a new database. Production D1 schema was initialized on 2026-10-09.

## Required before sending
1. Implement staff login and permissions. Guest personal data and campaign endpoints remain blocked until then.
2. Choose Google Workspace Gmail or personal Gmail; set up OAuth consent and obtain authorization through Google's approved OAuth flow.
3. Store Google tokens as Cloudflare secrets or encrypted at rest, never in GitHub or browser JavaScript.
4. Send only to guests with recorded opt-in; include unsubscribe and suppression checks.
5. Use per-recipient delivery idempotency, rate limits, retry with backoff, and logs. Never bypass Google quota restrictions.
6. Ensure the sending domain has SPF, DKIM and DMARC where applicable.
7. For large-scale promotional campaigns, consider a dedicated bulk email service instead of Gmail.

## Status
Database and locked endpoints are implemented. No guest data imported, no OAuth connected, no emails sent.
