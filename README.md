# MATA Studio CRM

Standalone modular customer relationship management application for MATA Studio.

## Status
Initial project scaffold. No live POS connection, customer data, or authentication yet.

## Architecture
- Separate CRM application and deployment from existing RMATA POS.
- CRM owns customer preferences, consent, and engagement records.
- Existing POS remains the source of truth for invoices, payments, inventory, and EOD.
- Future POS integration uses authenticated read-only backend APIs; never embed service credentials in browser code.
- Modules: Customer 360, Purchases, Style Passport, Atelier, Loyalty, Campaigns, Analytics, Settings.

## Security
Do not commit customer exports, API keys, Google service-account credentials, or passwords. This repository is currently public.

## Development
Start with isolated UI and fictional demo records; add authentication and D1 storage before accessing real customer data.
