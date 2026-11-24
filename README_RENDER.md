# LeadPilot — Render deployment package

This is a Render-ready Node.js web app, not just a static HTML preview.

## Included
- `server.js` — Express backend, health endpoint, PDF upload proxy and basic rate limiting.
- `public/index.html` — responsive multi-page dashboard (Overview, Lead records, Workflow, Settings) with transitions and upload UI.
- `pdf_to_customer_outreach_safe.json` — the original safe n8n workflow template for import.
- `render.yaml` — Render Blueprint configuration.

## Deploy on Render
1. Extract this ZIP and upload the folder to a GitHub repository.
2. In Render, choose **New + → Blueprint** and select the repository, or create a **Web Service** with runtime **Node**.
3. Use build command `npm install` and start command `npm start`. The included `render.yaml` contains these settings.
4. In the Render service's **Environment** tab, set `N8N_WEBHOOK_URL` to your active n8n production webhook URL, for example `https://YOUR-N8N-HOST/webhook/pdf-lead-intake`.
5. If the webhook uses header authentication, set `N8N_AUTH_HEADER_NAME` and `N8N_AUTH_HEADER_VALUE` as Render environment variables. Do not put secrets in the HTML or workflow export.
6. Deploy. Open `/api/health`; `webhookConfigured` should be `true` after the URL is saved.
7. Upload a synthetic/test PDF first and check the n8n Executions page before using real data.

## n8n setup
1. Import `pdf_to_customer_outreach_safe.json` into n8n.
2. Configure the Google Sheets credentials and spreadsheet ID placeholders.
3. Create `Leads` and `CallQueue` tabs with the headers described in the original setup instructions below.
4. Review node connections and node parameters against your installed n8n version. The workflow JSON is a starter template, not a verified live execution.
5. Test extraction, duplicate prevention, daily cap and error handling with synthetic PDFs. The current parser extracts Indian mobile numbers; source-line matching is not guaranteed to identify names correctly.
6. Keep Google Sheets, call-task and WhatsApp nodes disabled until credentials, permissions, consent checks, opt-out handling and test results are approved. The workflow is inactive by default.

## Safety and limitations
- The dashboard does not dial phone numbers or send WhatsApp messages.
- The included n8n template remains inactive; some Google Sheets, call queue and WhatsApp nodes are disabled pending configuration.
- Dashboard upload history is stored in the visitor's browser only. It is not a live Google Sheets/CRM feed, and the dashboard does not display extracted contacts yet.
- The daily target is a visual planning indicator; it is not a server-enforced 50-lead quota. The workflow template contains its own daily cap logic, which must be tested after enabling its data nodes.
- The server forwards PDF uploads to n8n and does not store them. Maximum upload size defaults to 15 MB (`MAX_FILE_MB`).
- Use an authenticated webhook or a secret header. Keep credentials in Render environment variables. Restrict access to the dashboard before handling personal lead data; this starter does not include user login.
- Add a database/unique constraint or serialized intake execution for strong duplicate protection under concurrent uploads.

## Original Google Sheet headers
`Leads`: `lead_id, phone, source, source_line, status, created_at, consent_status, call_task, whatsapp_status`

`CallQueue`: `lead_id, phone, source_line, created_at, call_task, call_status, notes`
