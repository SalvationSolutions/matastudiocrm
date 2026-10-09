# Personal Gmail connection for MATA Studio CRM

## Current status
Gmail selected. OAuth authorization and sending remain disabled until staff authentication and Google OAuth credentials are configured. No Google password is required.

## Google Cloud setup
1. Open https://console.cloud.google.com/ and create/select a project for MATA Studio CRM.
2. Configure Google Auth Platform consent screen. Choose External if needed; add the Gmail owner as a test user while the app is in testing.
3. Enable the Gmail API.
4. Create an OAuth 2.0 client of type Web application.
5. Add authorized redirect URI: `https://matastudiocrm.pages.dev/api/google/callback`.
6. In Cloudflare Pages > matastudiocrm > Settings > Variables and Secrets, securely set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_OAUTH_REDIRECT_URI` (the URI above). Do not add these to GitHub.
7. Complete CRM staff authentication before enabling the connect/callback flow. Use state and PKCE protections, validate session and account ownership, and encrypt stored refresh tokens.
8. Request only the minimum Gmail scopes necessary to send email. Gmail API `gmail.send` is a sensitive scope and Google's verification requirements may apply.
9. Send only to explicitly opted-in guests; use unsubscribe, throttling, retries, suppression and delivery logs. Respect personal Gmail limits and anti-spam requirements.

## Security
The API currently blocks Gmail connect and campaigns until authentication is ready. Do not use a personal Gmail app password or publish OAuth client secrets.
