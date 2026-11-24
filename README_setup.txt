# PDF-to-Customer Outreach Automation (Safe Starter)

## What is included
- `pdf_to_customer_outreach_safe.json`: importable n8n workflow template.
- `leadpilot_admin_dashboard_preview.html`: static admin dashboard preview (not connected to n8n yet).

## Important safety state
- Workflow `active` is `false`.
- Google Sheets read/append nodes, human call-task creation, and WhatsApp HTTP node are disabled.
- No calls or messages will be sent by this template as delivered.
- Human calling means a salesperson makes the call from the CallQueue sheet; this workflow does not dial.
- Awaaz AI is intentionally not used because calling mode was set to human.

## n8n setup
1. Import the JSON into your n8n instance.
2. Create a Google spreadsheet with two tabs:
   - `Leads`
   - `CallQueue`
3. In both tabs, add headers matching these fields:
   `lead_id, phone, source, source_line, status, created_at, consent_status, call_task, whatsapp_status`
   The CallQueue tab can use:
   `lead_id, phone, source_line, created_at, call_task, call_status, notes`
4. Configure Google Sheets credentials on the three Google Sheets nodes and replace `REPLACE_WITH_GOOGLE_SHEET_ID`.
5. Configure the WhatsApp Cloud API node with your own Meta Cloud API phone-number ID, token credential, API version, and an approved template. Do not paste tokens into shared workflow JSON. Replace the placeholder URL and template name.
6. Review the PDF extraction output. The current parser extracts Indian mobile numbers and retains the source line for manual name verification; it does not guarantee perfect name-to-number matching.
7. Enable the Google Sheets lookup node first, then the lead append and call-queue nodes. Test with synthetic data before any real leads.
8. For WhatsApp, add a consent check and opt-out suppression before enabling the HTTP node. Only message people who have the required permission and use approved templates where required.
9. Test a duplicate number across two separate PDF uploads and verify it is not appended twice. Test the 50/day cap across separate runs.
10. Only after all tests, credentials, permissions, and legal/compliance checks are approved should you activate the workflow.

## Webhook
After activating the workflow deliberately, configure an authenticated upload route around the webhook path `pdf-lead-intake`. The webhook expects a PDF binary property named `data`. Do not expose an unauthenticated public upload endpoint. The dashboard HTML is only a visual preview and is not yet wired to this webhook.

## Limitations / verification
- The JSON structure and connections were checked locally; this is not a live n8n import or execution test.
- Exact node parameter compatibility can vary by n8n version. Confirm in your n8n instance after import.
- Google Sheets nodes are disabled and require credentials and a spreadsheet ID.
- The daily cap counts rows whose `created_at` date matches today in the Leads tab; use a timezone-consistent date strategy in production.
- Concurrent uploads can race the read-then-append duplicate check. For stronger cross-run guarantees, use a database with a unique constraint on normalized phone number or serialize intake executions.
- The dashboard is a static preview with no backend, authentication, or live metrics.
