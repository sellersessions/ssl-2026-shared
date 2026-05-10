# WhatsApp Business API — Expert Reference for Amazon Brand Operations

> **Scope:** Everything the syncflow system needs to know about WhatsApp Business API — from Meta Cloud API setup through BSP selection, template management, opt-in compliance, n8n integration, Supabase schema design, and full Creator/Influencer outreach workflow automation. This is opinionated, practitioner-level guidance for Amazon brands running CRM and outreach automation at scale.  
> **Stack Context:** Meta Cloud API + n8n + Supabase + ClickUp  
> **Last Updated:** May 2026

---

## Table of Contents

1. [WhatsApp Business API Landscape](#1-whatsapp-business-api-landscape)
2. [Access Requirements & Onboarding](#2-access-requirements--onboarding)
3. [Authentication](#3-authentication)
4. [Message Types In Depth](#4-message-types-in-depth)
5. [Template Approval Process](#5-template-approval-process)
6. [Opt-In Compliance](#6-opt-in-compliance)
7. [Webhook Setup](#7-webhook-setup)
8. [Rate Limits & Messaging Tiers](#8-rate-limits--messaging-tiers)
9. [n8n Integration](#9-n8n-integration)
10. [Supabase Integration & Schema](#10-supabase-integration--schema)
11. [Creator/Influencer Outreach Workflow End-to-End](#11-creatorinfluencer-outreach-workflow-end-to-end)
12. [Conversation Routing & Inbound Handling](#12-conversation-routing--inbound-handling)
13. [Cost Structure](#13-cost-structure)
14. [BSP Comparison Table](#14-bsp-comparison-table)
15. [Common Pitfalls](#15-common-pitfalls)
16. [GDPR & Data Handling](#16-gdpr--data-handling)
17. [Dos & Don'ts](#17-dos--donts)
18. [Quick Reference Cheat Sheet](#18-quick-reference-cheat-sheet)

---

## 1. WhatsApp Business API Landscape

### Two Ways In: Meta Cloud API vs. BSP

There are two ways to access the WhatsApp Business API: go **direct through Meta** (Meta Cloud API, formerly Cloud API) or go **through a Business Solution Provider (BSP)** that abstracts the API for you. Understanding the trade-offs is the first decision every implementation makes — and it's consequential.

---

### Meta Cloud API (Direct)

Meta hosts the WhatsApp infrastructure. You send API calls directly to `graph.facebook.com`, and Meta handles message delivery. No middleware.

**Pros:**
- Lowest latency: your request goes directly to Meta, no BSP hop
- Cheapest per-message cost: you only pay Meta's conversation-based pricing, no BSP markup
- Full feature access: every new WhatsApp feature (Flows, catalog messages, authentication templates) is available on day one
- Complete control: webhook configuration, rate limit management, and debugging happen in Meta's own Business Manager and developer console
- The n8n HTTP Request node talks to it natively — no SDK needed

**Cons:**
- Higher setup complexity: you wire Meta Business Verification, WABA creation, phone number registration, and webhook configuration yourself
- No support escalation path: if something breaks, you're debugging with Meta's (mediocre) developer documentation and community forums
- You own the infrastructure layer: webhook endpoint, token refresh, retry logic — all yours
- The phone number is registered to your Meta account, not a BSP account — meaning if you switch to a BSP later, the migration is non-trivial

**Best for:** Amazon brands building on n8n/Supabase who have a developer (or Claude) wiring things together. The syncflow system is a direct-API shop. The BSP markup is unjustifiable when you have automation tooling.

---

### BSP Providers

Business Solution Partners are companies Meta has certified to resell WhatsApp API access. They sit between you and Meta: you call their API, they call Meta's.

**360dialog**
- The most developer-friendly BSP. Provides a clean REST API that closely mirrors Meta's Cloud API format
- Cheapest of the BSPs (around $5–10/month base + Meta conversation costs with a small markup)
- Has an official n8n node (WhatsApp Business node is built on 360dialog for hosted n8n)
- Solid documentation
- Recommended if you must use a BSP

**WATI (WhatsApp Team Inbox)**
- Targeted at non-technical teams who want a UI-based inbox for managing WhatsApp conversations
- Has broadcast features, contact management, and a chatbot builder
- Higher cost (plans start ~$40/month)
- Less flexible for custom automation — their API is constrained to their platform's model
- Use if the client team needs a human inbox to manage replies, not for pure automation

**Twilio**
- Twilio's WhatsApp integration is a wrapper around the WhatsApp API that feels like Twilio's SMS API
- Easy if you already use Twilio for SMS (same auth, same SDK patterns)
- Expensive: Twilio adds a significant per-message markup on top of Meta's conversation fees
- Good documentation, reliable infrastructure
- Avoid for high-volume marketing — the cost compounds fast

**MessageBird (now Bird)**
- Good platform with multichannel messaging (WhatsApp + SMS + email)
- Enterprise-focused pricing, complex contracts
- Overkill for single-channel WhatsApp automation

**Vonage (now Vonage by Ericsson)**
- Strong enterprise pedigree, less startup-friendly
- Higher base pricing, less developer-first documentation
- Not recommended for syncflow use cases

---

### Which to Pick for an Amazon Brand

**Default recommendation: Meta Cloud API directly.**

If the brand has a developer or is building on syncflow's n8n stack, direct access is always right. The setup takes one afternoon. The savings are real — BSP markups on a 10,000 message/month operation run $50–200/month in pure overhead.

**Use a BSP only when:**
- The client's team needs a human-inbox UI to manage inbound replies and you don't want to build one
- The brand is in a market where a specific BSP has a local support relationship or compliance advantage (rare)
- You need to be live in under 2 hours and haven't verified a Meta Business yet (BSPs can sometimes shortcut this)

**If you use a BSP: pick 360dialog.** It's the cheapest, closest to the raw Meta API, and has n8n integration. Avoid WATI for pure automation — it's built for human agents, not programmatic flows.

---

## 2. Access Requirements & Onboarding

### Step 1: Meta Business Verification

Before sending any messages beyond the test environment, the Meta Business Account must be verified. This is the most common sticking point.

**What Meta verifies:**
- The business is a real, legally registered entity
- You own the domain associated with the business
- Business documentation (articles of incorporation, business license, or utility bill showing business name and address)

**What to prepare:**
1. A registered business entity (LLC, Inc., Ltd. — sole proprietors are accepted but often slower)
2. A business website at a domain you own (must have the business name visible and be live)
3. A legal document showing the business name and country: business registration certificate, articles of incorporation, or a government-issued business license
4. Phone number for the business (the Meta verification OTP will be sent here)

**The verification flow:**
1. Go to Meta Business Manager → Business Settings → Security Center → "Start Verification"
2. Select your country and business type
3. Submit the document
4. Meta takes 1–5 business days; complex cases can take 2 weeks
5. You may receive a manual review request — respond promptly

**Pro tip:** Submit a government-issued business registration document, not a bank statement or utility bill. Government documents have the highest first-pass approval rate. Bank statements are often rejected for verification even though Meta lists them as acceptable.

---

### Step 2: WhatsApp Business Account (WABA) Creation

A WhatsApp Business Account is the Meta entity that holds your phone numbers and templates. It sits inside your Meta Business Account.

**Create it from:**
- Meta Business Manager → Accounts → WhatsApp Accounts → "Add"
- OR via the WhatsApp Embedded Signup flow in your app/developer console

**What you need:**
- Verified Meta Business Account
- A business display name (what contacts see in WhatsApp — subject to review)
- A business category

**WABA ID:** When created, note the WABA ID. Every API call for template management references this ID.

---

### Step 3: Phone Number Registration

You register a phone number against your WABA. This number is your WhatsApp "sender" identity.

**Number requirements:**
- Must be capable of receiving a voice call or SMS for OTP verification
- Cannot currently be active on a regular WhatsApp account (personal or WhatsApp Business App). If it is, you must delete that WhatsApp account on the device first.
- A landline, VoIP number, or mobile number all work — VoIP numbers (Twilio, Vonage) are commonly used for programmatic setups
- One WABA can have up to 20 phone numbers

**Registration steps:**
1. In Meta Business Manager → WhatsApp Accounts → select your WABA → Phone Numbers → Add Phone Number
2. Enter the number
3. Choose OTP method: SMS or voice call
4. Enter the 6-digit OTP
5. The number is now registered and in "Connected" status

**Display name approval:** The phone number has its own display name (separate from the WABA display name). It goes through Meta's review (usually minutes to 24 hours). It must match your business name or be a recognizable variation — "Brand Name Official" passes, "Get 50% Off Now" does not.

---

### Step 4: Enable the Cloud API

1. Go to Meta for Developers → Your App → WhatsApp → Getting Started
2. Add your WABA to the app
3. Note your Phone Number ID (different from the phone number itself) — this is what the API uses to identify which number sends a message
4. Generate your access token (see Section 3)

---

## 3. Authentication

### Meta System User Access Tokens

There are two types of access tokens in the Meta ecosystem:

**User access tokens:** Tied to an individual's Facebook/Meta account. They expire (default 60 days). If that person's account is deactivated or they leave the company, the token breaks your integration. **Never use these in production.**

**System User access tokens:** Tied to a "System User" — a non-human entity in Meta Business Manager that represents your application or integration. These are the correct token for server-to-server automation.

**Creating a System User:**
1. Meta Business Manager → Business Settings → Users → System Users → "Add"
2. Name it something descriptive: `syncflow-whatsapp-automation`
3. Set role: Admin (for full API access) or Employee (restricted)
4. Assign the System User to your WhatsApp assets: go to Assign Assets → WhatsApp Accounts → select your WABA → full control
5. Generate a token: click "Generate New Token" → select the App → select the scopes you need

**Required scopes for WhatsApp:**
```
whatsapp_business_messaging
whatsapp_business_management
```

**Token expiry:**
- System User tokens can be set to **never expire** when you choose "Never" in the expiry dropdown during generation
- Choose never-expire for automation use cases — rotating tokens on a schedule is operational overhead you don't need
- If you set a short expiry for security reasons, build a token refresh workflow in n8n before your automation silently breaks

**Storing the token in n8n:**
Never hardcode the token in a workflow. Use n8n credentials:
1. n8n → Credentials → New → "Header Auth"
2. Name: `Meta WhatsApp Token`
3. Header Name: `Authorization`
4. Value: `Bearer YOUR_SYSTEM_USER_TOKEN`

Reference it in HTTP Request nodes via the Credential field.

**Storing the token in Supabase:**
For multi-tenant syncflow setups where different brands have different tokens:

```sql
CREATE TABLE whatsapp_credentials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid REFERENCES brands(id),
  waba_id text NOT NULL,
  phone_number_id text NOT NULL,
  access_token text NOT NULL,  -- encrypt at rest using pgcrypto or vault
  token_expiry timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

Use Supabase Vault or pgcrypto's `encrypt()` function — never store access tokens in plaintext columns.

---

### Webhook Verification (X-Hub-Signature-256)

Every webhook request Meta sends to your endpoint includes an `X-Hub-Signature-256` header. This is an HMAC-SHA256 signature of the request body, signed with your App Secret.

**Verify it on every inbound webhook:**

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, appSecret) {
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', appSecret)
    .update(payload, 'utf8')  // payload must be the raw request body buffer
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// In your webhook handler:
const rawBody = req.rawBody;  // MUST be raw buffer, not parsed JSON
const signature = req.headers['x-hub-signature-256'];

if (!verifyWebhookSignature(rawBody, signature, process.env.META_APP_SECRET)) {
  return res.status(401).send('Invalid signature');
}
```

**Critical:** You must verify against the **raw request body bytes**, not a re-serialized JSON object. JSON serialization is not deterministic (key ordering, whitespace) — if you parse then re-stringify, the HMAC will not match. In n8n, use the Webhook node with "Raw Body" mode enabled.

**Webhook verification challenge (GET request):**
When you register a webhook URL in Meta's developer console, Meta sends a GET request to verify you own the endpoint:

```javascript
// Handle GET request for webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});
```

Set `WEBHOOK_VERIFY_TOKEN` to any random string you control and enter the same value in Meta's webhook configuration UI.

---

## 4. Message Types In Depth

### Overview

WhatsApp messages fall into two fundamental categories with different rules:

| Category | Window | Requires Template? | Examples |
|---|---|---|---|
| **Business-initiated** | Any time | Yes (template) | Marketing campaigns, notifications, outreach |
| **User-initiated (service)** | 24h after last user message | No | Free-form replies, support conversations |

---

### Template Messages (HSMs — Highly Structured Messages)

Template messages are pre-approved message formats you can send outside the 24-hour session window. They are the backbone of outreach automation.

**Structure:**
```json
{
  "messaging_product": "whatsapp",
  "to": "15551234567",
  "type": "template",
  "template": {
    "name": "creator_outreach_v1",
    "language": { "code": "en_US" },
    "components": [
      {
        "type": "header",
        "parameters": [
          { "type": "image", "image": { "link": "https://cdn.example.com/brand-logo.jpg" } }
        ]
      },
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Sarah" },
          { "type": "text", "text": "EcoHome by GreenLeaf" },
          { "type": "text", "text": "15%" }
        ]
      },
      {
        "type": "button",
        "sub_type": "quick_reply",
        "index": "0",
        "parameters": [{ "type": "payload", "payload": "INTERESTED_YES" }]
      },
      {
        "type": "button",
        "sub_type": "quick_reply",
        "index": "1",
        "parameters": [{ "type": "payload", "payload": "NOT_INTERESTED" }]
      }
    ]
  }
}
```

---

### Session / Free-Form Messages (24-Hour Window)

Once a user sends any message to your number, a **24-hour session window** opens. Within that window, you can send any message type without using a template.

This is the most valuable channel for conversation: you can send personalized text, ask follow-up questions, negotiate collaboration terms, and close deals — all without template approval.

**Sending a free-form text message:**
```json
{
  "messaging_product": "whatsapp",
  "to": "15551234567",
  "type": "text",
  "text": {
    "preview_url": false,
    "body": "Hey Sarah! Happy to answer any questions about the collab. The commission rate is flexible — what would work for you?"
  }
}
```

**Session window reset:** Every inbound user message resets the 24-hour window. If a conversation stays active, you effectively have unlimited free-form messaging.

**What happens when the window expires:** Your free-form message fails with error code `131026` ("Message Undeliverable"). You must fall back to a template.

---

### Interactive Messages

Interactive messages add structured UI elements — buttons and list pickers — that make conversations more efficient and response rates higher.

**Quick Reply Buttons (up to 3):**
```json
{
  "messaging_product": "whatsapp",
  "to": "15551234567",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": { "text": "Are you interested in collaborating with us?" },
    "action": {
      "buttons": [
        { "type": "reply", "reply": { "id": "YES_INTERESTED", "title": "Yes, tell me more!" } },
        { "type": "reply", "reply": { "id": "NOT_NOW", "title": "Not right now" } },
        { "type": "reply", "reply": { "id": "WRONG_PERSON", "title": "Wrong person" } }
      ]
    }
  }
}
```

**List Messages (up to 10 options):**
```json
{
  "messaging_product": "whatsapp",
  "to": "15551234567",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "header": { "type": "text", "text": "Choose your preferred partnership type" },
    "body": { "text": "We have a few collaboration models available for creators like you." },
    "footer": { "text": "Tap to select one" },
    "action": {
      "button": "See Options",
      "sections": [
        {
          "title": "Partnership Types",
          "rows": [
            { "id": "MODEL_COMMISSION", "title": "Commission (15%)", "description": "Earn per sale you drive" },
            { "id": "MODEL_GIFTED", "title": "Gifted Product", "description": "Receive product to review" },
            { "id": "MODEL_PAID", "title": "Paid Post", "description": "Fixed fee per post" }
          ]
        }
      ]
    }
  }
}
```

**WhatsApp Flows:** A newer feature (2024+) allowing multi-step forms inside WhatsApp — shipping addresses, onboarding questionnaires, order forms. Useful for post-collaboration feedback collection. Requires template approval and more complex setup. Covered in detail in a future reference doc.

---

### Media Messages

Send images, documents, audio, or video in session windows or as template headers.

**Image:**
```json
{
  "messaging_product": "whatsapp",
  "to": "15551234567",
  "type": "image",
  "image": {
    "link": "https://cdn.example.com/product-hero.jpg",
    "caption": "Our bestselling EcoPod water filter — this is what you'd be featuring."
  }
}
```

**Document (PDF):**
```json
{
  "messaging_product": "whatsapp",
  "to": "15551234567",
  "type": "document",
  "document": {
    "link": "https://cdn.example.com/media-kit.pdf",
    "caption": "Media Kit — GreenLeaf Brands",
    "filename": "GreenLeaf-Media-Kit-2026.pdf"
  }
}
```

**Media size limits:**
- Image: 5 MB (JPEG, PNG)
- Video: 16 MB (MP4, 3GPP)
- Audio: 16 MB (AAC, MP4, MPEG, AMR, OGG)
- Document: 100 MB (PDF, DOC, XLS, and most standard formats)

**Hosting:** Media must be publicly accessible via HTTPS URL, or uploaded to Meta's media servers first (use the Media Upload API to get a `media_id`, then reference by ID instead of URL). URL-based delivery is simpler; Media ID-based is more reliable for large files.

---

## 5. Template Approval Process

### How Template Approval Works

Templates are submitted to Meta through the API or Business Manager UI and reviewed by Meta's automated system (and occasionally humans). Approval typically takes **minutes to 24 hours** — most templates are reviewed within 2 hours during business hours.

**Template naming:** Lowercase letters, numbers, and underscores only. No spaces, no uppercase. `creator_outreach_v1` is valid. `Creator Outreach V1` is not.

---

### Template Structure

Every template has four component sections (all optional except body):

**Header (optional):**
- `TEXT`: Static or one variable (`{{1}}`)
- `IMAGE`: Requires a sample image URL at submission time
- `VIDEO`: Requires a sample video URL
- `DOCUMENT`: Requires a sample document URL
- `LOCATION`: Shows a map pin

**Body (required):**
- Up to 1024 characters
- Variables use `{{1}}`, `{{2}}`, `{{3}}` format (numbered, starting at 1)
- Must provide sample values for every variable at submission time

**Footer (optional):**
- Up to 60 characters of static text
- No variables
- Typically: "Reply STOP to unsubscribe" or brand tagline

**Buttons (optional, up to 10 total):**
- **Quick Reply buttons** (up to 3): User taps → your webhook receives the button payload
- **Call-to-Action buttons** (up to 2): Phone call or URL. URL buttons can have one dynamic path variable.

---

### Example Template Submission (via API)

```bash
curl -X POST "https://graph.facebook.com/v20.0/YOUR_WABA_ID/message_templates" \
  -H "Authorization: Bearer YOUR_SYSTEM_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "creator_outreach_v1",
    "language": "en_US",
    "category": "MARKETING",
    "components": [
      {
        "type": "HEADER",
        "format": "IMAGE",
        "example": {
          "header_handle": ["https://cdn.example.com/brand-logo.jpg"]
        }
      },
      {
        "type": "BODY",
        "text": "Hi {{1}}! 👋\n\nWe love your content and think you would be a perfect fit for {{2}}.\n\nWe are offering {{3}} commission on all sales you drive. Interested in learning more?",
        "example": {
          "body_text": [["Sarah", "EcoHome by GreenLeaf", "15%"]]
        }
      },
      {
        "type": "FOOTER",
        "text": "Reply STOP to unsubscribe"
      },
      {
        "type": "BUTTONS",
        "buttons": [
          { "type": "QUICK_REPLY", "text": "Yes, tell me more!" },
          { "type": "QUICK_REPLY", "text": "Not interested" }
        ]
      }
    ]
  }'
```

---

### What Gets Templates Rejected and Why

| Rejection Reason | What You Did | Fix |
|---|---|---|
| **Promotional content in utility/auth category** | Template says "50% off!" but category is UTILITY | Change category to MARKETING or remove promotional language |
| **Misleading content** | Template implies urgency or false scarcity ("Only 2 spots left!") | Remove false scarcity claims |
| **Variables in footer** | Used `{{1}}` in footer text | Footer must be static — no variables allowed |
| **Missing sample values** | Submitted without `example` field for variable placeholders | Always include sample values that are realistic |
| **Abusive or threatening language** | N/A — but flagged patterns can trigger this | Review the WhatsApp Commerce Policy |
| **Template name has spaces or uppercase** | `Creator Outreach` | Rename to `creator_outreach` |
| **Duplicate template** | Submitted a template with the same content but different name | Meta detects near-duplicate templates and rejects them |
| **Too many variables** | Body has 8+ variables | Keep to 5 or fewer variables per component |

**Re-submission pattern:**
When a template is rejected, Meta provides a rejection reason code. Review the reason, edit the template, and re-submit. You cannot edit a submitted template — you must create a new one (with a different name or incremented version: `creator_outreach_v2`).

**Template categories and their rules:**
- `MARKETING`: Promotional content, offers, announcements. Most creator outreach falls here. Highest Meta per-conversation fee.
- `UTILITY`: Transactional notifications tied to an existing relationship (order confirmations, shipping updates). Lower fee. Do not abuse this category with promotional content — Meta will reject or later flag your WABA.
- `AUTHENTICATION`: OTP/verification messages. Lowest fee. Strict format requirements (must use Meta's standard OTP template format).

---

## 6. Opt-In Compliance

### The Non-Negotiable Rule

**You cannot message anyone on WhatsApp who has not explicitly opted in to receive messages from your business.** This is both a Meta policy requirement and a legal requirement in most jurisdictions. Violating this is the #1 cause of phone number quality rating degradation and bans.

Opt-in must be:
- **Active:** The person took a deliberate action to opt in (checked a box, sent a keyword, filled a form). Pre-ticked checkboxes do not count.
- **Informed:** They were told specifically they would receive WhatsApp messages from your business.
- **Recorded:** You have a timestamp, IP, source, and the exact consent language they agreed to.

---

### Legal Requirements by Region

**GDPR (EU, UK, EEA):**
- Opt-in is a "legitimate interest" claim only if very narrowly scoped. For marketing messages, you need **explicit consent**.
- Consent records must include: who consented, when, what they consented to, what language was shown, and the source (URL, form ID, etc.)
- Right to withdraw consent must be easy and actioned within 72 hours
- Data retention periods must be defined and enforced
- Do not rely on "soft opt-in" (buying from you once) to justify WhatsApp marketing messages — this is high-risk in the EU

**TCPA (USA):**
- Written consent required for marketing messages sent to mobile numbers
- "Written" includes digital consent (web form, SMS reply, app checkbox)
- Must disclose: frequency of messages, that standard message rates may apply, and how to opt out
- Opt-out (STOP) must be honored immediately
- The FCC's 2024 TCPA updates tightened consent requirements significantly — one-to-one consent is now required (a consent form that covers "our partners" is insufficient)

**LGPD (Brazil):**
- Similar to GDPR in structure; explicit consent required for marketing communications
- Consent must be specific to the purpose (WhatsApp marketing, not just "communications")

**Other markets:** Always default to explicit opt-in. It protects you legally and produces higher-quality contacts who actually want to hear from you.

---

### How to Collect Opt-In Consent

**Method 1: WhatsApp Click-to-Chat link on website**
A contact visits your landing page and clicks "Chat with us on WhatsApp." They initiate the conversation themselves — this is user-initiated, so you don't need separate opt-in for session messages. But to send template messages later, capture their explicit consent within that first session:

```
Bot: "Thanks for reaching out! Would you like to receive updates about our new products and exclusive offers on WhatsApp? Reply YES to subscribe or NO to just chat for now."
```

**Method 2: Web form with explicit WhatsApp consent checkbox**
```html
<label>
  <input type="checkbox" name="whatsapp_opt_in" required>
  I agree to receive WhatsApp messages from GreenLeaf Brands including product updates 
  and exclusive offers. I can unsubscribe at any time by replying STOP.
</label>
```

**Method 3: SMS or email → WhatsApp enrollment**
Send an existing contact an opt-in invitation via SMS or email. They reply YES or click a link. The link opens WhatsApp → they send a message → opt-in is captured.

**Method 4: Creator outreach specific — Instagram DM first**
For influencer outreach, it's common to first DM via Instagram, get their agreement to continue the conversation on WhatsApp, and then have them message you first on WhatsApp. This means they initiated the WhatsApp contact — strong opt-in signal.

---

### Storing Opt-In Consent in Supabase

See Section 10 for full schema. The critical fields for consent:

```sql
-- In the whatsapp_contacts table
opt_in_status      text CHECK (opt_in_status IN ('pending', 'opted_in', 'opted_out', 'never_opted_in')),
opt_in_timestamp   timestamptz,
opt_in_source      text,        -- 'website_form', 'whatsapp_clicklink', 'instagram_dm', etc.
opt_in_language    text,        -- exact consent text shown to user, for legal records
opt_out_timestamp  timestamptz,
opt_out_source     text,        -- 'reply_stop', 'manual_removal', 'gdpr_request', etc.
```

---

### Opt-Out / STOP Handling

When a contact replies STOP (or any unsubscribe keyword — NO, UNSUBSCRIBE, CANCEL), you must:

1. **Immediately stop sending them messages** — within the same workflow execution
2. **Update their `opt_in_status` to `opted_out`** in Supabase
3. **Send a confirmation** (within the 24-hour session window): "You've been unsubscribed and won't receive further messages from us. Reply START if you'd like to re-subscribe."
4. **Log the opt-out** with timestamp and source

The STOP keyword handling should be the first routing check in your webhook flow — before any other logic runs.

---

## 7. Webhook Setup

### Endpoint Configuration

Register your webhook URL in Meta for Developers → Your App → WhatsApp → Configuration:

- **Callback URL:** `https://your-domain.com/webhooks/whatsapp`
- **Verify Token:** Any random string you define (used for the GET verification challenge)
- **Webhook Fields:** Subscribe to `messages` at minimum; also subscribe to `message_status` for delivery tracking

Your endpoint must:
- Return HTTP 200 within 20 seconds for every POST (even if you process asynchronously)
- Handle the GET verification challenge (see Section 3)
- Process events idempotently (Meta will retry failed deliveries)

---

### Event Types and Payload Structure

**Inbound message received:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WABA_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15551234567",
          "phone_number_id": "PHONE_NUMBER_ID"
        },
        "contacts": [{
          "profile": { "name": "Sarah Johnson" },
          "wa_id": "15559876543"
        }],
        "messages": [{
          "from": "15559876543",
          "id": "wamid.HBgLMTU1NTk4NzY1NDMVAgASGBQyMEMxNjlENzk5MzBEM0YxQkEzOAA=",
          "timestamp": "1715203456",
          "type": "text",
          "text": { "body": "Yes, I'm interested!" }
        }]
      },
      "field": "messages"
    }]
  }]
}
```

**Button quick reply (template button tapped):**
```json
{
  "messages": [{
    "from": "15559876543",
    "id": "wamid.xxx",
    "timestamp": "1715203500",
    "type": "interactive",
    "interactive": {
      "type": "button_reply",
      "button_reply": {
        "id": "INTERESTED_YES",
        "title": "Yes, tell me more!"
      }
    }
  }]
}
```

**List reply:**
```json
{
  "interactive": {
    "type": "list_reply",
    "list_reply": {
      "id": "MODEL_COMMISSION",
      "title": "Commission (15%)",
      "description": "Earn per sale you drive"
    }
  }
}
```

**Delivery status update:**
```json
{
  "statuses": [{
    "id": "wamid.xxx",
    "status": "delivered",  // sent | delivered | read | failed
    "timestamp": "1715203460",
    "recipient_id": "15559876543",
    "conversation": {
      "id": "CONVERSATION_ID",
      "origin": { "type": "marketing" }
    },
    "pricing": {
      "billable": true,
      "pricing_model": "CBP",
      "category": "marketing"
    }
  }]
}
```

---

### Idempotency Handling

Meta may deliver the same webhook event more than once (network retries, processing failures). Your handler must be idempotent.

**Pattern: dedup on message ID:**

```sql
-- In message_log table
message_wamid text UNIQUE  -- the wamid from Meta

-- In your handler:
INSERT INTO message_log (message_wamid, ...)
VALUES ('wamid.xxx', ...)
ON CONFLICT (message_wamid) DO NOTHING;
```

If the INSERT does nothing, you've already processed this message. Return 200 without re-triggering downstream logic.

**Pattern: status update deduplication:**

```sql
UPDATE message_log
SET delivery_status = 'delivered', delivered_at = now()
WHERE message_wamid = 'wamid.xxx'
  AND delivery_status != 'read';  -- don't downgrade a 'read' status back to 'delivered'
```

---

## 8. Rate Limits & Messaging Tiers

### Understanding Messaging Tiers

WhatsApp API does not have a flat rate limit. Instead, you start in a "tier" that caps how many unique users you can message in a rolling 24-hour period. Tiers apply to **business-initiated conversations** (template messages). User-initiated conversations (replies) are not tier-limited.

| Tier | Business-Initiated Unique Recipients / 24h |
|---|---|
| Tier 1 | 1,000 |
| Tier 2 | 10,000 |
| Tier 3 | 100,000 |
| Tier 4 | Unlimited |

**Starting tier:** All new phone numbers start at Tier 1 (1,000/day).

**Automatic tier progression:** Meta automatically promotes your number to the next tier when you meet these conditions in the preceding 7 days:
- Your phone number's quality rating is "High" or "Medium"
- You initiated conversations with a number of unique users equal to or greater than the current tier limit (within 7 days)

In practice: if you consistently send ~1,000 messages/day for a week with high quality, Meta promotes you to Tier 2. Then you scale to ~10,000/day for another week, and so on.

**Quality rating:** Every phone number has a quality rating (High, Medium, Low) based on how users interact with your messages. Spam reports, blocks, and "Stop" replies degrade quality. A "Low" quality rating can result in:
- Tier demotion (from 10,000 back to 1,000)
- Phone number flagging (warning)
- Phone number ban

---

### Per-Second Rate Limits

Beyond tier limits, Meta also enforces a per-second rate limit on API calls:
- **80 messages per second** per phone number for the Meta Cloud API

For most Amazon brand operations this is not a constraint. Even at Tier 4, 80 msg/sec = 6.9 million messages/day, far beyond any typical influencer CRM operation.

**n8n consideration:** If you're bulk-sending in a loop node, add a 50ms `Wait` node between each send to stay comfortably under the limit. For batches larger than 500, process in chunks of 200 with a 3-second pause between chunks.

---

### Business-Initiated vs. User-Initiated Windows

| Window Type | Opens When | Expires | Cost |
|---|---|---|---|
| **Marketing** | You send a marketing template | 24 hours | Marketing conversation fee |
| **Utility** | You send a utility template | 24 hours | Utility conversation fee |
| **Authentication** | You send an auth template | 24 hours | Authentication fee |
| **Service** | User sends you any message | 24 hours from their last message | Free (as of March 2024) |

**Important 2024 change:** Meta made **service conversations free** in March 2024. This means: every inbound message from a user opens a free 24-hour window. Responding within that window costs you nothing in conversation fees. Only template messages that open a new conversation cost money.

---

## 9. n8n Integration

### Setting Up the WhatsApp Connection

**Option A: HTTP Request node (Meta Cloud API direct)**
This is the syncflow default. No special node needed — just configure an HTTP Request node with your token credential.

```
Method: POST
URL: https://graph.facebook.com/v20.0/{{$env.WHATSAPP_PHONE_NUMBER_ID}}/messages
Authentication: Header Auth (your Meta token credential)
Content-Type: application/json
Body: (your message JSON)
```

Store `WHATSAPP_PHONE_NUMBER_ID` as an n8n environment variable. This makes your workflows portable across brands (each brand has its own Phone Number ID).

**Option B: WhatsApp Business node (via 360dialog BSP)**
If using 360dialog, n8n has a built-in WhatsApp Business node. The credential requires your 360dialog API key and WABA ID. The node handles the API format differences internally.

---

### Webhook Trigger Node (Receiving Messages)

Create a webhook workflow to handle inbound WhatsApp events:

1. **Webhook node** → Method: POST → Path: `/webhooks/whatsapp`
   - Enable "Raw Body" — required for signature verification
   - Return immediate 200 at this node (Meta requires fast response)

2. **Respond to Webhook node** → immediately after the Webhook node → Status: 200 → Response body: `{"status": "ok"}`
   - This forks processing: Meta gets its 200, your workflow continues async

3. **Code node** → Verify HMAC signature:
```javascript
const crypto = require('crypto');
const rawBody = $input.first().binary?.data 
  ? Buffer.from($input.first().binary.data, 'base64').toString()
  : JSON.stringify($input.first().json);

const signature = $input.first().headers['x-hub-signature-256'];
const appSecret = $env.META_APP_SECRET;

const expected = 'sha256=' + crypto
  .createHmac('sha256', appSecret)
  .update(rawBody)
  .digest('hex');

if (signature !== expected) {
  throw new Error('Invalid webhook signature — possible spoofed request');
}

// Extract the message
const entry = $input.first().json.entry?.[0];
const changes = entry?.changes?.[0];
const value = changes?.value;

const messages = value?.messages || [];
const statuses = value?.statuses || [];

return [{ json: { messages, statuses, value } }];
```

4. **IF node** → route by whether `messages` array has items vs. `statuses` array

5. **Switch node** → route messages by type: `text`, `interactive`, `image`, `audio`

---

### Routing by Message Content

For keyword-based routing on inbound text messages:

```javascript
// Code node: extract and classify inbound message
const message = $input.first().json.messages[0];
const from = message.from;  // phone number with country code, no +
const messageType = message.type;
let messageText = '';
let buttonPayload = '';

if (messageType === 'text') {
  messageText = message.text.body.trim().toUpperCase();
} else if (messageType === 'interactive') {
  if (message.interactive.type === 'button_reply') {
    buttonPayload = message.interactive.button_reply.id;
  } else if (message.interactive.type === 'list_reply') {
    buttonPayload = message.interactive.list_reply.id;
  }
}

// Classify intent
let intent = 'UNKNOWN';
if (['STOP', 'UNSUBSCRIBE', 'CANCEL', 'NO', 'OPT OUT'].includes(messageText)) {
  intent = 'OPT_OUT';
} else if (['START', 'SUBSCRIBE', 'YES', 'RESTART'].includes(messageText)) {
  intent = 'OPT_IN';
} else if (['HELP', 'INFO'].includes(messageText)) {
  intent = 'HELP';
} else if (buttonPayload.startsWith('INTERESTED')) {
  intent = 'INTERESTED';
} else if (buttonPayload === 'NOT_INTERESTED') {
  intent = 'NOT_INTERESTED';
} else if (messageText.length > 0) {
  intent = 'FREE_TEXT';
}

return [{ json: { from, messageType, messageText, buttonPayload, intent, rawMessage: message } }];
```

Then use a **Switch node** on the `intent` field to route to sub-workflows:
- `OPT_OUT` → unsubscribe flow
- `INTERESTED` → engagement flow
- `NOT_INTERESTED` → mark contact, stop sequence
- `FREE_TEXT` → AI response or human handoff

---

### Building Response Flows

**Sending a template message via HTTP Request:**

```json
{
  "method": "POST",
  "url": "=https://graph.facebook.com/v20.0/{{$env.WHATSAPP_PHONE_NUMBER_ID}}/messages",
  "authentication": "headerAuth",
  "jsonBody": {
    "messaging_product": "whatsapp",
    "to": "={{$json.from}}",
    "type": "template",
    "template": {
      "name": "creator_followup_v1",
      "language": { "code": "en_US" },
      "components": [
        {
          "type": "body",
          "parameters": [
            { "type": "text", "text": "={{$json.contactName}}" }
          ]
        }
      ]
    }
  }
}
```

**Error handling:** Wrap HTTP Request nodes in Try/Catch (Error Trigger workflow) or use the "Continue on Fail" option + check `$json.error` in a subsequent IF node. Log failures to Supabase's `message_log` table with `delivery_status = 'failed'` and the error code.

---

## 10. Supabase Integration & Schema

### Full Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- BRANDS TABLE (reference)
-- ============================================================
CREATE TABLE brands (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text NOT NULL,
  waba_id     text,
  phone_number_id text,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- WHATSAPP CONTACTS
-- ============================================================
CREATE TABLE whatsapp_contacts (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id          uuid REFERENCES brands(id) ON DELETE CASCADE,
  
  -- Identity
  phone             text NOT NULL,          -- E.164 format: 15551234567 (no +)
  wa_id             text,                   -- WhatsApp internal ID (same as phone, usually)
  display_name      text,                   -- Name from WhatsApp profile
  full_name         text,                   -- Name from your records
  email             text,
  instagram_handle  text,
  
  -- Creator/Influencer classification
  contact_type      text DEFAULT 'creator' CHECK (contact_type IN ('creator', 'customer', 'vip', 'other')),
  niche             text[],                 -- ['home', 'eco', 'kitchen']
  follower_count    int,
  avg_engagement_rate numeric(5,2),
  platforms         text[],                 -- ['instagram', 'tiktok', 'youtube']
  
  -- Opt-in / Compliance
  opt_in_status     text DEFAULT 'pending' CHECK (opt_in_status IN ('pending', 'opted_in', 'opted_out', 'never_opted_in')),
  opt_in_timestamp  timestamptz,
  opt_in_source     text,                   -- 'website_form', 'instagram_dm', 'whatsapp_init'
  opt_in_language   text,                   -- exact consent copy shown to user
  opt_out_timestamp timestamptz,
  opt_out_source    text,
  
  -- Messaging tier / state
  session_expires_at timestamptz,           -- when the 24h free window closes
  last_inbound_at    timestamptz,
  last_outbound_at   timestamptz,
  
  -- CRM Status
  crm_status        text DEFAULT 'prospect' CHECK (crm_status IN (
    'prospect', 'contacted', 'responded', 'negotiating', 
    'active_collab', 'completed', 'rejected', 'unresponsive', 'blocked'
  )),
  crm_notes         text,
  assigned_to       text,                   -- ClickUp user handle or email
  clickup_task_id   text,
  
  -- Metadata
  tags              text[],
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  
  UNIQUE (brand_id, phone)
);

CREATE INDEX idx_whatsapp_contacts_brand ON whatsapp_contacts(brand_id);
CREATE INDEX idx_whatsapp_contacts_status ON whatsapp_contacts(opt_in_status, crm_status);
CREATE INDEX idx_whatsapp_contacts_session ON whatsapp_contacts(session_expires_at);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE TABLE whatsapp_conversations (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id             uuid REFERENCES brands(id),
  contact_id           uuid REFERENCES whatsapp_contacts(id),
  meta_conversation_id text,               -- from Meta's status webhook
  
  -- Type and billing
  conversation_type    text CHECK (conversation_type IN ('marketing', 'utility', 'authentication', 'service')),
  opened_at            timestamptz DEFAULT now(),
  closes_at            timestamptz,        -- opened_at + 24h
  is_billable          boolean DEFAULT true,
  billed_at            timestamptz,
  
  -- State
  status               text DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  closed_at            timestamptz,
  
  created_at           timestamptz DEFAULT now()
);

CREATE INDEX idx_conversations_contact ON whatsapp_conversations(contact_id);
CREATE INDEX idx_conversations_status ON whatsapp_conversations(status, closes_at);

-- ============================================================
-- MESSAGE LOG
-- ============================================================
CREATE TABLE whatsapp_message_log (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id          uuid REFERENCES brands(id),
  contact_id        uuid REFERENCES whatsapp_contacts(id),
  conversation_id   uuid REFERENCES whatsapp_conversations(id),
  
  -- Message identity
  message_wamid     text UNIQUE,           -- Meta's wamid — use for dedup
  direction         text CHECK (direction IN ('inbound', 'outbound')),
  
  -- Content
  message_type      text,                  -- text, template, interactive, image, document, etc.
  template_name     text,                  -- if type = template
  body_text         text,                  -- extracted text content for searchability
  raw_payload       jsonb,                 -- full Meta payload stored for debugging
  
  -- Delivery tracking
  delivery_status   text DEFAULT 'pending' CHECK (delivery_status IN (
    'pending', 'sent', 'delivered', 'read', 'failed'
  )),
  sent_at           timestamptz,
  delivered_at      timestamptz,
  read_at           timestamptz,
  failed_at         timestamptz,
  error_code        text,
  error_message     text,
  
  -- Sequence tracking
  sequence_id       text,                  -- which outreach sequence this message belongs to
  sequence_step     int,                   -- step number within the sequence
  
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_message_log_contact ON whatsapp_message_log(contact_id, created_at DESC);
CREATE INDEX idx_message_log_wamid ON whatsapp_message_log(message_wamid);
CREATE INDEX idx_message_log_status ON whatsapp_message_log(delivery_status, sent_at);
CREATE INDEX idx_message_log_sequence ON whatsapp_message_log(sequence_id, sequence_step);

-- ============================================================
-- OUTREACH SEQUENCES (campaign definition)
-- ============================================================
CREATE TABLE whatsapp_sequences (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id     uuid REFERENCES brands(id),
  name         text NOT NULL,
  description  text,
  is_active    boolean DEFAULT true,
  steps        jsonb NOT NULL,             -- array of step definitions (see below)
  created_at   timestamptz DEFAULT now()
);

-- steps JSONB structure:
-- [
--   { "step": 1, "delay_hours": 0, "template_name": "creator_outreach_v1", "type": "template" },
--   { "step": 2, "delay_hours": 48, "template_name": "creator_followup_v1", "type": "template" },
--   { "step": 3, "delay_hours": 120, "template_name": "creator_lastchance_v1", "type": "template" }
-- ]

-- ============================================================
-- CONTACT SEQUENCE ENROLLMENT
-- ============================================================
CREATE TABLE whatsapp_contact_sequences (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id      uuid REFERENCES whatsapp_contacts(id),
  sequence_id     uuid REFERENCES whatsapp_sequences(id),
  brand_id        uuid REFERENCES brands(id),
  
  enrolled_at     timestamptz DEFAULT now(),
  current_step    int DEFAULT 1,
  next_step_at    timestamptz,
  
  status          text DEFAULT 'active' CHECK (status IN (
    'active', 'paused', 'completed', 'opted_out', 'responded'
  )),
  completed_at    timestamptz,
  exit_reason     text,
  
  UNIQUE (contact_id, sequence_id)
);

CREATE INDEX idx_enrollment_next_step ON whatsapp_contact_sequences(status, next_step_at)
  WHERE status = 'active';

-- ============================================================
-- CONSENT AUDIT LOG (legal compliance)
-- ============================================================
CREATE TABLE whatsapp_consent_log (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id     uuid REFERENCES whatsapp_contacts(id),
  brand_id       uuid REFERENCES brands(id),
  event_type     text CHECK (event_type IN ('opt_in', 'opt_out', 'data_deletion', 'consent_update')),
  event_source   text,                     -- where the event came from
  consent_text   text,                     -- exact language presented
  ip_address     text,
  user_agent     text,
  created_at     timestamptz DEFAULT now()
);
```

---

### Key n8n → Supabase Patterns

**Upsert a contact on inbound message:**
```javascript
// In n8n Supabase node (or HTTP Request to Supabase REST API)
// Method: POST to /rest/v1/whatsapp_contacts
// Headers: Prefer: resolution=merge-duplicates

{
  "brand_id": "{{brandId}}",
  "phone": "{{from}}",
  "wa_id": "{{from}}",
  "display_name": "{{contactName}}",
  "last_inbound_at": "{{now}}",
  "session_expires_at": "{{now + 24h}}"
}
```

**Log a sent message:**
```sql
INSERT INTO whatsapp_message_log 
  (brand_id, contact_id, message_wamid, direction, message_type, template_name, body_text, delivery_status, sent_at, sequence_id, sequence_step)
VALUES 
  ($1, $2, $3, 'outbound', 'template', $4, $5, 'sent', now(), $6, $7)
ON CONFLICT (message_wamid) DO NOTHING;
```

---

## 11. Creator/Influencer Outreach Workflow End-to-End

### Overview

The Creator Outreach workflow is a multi-step automated sequence that takes a creator from cold contact through to active collaboration, with status tracked in Supabase and tasks managed in ClickUp.

```
[Contact added to Supabase] 
         ↓
[Step 1: Initial outreach template] → [Wait for reply or 48h]
         ↓ (no reply)
[Step 2: Follow-up template] → [Wait for reply or 72h]
         ↓ (no reply)
[Step 3: Last chance template] → [Wait for reply or 72h]
         ↓ (no reply)
[Mark as 'unresponsive' → exit sequence]
         
         ↓ (replied at any step)
[Route by response intent]
         ↓
[INTERESTED] → [Human-in-the-loop: create ClickUp task + send negotiation message]
[NOT_INTERESTED] → [Mark 'rejected' → exit sequence]
[OPT_OUT] → [Unsubscribe flow → exit sequence]
[FREE_TEXT] → [AI response or human handoff]
```

---

### Step 1: Initial Contact Template

**Template name:** `creator_outreach_v1`  
**Category:** MARKETING  
**Trigger:** Contact enrolled in sequence with `current_step = 1`

Template body:
```
Hi {{1}}! 👋

We noticed your amazing content in the {{2}} space and think you'd be a perfect fit to partner with {{3}}.

We're looking for authentic creators to feature our products and we'd love to chat about what a collaboration could look like.

Interested? Hit the button below! 🙌

Reply STOP at any time to unsubscribe.
```

Variables: `[creator_name, niche, brand_name]`  
Buttons: "Yes, tell me more!" / "Not interested"

**n8n send flow:**
1. Supabase node → query `whatsapp_contact_sequences` where `status = 'active'` AND `next_step_at <= now()` AND `current_step = 1`
2. HTTP Request → send template message for each contact
3. Supabase node → log to `whatsapp_message_log`
4. Supabase node → update `whatsapp_contact_sequences` SET `current_step = 2`, `next_step_at = now() + interval '48 hours'`
5. Supabase node → update `whatsapp_contacts` SET `crm_status = 'contacted'`, `last_outbound_at = now()`

---

### Step 2: Follow-Up Template

**Template name:** `creator_followup_v1`  
**Category:** MARKETING  
**Trigger:** `current_step = 2` AND `next_step_at <= now()` AND contact has NOT replied

Template body:
```
Hey {{1}}! Just circling back 👋

We reached out a couple of days ago about a potential partnership with {{2}}.

We'd really love to have you involved — we think our products would resonate perfectly with your audience.

Would you be open to a quick chat?
```

Variables: `[creator_name, brand_name]`  
Buttons: "Yes, let's talk!" / "No thanks"

**Note:** Check whether the contact has replied (inbound message logged) before sending this step. Query `whatsapp_message_log WHERE contact_id = $1 AND direction = 'inbound' AND created_at > $enrollment_date`. If they've replied and the `crm_status` has changed from `contacted`, skip this step.

---

### Step 3: Last Chance Template

**Template name:** `creator_lastchance_v1`  
**Category:** MARKETING  
**Trigger:** `current_step = 3` AND `next_step_at <= now()` AND no reply

Template body:
```
Hi {{1}} — last message from us, we promise! 😊

We'd love to partner with you on {{2}}, but we totally understand if it's not the right fit.

If you ever want to explore a collaboration in the future, just reach out — our door is always open.

Have an amazing day! 🌟
```

Variables: `[creator_name, brand_name]`  
No buttons — this is a soft close, no pressure.

---

### Post-Reply: Engagement Flow

When a creator replies (any step), the webhook workflow fires:

1. **Identify contact** from phone number → lookup in Supabase
2. **Classify intent** (see Section 9 routing code)
3. **Route:**

**INTERESTED path:**
```
→ Update whatsapp_contacts SET crm_status = 'responded'
→ Update whatsapp_contact_sequences SET status = 'responded'
→ Create ClickUp task "Creator: [Name] — Interested" (assign to brand manager)
→ Send session message (within 24h window, no template needed):
   "That's great to hear, {{name}}! I'll have someone from our team 
    reach out within 24 hours with all the details. 
    Can I ask — roughly what's your current monthly reach across platforms?"
```

**NOT_INTERESTED path:**
```
→ Update whatsapp_contacts SET crm_status = 'rejected'
→ Update whatsapp_contact_sequences SET status = 'completed', exit_reason = 'not_interested'
→ Log to consent_log
→ Send: "No worries at all! We appreciate your time and hope our paths cross again. 
         Have a great day! 🙌"
```

**OPT_OUT path (STOP keyword):**
```
→ Update whatsapp_contacts SET opt_in_status = 'opted_out', opt_out_timestamp = now()
→ Update whatsapp_contact_sequences SET status = 'opted_out'
→ Log to whatsapp_consent_log (event_type = 'opt_out')
→ Send: "You've been unsubscribed and won't receive further messages from us. 
         Reply START if you'd like to re-subscribe."
→ STOP all further processing for this contact
```

---

### Post-Collaboration: Review Request

After an active collaboration completes (triggered manually or by ClickUp task status change):

**Template name:** `creator_review_request_v1`  
**Category:** UTILITY  
**Trigger:** ClickUp task moves to "Completed" → webhook → n8n

Template body:
```
Hi {{1}}! 🌟

Thank you so much for the amazing content you created for {{2}}. The results have been fantastic!

We'd love to get your quick feedback on the collaboration — it only takes 2 minutes and helps us improve for our future creator partnerships.

Would you mind sharing your thoughts?
```

Variables: `[creator_name, brand_name]`  
Buttons: "Yes, give feedback!" / "Maybe later"

---

## 12. Conversation Routing & Inbound Handling

### Keyword → Action Map

| Inbound Keyword(s) | Intent Classified | Action |
|---|---|---|
| STOP, UNSUBSCRIBE, CANCEL, OPT OUT, QUIT | `OPT_OUT` | Unsubscribe, log, confirm message |
| START, SUBSCRIBE, RESTART, YES (as first message) | `OPT_IN` | Re-subscribe, confirm |
| HELP, INFO | `HELP` | Send info message with contact details |
| YES (in context of outreach) | `INTERESTED` | Engagement flow |
| NO, NOT INTERESTED | `NOT_INTERESTED` | Close sequence, mark rejected |
| Any other text | `FREE_TEXT` | AI response or human handoff |

### Human Handoff Pattern

For complex free-text replies that require a human response, the syncflow system uses a ClickUp task + Slack notification pattern:

```javascript
// In n8n when intent = FREE_TEXT and AI confidence is low

// 1. Create ClickUp task
const task = await createClickUpTask({
  name: `WhatsApp Reply: ${contactName} — Needs Human`,
  description: `Contact: ${phone}\nMessage: "${messageText}"\n\nLink to conversation history in Supabase.`,
  list_id: CREATOR_OUTREACH_LIST_ID,
  priority: 2  // high
});

// 2. Update contact
await supabase
  .from('whatsapp_contacts')
  .update({ crm_status: 'negotiating', clickup_task_id: task.id })
  .eq('id', contactId);

// 3. Pause sequence
await supabase
  .from('whatsapp_contact_sequences')
  .update({ status: 'paused' })
  .eq('contact_id', contactId);

// 4. Auto-acknowledge to the creator (optional, within session window)
await sendWhatsAppMessage(phone, {
  type: 'text',
  text: { body: "Thanks for your message! A member of our team will get back to you shortly. 😊" }
});
```

### AI-Powered Response (Claude Integration)

For common free-text scenarios, you can route through Claude to generate a contextual reply:

```javascript
// n8n: AI Agent node with Anthropic Claude
// System prompt:
`You are a friendly brand partnership coordinator for {{brandName}}, an Amazon brand in the {{niche}} space.
You're in a WhatsApp conversation with a creator/influencer named {{creatorName}}.

Context about this creator:
- Niche: {{niche}}
- Follower count: {{followerCount}}
- Current collaboration stage: {{crmStatus}}
- Recent conversation summary: {{conversationSummary}}

Reply to their message in a warm, professional, concise way (under 150 words).
Do not make specific commitments about fees or timelines — those require human approval.
If they ask about commission rates, say "typically 10-20% depending on the collaboration scope."
If they ask something you cannot answer confidently, say your team will follow up.`

// User message:
`Creator's message: "${messageText}"`
```

---

## 13. Cost Structure

### Meta's Conversation-Based Pricing (CBP) Model

As of 2024/2025, Meta charges per **conversation** (not per message). A conversation is a 24-hour window that opens when the first message in that session type is sent.

**Key insight:** You pay once per 24-hour window per contact per category. If you send 10 marketing messages to the same person in a 24-hour period, you pay one marketing conversation fee — not 10 message fees. This rewards high-engagement conversations.

---

### 2025/2026 Pricing by Category (US market)

| Category | Fee Per Conversation (USD) | When It Opens |
|---|---|---|
| Marketing | $0.025 | When you send a marketing template |
| Utility | $0.015 | When you send a utility template |
| Authentication | $0.0135 | When you send an auth template |
| Service | **Free** | When a user sends you a message |

**Note:** Pricing varies significantly by country. India and Brazil have lower rates (~$0.005–0.010 for marketing). Meta publishes country-specific pricing at [business.whatsapp.com/products/platform-pricing](https://business.whatsapp.com/products/platform-pricing).

---

### Volume Cost Examples

**Scenario 1: Creator Outreach Campaign — 1,000 contacts**
- 1,000 initial outreach messages × $0.025 = **$25.00**
- 40% no reply → 400 follow-up messages × $0.025 = **$10.00**
- 20% no reply → 200 last chance messages × $0.025 = **$5.00**
- Total template cost: **$40.00**
- 200 creators reply → 200 inbound sessions = **Free**
- Estimated total: **$40–50/month** for a full outreach campaign

**Scenario 2: Monthly Newsletter to 5,000 opted-in customers**
- 5,000 × $0.025 = **$125.00/month**
- If 30% reply to the newsletter → those follow-up conversations are free (service window)

**Scenario 3: Order confirmation + shipping update (utility)**
- 10,000 orders × 2 utility messages (order confirm + shipped) = 1 conversation each (both within 24h)
- 10,000 × $0.015 = **$150.00/month**

**BSP markup example (360dialog):**
360dialog typically charges ~20% above Meta's conversation fees plus a flat monthly fee ($5–15). So that $125 newsletter becomes ~$155 through 360dialog.

---

## 14. BSP Comparison Table

| Feature | Meta Cloud API (Direct) | 360dialog | WATI | Twilio | MessageBird |
|---|---|---|---|---|---|
| **Monthly base fee** | Free (Meta fees only) | $5–15 | $40–229 | $0 (usage only) | Custom enterprise |
| **Per-conversation markup** | None | ~10–20% | ~30–50% | ~50–100% | Custom |
| **Setup complexity** | High (DIY) | Medium | Low | Medium | High |
| **n8n native node** | ❌ (HTTP Request) | ✅ | ❌ | ✅ (via Twilio node) | ❌ |
| **Developer documentation** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Human inbox UI** | ❌ | Basic | ✅ Excellent | ❌ | ✅ |
| **Template management UI** | Meta Business Mgr | ✅ | ✅ | Meta Business Mgr | ✅ |
| **API proximity to Meta** | Native | Very close | Abstracted | Abstracted | Abstracted |
| **New feature availability** | Day 1 | Days-weeks | Weeks-months | Weeks | Weeks-months |
| **Best for** | Technical, cost-sensitive | Devs who want some abstraction | Non-technical teams needing inbox | Existing Twilio customers | Enterprise multichannel |
| **Avoid when** | You need a human inbox | (Generally good) | You're automating at scale | You're cost-sensitive | You're a startup |

---

## 15. Common Pitfalls

### Phone Number Bans

A phone number can be banned (permanently disabled) by Meta. Bans happen when:

1. **High block/spam report rate:** Users block your number or report your messages as spam. Meta's threshold is opaque but quality rating drops from High → Medium → Low → flagged → banned. Even a 1% spam report rate on a large send can trigger a flag.

2. **Sending to non-opted-in contacts:** If you buy a list and blast it, recipients who have no idea who you are will report spam. This is the fastest path to a ban.

3. **Template policy violations:** Sending prohibited content (phishing, illegal content, misleading claims) via templates — even if approved — can result in a ban after content review.

4. **Messaging too fast too soon:** A new number jumping from 0 to 900 messages/day without warming up looks suspicious.

**Number quality rating:** Check it regularly in Meta Business Manager → WhatsApp Accounts → Phone Numbers. If it drops to Medium, investigate immediately. Don't wait for Low.

**Recovery:** There is no appeal process for banned numbers. The number cannot be re-registered for WhatsApp for 30 days minimum. Prevention is everything.

**Warming strategy for new numbers:**
- Days 1–3: 100–200 messages/day to high-engagement contacts
- Days 4–7: 300–500 messages/day
- Days 8–14: 500–900 messages/day
- After Day 14: You should be at Tier 1 limit (1,000) with quality established
- Meta will auto-promote to Tier 2 when conditions are met

---

### Template Policy Violations

Templates that pass initial approval can still be flagged later during a content review. Causes:

- **Variable bait-and-switch:** Template was approved with benign sample variables but is deployed with promotional/misleading content. Meta's systems can detect this.
- **Approved template, prohibited use case:** An "order confirmation" template being used to send promotional offers.
- **STOP instruction circumvented:** Not honoring opt-out requests. Meta tracks this.
- **Mixing utility and marketing content:** A shipping update that says "Also, use code SAVE20 for 20% off your next order" — this converts a utility conversation into a marketing one without the billing or policy compliance.

---

### Spam Detection

Meta uses a combination of:
- Block/report signals from recipients
- Message velocity (sudden spikes)
- Template variable diversity analysis (sending the same template body to thousands of contacts with near-identical variables looks spammy)
- Engagement rate (if nobody ever replies or clicks, that's a signal)

**Mitigation:**
- Personalize messages meaningfully — variable values should differ significantly across recipients
- Segment lists and don't send the same template to your entire contact list on day 1
- Monitor reply rates — low reply rates on creator outreach suggest the content is off, not just a technical problem
- Include easy opt-out in every marketing message

---

### Common API Errors and What They Mean

| Error Code | Meaning | Fix |
|---|---|---|
| `131026` | Message Undeliverable — user is not on WhatsApp or has blocked you | Check number format; remove undeliverable contacts |
| `131047` | Re-engagement message — session window expired | Use a template instead of free-form message |
| `132001` | Template doesn't exist or is not approved | Check template name spelling and approval status |
| `132015` | Template not approved for the target country | Submit a country-specific template |
| `133010` | Phone number not registered on WhatsApp | Verify phone number is active on WhatsApp |
| `368` | WABA temporarily restricted | Check Business Manager for notices; quality rating may be Low |

---

## 16. GDPR & Data Handling

### What to Store (and What Not To)

**Store:** Phone number (required), opt-in timestamp, opt-in source, consent language, opt-out timestamp, message log (for 90 days), delivery status.

**Do not store unnecessarily:** Full message body text for inbound personal messages beyond what's needed for routing/context. A conversation summary is better than a verbatim transcript from a privacy standpoint.

**Encryption:** Encrypt at rest any field that constitutes personal data beyond what's functionally necessary. At minimum: phone number, full name, email. Use Supabase's column-level encryption via pgcrypto, or better, Supabase Vault.

```sql
-- Example: encrypt sensitive fields using pgcrypto
INSERT INTO whatsapp_contacts (phone_encrypted, ...)
VALUES (pgp_sym_encrypt('15551234567', current_setting('app.encryption_key')), ...);

-- Decrypting:
SELECT pgp_sym_decrypt(phone_encrypted::bytea, current_setting('app.encryption_key')) as phone
FROM whatsapp_contacts;
```

---

### Data Retention

| Data Type | Recommended Retention | Rationale |
|---|---|---|
| Consent records (opt_in, opt_out) | 5–7 years | Legal evidence requirement |
| Message log (metadata: wamid, status, timestamps) | 90 days | Debugging + billing verification |
| Message body content | 30 days | Support context; then delete or anonymize |
| Contact records (opted-out) | 1 year then delete | Grace period for re-engagement |
| Contact records (active) | Duration of relationship + 2 years | Standard CRM retention |

**Implement retention via pg_cron:**
```sql
-- Delete message bodies older than 30 days (retain metadata)
SELECT cron.schedule('delete-old-message-bodies', '0 2 * * *', $$
  UPDATE whatsapp_message_log
  SET body_text = NULL, raw_payload = NULL
  WHERE created_at < now() - interval '30 days'
    AND body_text IS NOT NULL;
$$);

-- Delete opted-out contacts older than 1 year
SELECT cron.schedule('purge-opted-out-contacts', '0 3 * * 0', $$
  DELETE FROM whatsapp_contacts
  WHERE opt_in_status = 'opted_out'
    AND opt_out_timestamp < now() - interval '1 year';
$$);
```

---

### Deletion on Request (Right to Erasure)

GDPR Article 17 gives individuals the right to have their data deleted. When a deletion request is received:

1. Identify all records for the contact across all tables
2. Delete or anonymize message log entries (anonymize = replace phone with a hash, null all personal fields)
3. Delete the contact record
4. Log the deletion in `whatsapp_consent_log` (retain only the record that a deletion occurred — not the personal data itself)
5. Confirm to the requestor within 30 days (GDPR) or 45 days (CCPA)

```sql
-- Anonymize rather than delete (preserves metrics without personal data)
UPDATE whatsapp_message_log
SET body_text = '[DELETED]', raw_payload = NULL
WHERE contact_id = $1;

UPDATE whatsapp_contacts
SET 
  phone = 'DELETED_' || id::text,
  full_name = '[DELETED]',
  email = NULL,
  instagram_handle = NULL,
  display_name = '[DELETED]',
  opt_in_status = 'never_opted_in'  -- prevents accidental re-contact
WHERE id = $1;
```

---

## 17. Dos & Don'ts

### ✅ DOs

1. **Do use Meta Cloud API directly** for any syncflow-built automation. Skip BSP markup costs unless a client specifically needs a human inbox UI — and if they do, use WATI.

2. **Do verify the X-Hub-Signature-256 on every webhook** before processing. Skip this and you're open to spoofed webhook attacks that can enroll fake contacts or trigger fake opt-outs.

3. **Do dedup inbound events using `message_wamid`** as a unique key in your database. Meta will retry webhooks, and processing the same opt-out twice could cause issues.

4. **Do handle STOP/OPT-OUT as the very first routing step** in your inbound message workflow — before any other logic. The law requires immediate action, and delayed processing (even by seconds) is a liability.

5. **Do warm new phone numbers gradually.** Start at 100–200 messages/day for the first week. Jumping straight to 1,000/day on a new number raises quality flags.

6. **Do include opt-out instructions in every marketing message.** Either as a footer ("Reply STOP to unsubscribe") or as part of the body. This is legally required in most jurisdictions and reduces spam reports by giving users a clean exit.

7. **Do use meaningful variable personalization.** `Hi {{first_name}}` is table stakes. Mention their niche, platform, or recent content to drive higher response rates. Personalization also reduces spam detection risk.

8. **Do log every outbound message to `whatsapp_message_log` before sending**, not after. If the send fails, you need the record to exist for retry logic and audit purposes.

9. **Do check `session_expires_at` before deciding whether to send a template or a free-form message.** Sending a free-form message to an expired session generates a billable error. Query the contact record first.

10. **Do store consent with the exact consent language shown**, not a paraphrase. "I agree to receive promotional messages from GreenLeaf" is a legal record. "User agreed to comms" is not.

11. **Do test templates with real phone numbers** (your own test numbers) before launching a campaign. Catch formatting issues, broken image URLs, or variable mapping errors before they affect 1,000 contacts.

12. **Do use separate phone numbers per brand** (or at minimum per use case: marketing vs. transactional). Mixing high-volume marketing campaigns on the same number you use for order confirmations risks degrading quality for your transactional messages.

---

### ❌ DON'Ts

1. **Don't use a personal Facebook user's access token in production.** When that person leaves the company or deactivates their Facebook account, your integration breaks silently at 3am. System User tokens only.

2. **Don't buy contact lists and blast WhatsApp messages to them.** These contacts never opted in, will report your messages as spam, and your number will be banned — possibly within hours. There's no recovery path.

3. **Don't hardcode the System User token in n8n workflow nodes.** Use n8n's credential store. Hardcoded tokens appear in workflow export files and logs.

4. **Don't categorize a marketing template as UTILITY to save money.** Meta detects this and it results in template rejection, account flagging, or retroactive billing adjustments. Use the correct category.

5. **Don't send template messages without providing sample variable values during template submission.** Templates with empty or generic samples (like "text1", "text2") are rejected at higher rates. Use realistic examples from your actual use case.

6. **Don't attempt to parse the JSON-parsed body for HMAC verification.** You must use the raw request body bytes. Re-serializing JSON changes whitespace and key ordering, making the signature mismatch every time.

7. **Don't send messages faster than 80/second per phone number.** The API will return rate limit errors (error code 131056). In n8n, add a Wait node between bulk sends.

8. **Don't ignore quality rating drops.** A drop from High to Medium is a warning. By the time you're at Low, you have days before a potential ban. Investigate what triggered the drop (spam reports? List quality?) immediately.

9. **Don't store WhatsApp message bodies indefinitely.** Beyond 30 days they're a GDPR liability. Set up pg_cron jobs to null out body content while retaining metadata (wamid, timestamps, delivery status).

10. **Don't use the same template name for different template content.** You can't edit a submitted template — you create new ones. Version your template names: `creator_outreach_v1`, `creator_outreach_v2`. This makes debugging far easier when you have 20+ templates in production.

11. **Don't resume a paused outreach sequence without checking if the contact has replied** in the interim. A common n8n bug: the sequence scheduler picks up a paused contact and sends a follow-up even though the creator responded and a human is mid-negotiation. Always check `crm_status` and sequence `status` before sending.

12. **Don't skip the WABA warm-up even if you're in Tier 2 from a previous number.** Tier status is per phone number, not per WABA. A new number starts fresh at Tier 1 regardless of your WABA's history.

---

## 18. Quick Reference Cheat Sheet

### API Base URL
```
https://graph.facebook.com/v20.0/{PHONE_NUMBER_ID}/messages
```

### Send Template Message (minimal)
```bash
curl -X POST "https://graph.facebook.com/v20.0/$PHONE_ID/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "15551234567",
    "type": "template",
    "template": { "name": "your_template_name", "language": { "code": "en_US" } }
  }'
```

### Send Text Message (session window only)
```bash
curl -X POST "https://graph.facebook.com/v20.0/$PHONE_ID/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "15551234567",
    "type": "text",
    "text": { "body": "Your message here" }
  }'
```

### Mark Message as Read
```bash
curl -X POST "https://graph.facebook.com/v20.0/$PHONE_ID/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "messaging_product": "whatsapp",
    "status": "read",
    "message_id": "wamid.xxx"
  }'
```

### List Templates
```bash
curl "https://graph.facebook.com/v20.0/$WABA_ID/message_templates?fields=name,status,category" \
  -H "Authorization: Bearer $TOKEN"
```

### Key IDs to Know
| ID Type | Where to Find | Used For |
|---|---|---|
| WABA ID | Meta Business Manager → WhatsApp Accounts | Template management |
| Phone Number ID | Meta for Developers → WhatsApp → API Setup | Sending messages |
| App ID | Meta for Developers → App Dashboard | Webhook config |
| App Secret | Meta for Developers → App Settings → Basic | HMAC signature verification |

### Tier Progression Quick Reference
| Current Tier | Limit | Promoted When |
|---|---|---|
| 1 | 1,000 unique/day | You message ~1,000 unique users in 7 days at High/Medium quality |
| 2 | 10,000 unique/day | You message ~10,000 unique users in 7 days at High/Medium quality |
| 3 | 100,000 unique/day | You message ~100,000 unique users in 7 days at High/Medium quality |
| 4 | Unlimited | Applied manually — contact Meta |

### Error Codes Quick Reference
| Code | Plain English |
|---|---|
| 131026 | Contact not on WhatsApp or has blocked you |
| 131047 | Session window expired — use a template |
| 132001 | Template name wrong or template not approved |
| 133010 | Phone number not WhatsApp-registered |
| 368 | WABA restricted — check Business Manager |
| 131056 | Rate limit exceeded — slow down |

---

*This document covers the WhatsApp Business API as of May 2026. Meta updates API versions periodically — always check [developers.facebook.com/docs/whatsapp](https://developers.facebook.com/docs/whatsapp) for the current version and any breaking changes.*
