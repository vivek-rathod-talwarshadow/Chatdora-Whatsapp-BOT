# ChatDORA WhatsApp AI Bot

ChatDORA supports two WhatsApp connection modes:

1. QR Login through the existing WhatsApp Engine
2. Official Meta Cloud API

The dashboard app does not run its own QR worker anymore. It connects to the already deployed external engine at `wa.chatdora.in` or a local engine instance during development.

## App URLs

- Local dashboard: `http://localhost:3000`
- Local engine if needed: `http://127.0.0.1:3001`
- Production dashboard can later be: `https://wa.chatdora.in`

Runtime app URLs are environment-driven. No dashboard logic depends on a hardcoded `chatdora.in` app URL.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth + PostgreSQL
- Existing external WhatsApp Engine using Baileys
- OpenRouter, Groq, Hugging Face fallback AI
- Meta WhatsApp Cloud API for advanced official mode

## Environment setup

Copy the example:

```bash
cp .env.example .env.local
```

Set:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
WHATSAPP_ENGINE_BASE_URL=https://wa.chatdora.in
CHATDORA_DASHBOARD_TOKEN=
ENABLE_BACKGROUND_QR_SYNC=true
QR_SYNC_MEMORY_CEILING_MB=340
QR_SYNC_MAX_CONVERSATIONS_PER_RUN=8
QR_SYNC_MAX_MESSAGES_PER_CONVERSATION=20
QR_SYNC_MAX_REPLIES_PER_RUN=8

SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

BREVO_API_KEY=
RESEND_API_KEY=
EMAIL_FROM_EMAIL=
EMAIL_FROM_NAME=ChatDora

OPENROUTER_API_KEY=
GROQ_API_KEY=
HUGGINGFACE_TOKEN=
CHATDORA_OPENROUTER_API_KEY=
CHATDORA_GROQ_API_KEY=

META_GRAPH_API_VERSION=v19.0
```

For local engine development:

```env
WHATSAPP_ENGINE_BASE_URL=http://127.0.0.1:3001
```

`CHATDORA_DASHBOARD_TOKEN` is optional right now if your WhatsApp Engine does not enforce server-to-server auth yet. If you later add engine auth, set the same token in both services.

`ENABLE_BACKGROUND_QR_SYNC` is the QR-mode fallback processor. Keep it `true` if you need the dashboard app to keep pulling inbound QR messages from the engine. Set it to `false` only when you are sure direct inbound callbacks to `/api/inbound-message` are working in production.

For Render protection, the QR fallback worker also supports hard caps:

- `QR_SYNC_MEMORY_CEILING_MB`: skip QR sync when RSS is already near the instance limit
- `QR_SYNC_MAX_CONVERSATIONS_PER_RUN`: only inspect the most recent conversations per sweep
- `QR_SYNC_MAX_MESSAGES_PER_CONVERSATION`: only inspect the latest messages in each chat
- `QR_SYNC_MAX_REPLIES_PER_RUN`: limit how many replies one background sweep can generate

## Supabase setup

Run one SQL file in Supabase SQL Editor:

- RLS version: [supabase/migrations/001_chatdora_init.sql](/c:/ChatDORA-Codespace/Chatdora-Whatsapp-FAQ/supabase/migrations/001_chatdora_init.sql:1)
- Easier local-first version: [supabase/migrations/001_chatdora_quickstart_no_rls.sql](/c:/ChatDORA-Codespace/Chatdora-Whatsapp-FAQ/supabase/migrations/001_chatdora_quickstart_no_rls.sql:1)

Important tables:

- `profiles`
- `businesses`
- `faqs`
- `whatsapp_settings`
- `whatsapp_connections`
- `leads`
- `messages`
- `ai_logs`
- `subscriptions`

Then run this email verification migration after the base schema:

- `supabase/migrations/003_email_verification_tokens.sql`

## Custom email delivery

Signup verification now uses your own email API provider instead of Supabase's built-in email sender.

Recommended setup for Render free:

- set `BREVO_API_KEY` or `RESEND_API_KEY` in Render
- set `EMAIL_FROM_EMAIL` to a verified sender like `noreply@yourdomain.com`
- set `EMAIL_FROM_NAME` to your brand name

This app sends a custom HTML verification email from the dashboard server over HTTPS, which is important because Render free services block outbound SMTP ports.

## Local app run

Install dependencies:

```bash
npm install
```

Run the dashboard:

```bash
npm run dev
```

If you want QR mode locally, also run your existing WhatsApp Engine separately on port `3001` and point `WHATSAPP_ENGINE_BASE_URL` to it.

## WhatsApp Connection Modes

### 1. QR Login through WhatsApp Engine

Dashboard flow:

1. Go to `/dashboard/whatsapp`
2. Click `Connect with QR`
3. Dashboard calls `POST /api/whatsapp/qr/start`
4. App calls `{WHATSAPP_ENGINE_BASE_URL}/sessions/:workspaceId/start`
5. QR appears in modal
6. Dashboard polls `GET /api/whatsapp/qr/status`
7. App calls `{WHATSAPP_ENGINE_BASE_URL}/sessions/:workspaceId`
8. When connected, QR closes and connected status appears

Workspace ID is stable:

```text
workspace_<business_id>
```

QR mode details:

- available to all users and plans
- no Meta setup required
- no token fields shown in the normal QR flow
- engine handles QR session + WhatsApp Web delivery
- app handles FAQ matching, AI fallback, leads, and message logging

### 2. Official Meta API

Advanced route:

```text
/dashboard/admin/whatsapp
```

This keeps:

- phone number ID
- access token
- verify token
- app secret
- connection active toggle
- test connection
- webhook URL

Webhook URL is dynamic:

```text
${NEXT_PUBLIC_APP_URL}/api/webhook/whatsapp
```

## Inbound message flow

### QR mode

1. WhatsApp Engine receives inbound WhatsApp message
2. Engine forwards inbound to:

```text
/Whatsapp-web-bot/api/inbound-message/
```

3. App accepts `workspace_id`
4. App finds the matching business via `whatsapp_connections.workspace_id`
5. App runs the existing bot engine
6. App saves messages and leads
7. App returns:

```json
{
  "ai_sent": true,
  "reply": "message text",
  "lead_id": "optional"
}
```

8. Engine sends that reply back over Baileys

### Meta mode

1. Meta webhook hits `/api/webhook/whatsapp`
2. App runs the same bot engine
3. App sends the final reply through Meta Graph API helper

## Engine health

The dashboard checks:

```text
GET {WHATSAPP_ENGINE_BASE_URL}/health
```

It shows:

- online
- offline
- active sessions if returned
- uptime if returned

## Testing checklist

1. Login
2. Create business
3. Add FAQ
4. Go to WhatsApp page
5. Select Instant QR Login
6. Click Connect with QR
7. QR appears
8. Scan QR
9. Status becomes connected
10. Send WhatsApp message from another phone
11. Engine forwards inbound to app
12. App returns AI/FAQ reply
13. Engine sends reply to WhatsApp
14. Lead saved
15. Message saved
16. Switch to Meta mode
17. Meta settings still work
18. Switch back to QR mode
19. Only one active mode at a time

## Notes

- Brand text can still say ChatDORA, `contactus@chatdora.in`, and `7622858519`.
- `CHATDORA_DASHBOARD_TOKEN` is only used server-to-server and is never exposed to the frontend. It can stay blank until your engine starts enforcing auth.
- The dashboard app reuses the existing bot engine and does not duplicate QR session management.
