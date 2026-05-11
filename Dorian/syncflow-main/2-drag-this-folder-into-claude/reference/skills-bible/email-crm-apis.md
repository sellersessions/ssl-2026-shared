# Email Marketing & CRM APIs — Expert Reference for Amazon Brand Operations

> **Scope:** Everything the syncflow system needs to know about email and CRM APIs for Amazon brand operations — from Klaviyo DTC flows and SendGrid transactional triggers, through creator/influencer CRM architecture in Supabase, to deliverability fundamentals, Amazon's Buyer-Seller Messaging rules, and full n8n integration patterns. This is opinionated, practitioner-level guidance. When it says "do this," it means it.
> **Stack Context:** n8n + Supabase + Klaviyo / SendGrid / ActiveCampaign + ClickUp
> **Last Updated:** May 2026

---

## Table of Contents

1. [Email & CRM in the Amazon Brand Stack — Context First](#1-email--crm-in-the-amazon-brand-stack--context-first)
2. [Klaviyo — DTC Email for Amazon-Adjacent Brands](#2-klaviyo--dtc-email-for-amazon-adjacent-brands)
3. [SendGrid — Transactional Email API](#3-sendgrid--transactional-email-api)
4. [Postmark — Deliverability-First Transactional Email](#4-postmark--deliverability-first-transactional-email)
5. [ActiveCampaign — CRM + Email Automation](#5-activecampaign--crm--email-automation)
6. [HubSpot — When Brands Outgrow Simpler CRMs](#6-hubspot--when-brands-outgrow-simpler-crms)
7. [Creator/Influencer CRM Architecture](#7-creatorinfluencer-crm-architecture)
8. [n8n Integration Patterns](#8-n8n-integration-patterns)
9. [Creator Outreach Email Sequences](#9-creator-outreach-email-sequences)
10. [Deliverability Fundamentals](#10-deliverability-fundamentals)
11. [Amazon Buyer-Seller Messaging Rules](#11-amazon-buyer-seller-messaging-rules)
12. [CAN-SPAM & GDPR Compliance for Creator Outreach](#12-can-spam--gdpr-compliance-for-creator-outreach)
13. [Cost Comparison at Volume](#13-cost-comparison-at-volume)
14. [WhatsApp ↔ Email Channel Coordination](#14-whatsapp--email-channel-coordination)
15. [Dos & Don'ts](#15-dos--donts)
16. [Quick Reference Cheat Sheet](#16-quick-reference-cheat-sheet)

---

## 1. Email & CRM in the Amazon Brand Stack — Context First

### The Amazon Email Paradox

Here is the fact that every new client needs to understand before you build anything: **Amazon actively prevents you from emailing your own customers.**

When someone buys your product on Amazon, you do not get their real email address. You get a masked proxy address (`buyer@marketplace.amazon.com`) that forwards only to Amazon's internal messaging system. You cannot extract the real email. You cannot add these contacts to Klaviyo. You cannot send them a post-purchase sequence. Amazon built this wall deliberately — they own the customer relationship, not you.

This is not a compliance gray area. It is the fundamental design of Amazon's marketplace. Any tool or service claiming to "extract Amazon customer emails" is either lying or describing something that will get your seller account suspended.

### What Amazon DOES Allow

Amazon provides two legitimate mechanisms for seller-to-buyer communication:

**Buyer-Seller Messaging:** A proxied system where messages route through Amazon's interface. Strict rules apply (covered in Section 11). You can use it for order-related queries only. No marketing. No review solicitation. No coupons.

**Request a Review button:** Amazon's native feature (available in Seller Central or automatable via SP-API) that sends a standardized review request email on your behalf. The message is templated by Amazon, you cannot customize the text, and it can only be triggered once per order.

That's it. Amazon email access ends there.

### What Email IS Used For in an Amazon Brand Stack

Given those constraints, here is where email and CRM actually live in an Amazon operation:

**1. Creator/Influencer Outreach (B2B)**
Your primary email use case. Reaching out to content creators, influencers, and UGC producers for product collaborations. These are business contacts, not Amazon customers. You have their public email addresses or social DMs lead to email exchange. Full email tooling applies — sequences, CRM tracking, pipeline management.

**2. Off-Amazon DTC Email Marketing**
Brands running a Shopify or WooCommerce store alongside Amazon collect real customer emails through their own checkout. These contacts can be added to Klaviyo and worked through full post-purchase flows, winbacks, and campaigns. The DTC channel is the solution to Amazon's customer data wall — build it alongside Amazon, not instead of it.

**3. Agency/Supplier/Vendor Communications**
B2B operational email: supplier negotiations, 3PL coordination, agency updates, freelancer briefs. This is typically handled with standard business email (Gmail/Outlook) plus automation triggers in n8n (e.g., send supplier a restocking alert when Supabase inventory drops below threshold).

**4. Internal Team Automation**
System-generated emails triggered by business events: daily PPC performance summaries, inventory alerts, review spike notifications, order anomaly flags. These go from your n8n/Supabase stack to internal email addresses via SendGrid or Postmark.

**5. Amazon Buyer Follow-Up via Request a Review Automation**
Not email you write — but automating the "Request a Review" button via SP-API is the legitimate substitute. Covered briefly in Section 11.

### Choosing the Right Tool

The answer is almost always more than one tool, used for different purposes:

| Use Case | Recommended Tool |
|---|---|
| DTC email marketing (flows, campaigns) | Klaviyo |
| System/transactional alerts (internal or B2B) | SendGrid or Postmark |
| Creator/influencer pipeline + email sequences | ActiveCampaign or Supabase + SendGrid |
| Complex B2B sales pipeline (team of 3+) | HubSpot |
| Lightweight creator CRM (<500) | Supabase tables + n8n sequences |

The rest of this document goes deep on each.

---

## 2. Klaviyo — DTC Email for Amazon-Adjacent Brands

### What Klaviyo Is and Why It Dominates

Klaviyo is an email (and SMS) marketing platform built specifically for ecommerce. It is not a generic email tool like Mailchimp retrofitted with ecommerce plugins — the entire data model is built around products, orders, and customer behavior. Every Klaviyo concept (events, properties, flows, segments) maps naturally to what an ecommerce brand needs.

For Amazon brands running a DTC site alongside Amazon, Klaviyo is the default correct answer. Its Shopify integration is best-in-class — one-click install, real-time order sync, automatic profile creation, and pre-built flows that work out of the box. WooCommerce integration is solid via the official plugin. Klaviyo also ingests custom events via API, meaning you can push Amazon-side data (like review requests or new ASIN launches) into it even without a direct Amazon integration.

**What Klaviyo excels at:**
- Pre-built ecommerce flows: welcome series, abandoned cart, browse abandonment, post-purchase (2-email sequence by default), winback, sunset
- Behavioral segmentation: "bought X but not Y in the last 90 days", "opened 3+ emails but never purchased", "high CLV customers who haven't purchased in 60 days"
- Revenue attribution: Klaviyo tracks which emails generated purchases via UTM + cookie tracking — you can see exact revenue per flow per campaign
- A/B testing flows and campaigns with statistical significance indicators
- SMS integrated alongside email (same profiles, coordinated flows)
- Product recommendations in email (pulling from your catalog)
- Predictive analytics: expected next order date, predicted CLV, churn risk

**What Klaviyo does NOT do well:**
- B2B CRM pipeline management (no deal stages, no pipeline views)
- Transactional email for system alerts (SendGrid/Postmark are better and cheaper for that)
- Creator/influencer outreach sequences (the data model is consumer-centric)
- Complex multi-touch B2B sales workflows

### Klaviyo Account Structure

```
Klaviyo Account
├── Profiles (contacts, unified identity across email + SMS)
├── Lists (static membership — you add/remove explicitly)
├── Segments (dynamic membership — rules-based, recalculated continuously)
├── Flows (automated sequences triggered by events or list membership)
├── Campaigns (one-time sends to lists/segments)
└── Events (behavioral signals: Placed Order, Viewed Product, Started Checkout, etc.)
```

**Lists vs. Segments:** Lists are membership-controlled (you explicitly add/remove). Segments are rules-based and recalculate automatically. For most use cases, build Segments for targeting and use Lists only for specific consent groups (like "SMS Subscribers" or "VIP Customers").

### Klaviyo API Overview

Klaviyo's v3 API (current as of 2025) uses JSON:API format. All endpoints require an API key in the header.

**Base URL:** `https://a.klaviyo.com/api/`

**Authentication:** Private API key in header:
```
Authorization: Klaviyo-API-Key your-private-api-key
revision: 2024-10-15
```

The `revision` header is required and specifies the API version. Pin to a specific date to avoid breaking changes.

**Core API namespaces:**
- `/profiles` — create, read, update contact profiles
- `/lists` — manage static lists
- `/segments` — read segment membership
- `/events` — track behavioral events
- `/flows` — read flow structure (cannot trigger flows directly, they trigger from events/list membership)
- `/campaigns` — create and send campaigns

### Profiles API — Create/Update a Profile

Creating or updating a profile (upsert semantics — if the email already exists, the profile is updated):

```bash
curl -X POST "https://a.klaviyo.com/api/profiles/" \
  -H "Authorization: Klaviyo-API-Key $KLAVIYO_PRIVATE_KEY" \
  -H "Content-Type: application/json" \
  -H "revision: 2024-10-15" \
  -d '{
    "data": {
      "type": "profile",
      "attributes": {
        "email": "sarah@example.com",
        "first_name": "Sarah",
        "last_name": "Chen",
        "phone_number": "+12025551234",
        "properties": {
          "source": "klaviyo_api",
          "creator_tier": "macro",
          "instagram_handle": "@sarahchen",
          "follower_count": 285000,
          "niche": "wellness"
        }
      }
    }
  }'
```

**Response (201 Created):**
```json
{
  "data": {
    "type": "profile",
    "id": "01GDDQKASQN4J3JA0YGSZKB4N5",
    "attributes": {
      "email": "sarah@example.com",
      "first_name": "Sarah",
      "last_name": "Chen",
      "phone_number": "+12025551234",
      "properties": { "creator_tier": "macro", "niche": "wellness" },
      "created": "2026-05-07T12:00:00+00:00",
      "updated": "2026-05-07T12:00:00+00:00"
    }
  }
}
```

Note the profile `id` — this Klaviyo internal ID is what you use to add the profile to lists or reference in subsequent calls.

### Lists API — Add a Profile to a List

```bash
curl -X POST "https://a.klaviyo.com/api/lists/$LIST_ID/relationships/profiles/" \
  -H "Authorization: Klaviyo-API-Key $KLAVIYO_PRIVATE_KEY" \
  -H "Content-Type: application/json" \
  -H "revision: 2024-10-15" \
  -d '{
    "data": [
      { "type": "profile", "id": "01GDDQKASQN4J3JA0YGSZKB4N5" }
    ]
  }'
```

This returns `204 No Content` on success. To get your list IDs, call `GET /api/lists/` — the response includes all lists with their names and IDs.

**Practical note:** You can also upsert a profile AND add it to a list in one call using the `$fields[profile]` pattern. But for syncflow workflows, doing it in two steps makes n8n error handling cleaner — profile creation failures are isolated from list membership failures.

### Events API — Track a Custom Event

Events are how Klaviyo knows what someone did. Pre-built events (Placed Order, Started Checkout) come from Shopify/WooCommerce automatically. Custom events come via the API.

```bash
curl -X POST "https://a.klaviyo.com/api/events/" \
  -H "Authorization: Klaviyo-API-Key $KLAVIYO_PRIVATE_KEY" \
  -H "Content-Type: application/json" \
  -H "revision: 2024-10-15" \
  -d '{
    "data": {
      "type": "event",
      "attributes": {
        "profile": {
          "data": {
            "type": "profile",
            "attributes": { "email": "sarah@example.com" }
          }
        },
        "metric": {
          "data": {
            "type": "metric",
            "attributes": { "name": "Creator Collab Activated" }
          }
        },
        "properties": {
          "product_name": "GreenLeaf Collagen Powder",
          "asin": "B0XXXXXXXXX",
          "discount_code": "SARAH20",
          "commission_rate": 0.10
        },
        "time": "2026-05-07T12:00:00+00:00",
        "value": 0
      }
    }
  }'
```

The metric name is created automatically if it doesn't exist. Events can trigger flows — build a flow triggered by "Creator Collab Activated" to send the welcome sequence, content brief, and tracking link.

### Supabase → Klaviyo Sync Pattern via n8n

The most common syncflow pattern: a new creator is added to Supabase, and you want to push them to a Klaviyo list for email sequencing.

**n8n workflow structure:**

```
Supabase Trigger (new row in creators table)
  → HTTP Request: Create/Update Klaviyo Profile
  → HTTP Request: Add Profile to Klaviyo List
  → Supabase: Update creator record with klaviyo_profile_id
```

**Step 1 — Supabase Trigger configuration:**
- Node type: Supabase
- Operation: Get All (with polling, or use Webhook via Supabase realtime)
- Or use a Cron trigger + query for `klaviyo_synced_at IS NULL`

**Step 2 — Create Klaviyo Profile (HTTP Request node):**
```json
{
  "method": "POST",
  "url": "https://a.klaviyo.com/api/profiles/",
  "headers": {
    "Authorization": "Klaviyo-API-Key {{$credentials.klaviyoApiKey}}",
    "revision": "2024-10-15",
    "Content-Type": "application/json"
  },
  "body": {
    "data": {
      "type": "profile",
      "attributes": {
        "email": "={{$json.email}}",
        "first_name": "={{$json.first_name}}",
        "last_name": "={{$json.last_name}}",
        "properties": {
          "instagram_handle": "={{$json.instagram_handle}}",
          "follower_count": "={{$json.follower_count}}",
          "niche": "={{$json.niche}}",
          "source": "supabase_creator_crm"
        }
      }
    }
  }
}
```

**Step 3 — Store the Klaviyo profile ID back in Supabase:**
```sql
UPDATE creators
SET klaviyo_profile_id = '{{ klaviyo_response.data.id }}',
    klaviyo_synced_at = NOW()
WHERE id = '{{ creator_id }}';
```

**Handling conflicts:** If a profile already exists with that email, Klaviyo returns a 409 with the existing profile ID in the `meta.duplicate_profile_id` field. Your n8n error handler should catch 409s and use that ID instead of failing.

### Klaviyo Flows vs. Campaigns

**Flows** are automated sequences triggered by events or list membership changes. They run asynchronously as contacts enter the trigger condition. Use flows for:
- Welcome series (triggered by "Joined List: Subscribers")
- Post-purchase (triggered by "Placed Order")
- Creator onboarding (triggered by custom event "Creator Collab Activated")
- Winback (triggered by segment "Purchased 180+ days ago, no recent purchase")

**Campaigns** are one-time sends to a list or segment at a scheduled time. Use campaigns for:
- Product launch announcements
- Seasonal promotions
- Newsletters
- Creator broadcast announcements

You cannot trigger a Klaviyo flow via API. Flows trigger when a contact enters the trigger condition (joins a list, fires an event, enters a segment). To "trigger" a flow, add the contact to the triggering list or fire the triggering event via API. Klaviyo handles the rest.

### Klaviyo Pricing

| Contacts | Email Sends/Month | Monthly Cost |
|---|---|---|
| Up to 250 | Up to 500 | Free |
| 251 – 500 | Up to 5,000 | $20/month |
| 501 – 1,000 | Up to 10,000 | $30/month |
| 1,001 – 1,500 | Up to 15,000 | $45/month |
| 5,001 – 10,000 | Up to 100,000 | $150/month |
| 10,001 – 25,000 | Up to 250,000 | $400/month |

Pricing is contact-based, not send-based (up to 10x contact count in sends). Above 500 contacts, Klaviyo becomes meaningfully expensive compared to SendGrid for pure transactional volume — this is fine because Klaviyo handles marketing flows, not transactional email. If you're sending a high volume of transactional messages (order confirmations, system alerts), use SendGrid or Postmark for those and keep Klaviyo for marketing.

**When Klaviyo becomes expensive:** Above 25,000 contacts, pricing jumps significantly and custom quotes become the norm. At that scale, evaluate whether you need all of Klaviyo's features or if a combination of a simpler ESP + custom Supabase segments covers your needs.

---

## 3. SendGrid — Transactional Email API

### What SendGrid Is and Where It Fits

SendGrid (now part of Twilio) is the dominant transactional email API. "Transactional" means emails triggered by specific events — one message to one recipient in response to an action — as opposed to campaign emails broadcast to a list. Think: order confirmation, password reset, creator collaboration confirmation, invoice, alert email, system notification.

SendGrid's strengths are reliability, deliverability at scale, and a clean REST API that's been around long enough that every tool (n8n, Zapier, Python, Node) has a SendGrid integration. Its weaknesses are that the UI is clunky for non-technical users and that marketing automation features lag behind Klaviyo significantly.

**Primary use cases for syncflow:**
- Sending creator collaboration confirmation emails automatically when a collab is approved in Supabase
- Daily/weekly performance digest emails to brand owners and managers
- Inventory alert emails when stock drops below threshold
- Review spike notification emails to the brand team
- Supplier communication triggers (restocking orders, shipping confirmations)
- Error/exception notifications from n8n workflows

**Not the right tool for:** DTC marketing sequences, post-purchase flows, abandoned cart, or any campaign that goes to lists of consumers. Use Klaviyo for that.

### Mail Send API — v3 Endpoint

**Base URL:** `https://api.sendgrid.com/v3/`
**Authentication:** Bearer token (API key) in Authorization header

**Send a simple email:**
```bash
curl -X POST "https://api.sendgrid.com/v3/mail/send" \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personalizations": [
      {
        "to": [{ "email": "you@yourbrand.com", "name": "Dorian" }],
        "subject": "🚨 Inventory Alert: GreenLeaf Collagen Powder"
      }
    ],
    "from": {
      "email": "alerts@yourbrand.com",
      "name": "Brand Ops Alerts"
    },
    "reply_to": {
      "email": "ops@yourbrand.com",
      "name": "Brand Operations"
    },
    "content": [
      {
        "type": "text/plain",
        "value": "GreenLeaf Collagen Powder (B0XXXXXXXXX) has dropped to 47 units — below your 50-unit threshold. Current FBA quantity: 47. Reorder trigger: 50."
      },
      {
        "type": "text/html",
        "value": "<h2>Inventory Alert</h2><p><strong>GreenLeaf Collagen Powder</strong> has dropped to <strong>47 units</strong>. Reorder now.</p>"
      }
    ]
  }'
```

### Dynamic Templates (Handlebars)

For anything beyond simple alerts, use SendGrid's dynamic templates. These are HTML templates stored in SendGrid with Handlebars placeholders, called by template ID.

**Creating a template:** Via SendGrid UI (drag-and-drop or HTML editor). Save the template, note the template ID (format: `d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`).

**Calling a template via API:**
```bash
curl -X POST "https://api.sendgrid.com/v3/mail/send" \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personalizations": [
      {
        "to": [{ "email": "creator@example.com", "name": "Sarah Chen" }],
        "dynamic_template_data": {
          "first_name": "Sarah",
          "brand_name": "GreenLeaf",
          "product_name": "Collagen Powder",
          "discount_code": "SARAH20",
          "commission_rate": "10%",
          "content_deadline": "May 21, 2026",
          "tracking_link": "https://amzn.to/3xXXXXX",
          "brief_url": "https://drive.google.com/..."
        }
      }
    ],
    "from": {
      "email": "partnerships@greenlaf.com",
      "name": "GreenLeaf Partnerships"
    },
    "template_id": "d-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5"
  }'
```

**Handlebars syntax in templates:**
```handlebars
<p>Hi {{first_name}},</p>
<p>Welcome to the {{brand_name}} creator program! Here are your details:</p>
<ul>
  <li>Product: {{product_name}}</li>
  <li>Your discount code: <strong>{{discount_code}}</strong></li>
  <li>Commission: {{commission_rate}} on all sales</li>
  <li>Content deadline: {{content_deadline}}</li>
</ul>
{{#if tracking_link}}
<p><a href="{{tracking_link}}">Your Amazon tracking link</a></p>
{{/if}}
```

### Multiple Recipients / Batch Sending

Send to up to 1,000 recipients in a single API call using multiple `personalizations` objects. Each personalization can have unique `to`, `dynamic_template_data`, and `subject`:

```json
{
  "personalizations": [
    {
      "to": [{ "email": "creator1@example.com" }],
      "dynamic_template_data": { "first_name": "Alice", "discount_code": "ALICE15" }
    },
    {
      "to": [{ "email": "creator2@example.com" }],
      "dynamic_template_data": { "first_name": "Bob", "discount_code": "BOB15" }
    }
  ],
  "from": { "email": "partnerships@brand.com" },
  "template_id": "d-XXXXXXXX"
}
```

For bulk personalized sends above 1,000, split into chunks in n8n using a Loop Over Items node.

### Event Webhooks — Tracking Delivery and Engagement

SendGrid can POST webhook events to your n8n webhook URL whenever an email is delivered, opened, clicked, bounced, or marked as spam.

**Configure in SendGrid UI:** Settings → Mail Settings → Event Webhook → enter your n8n webhook URL.

**Events available:**
| Event | Trigger |
|---|---|
| `delivered` | Email accepted by recipient's server |
| `open` | Recipient opened the email (requires open tracking pixel) |
| `click` | Recipient clicked a tracked link |
| `bounce` | Email rejected by recipient's server (hard or soft bounce) |
| `dropped` | SendGrid dropped before sending (invalid address, unsubscribed) |
| `spam_report` | Recipient marked as spam |
| `unsubscribe` | Recipient clicked unsubscribe |
| `group_unsubscribe` | Recipient unsubscribed from a specific group |

**Example webhook payload (array of events):**
```json
[
  {
    "email": "sarah@example.com",
    "timestamp": 1746619200,
    "smtp-id": "<14c5d75ce93.dfd.64b469@ismtpd-555>",
    "event": "delivered",
    "category": "creator_outreach",
    "sg_event_id": "sendgrid_internal_event_id",
    "sg_message_id": "14c5d75ce93.dfd.64b469"
  },
  {
    "email": "sarah@example.com",
    "timestamp": 1746623800,
    "event": "open",
    "sg_event_id": "xxxxxxx",
    "useragent": "Mozilla/5.0...",
    "ip": "66.249.73.240"
  }
]
```

**n8n webhook handler for SendGrid events:**

1. Webhook Trigger node (POST) — receives the events array
2. Split Out node — processes one event at a time
3. Switch node on `$json.event` — routes `bounce` to suppression handling, `open` to engagement update, `spam_report` to immediate suppression + alert
4. Supabase Update node — updates `outreach_log` table with event status and timestamp

**Setting categories:** Include a `categories` array in your mail send payload to tag events for filtering:
```json
"categories": ["creator_outreach", "collab_confirmation", "brand_greenleaf"]
```

### Suppression Management

SendGrid maintains global suppression lists (emails that should never be sent to again):
- **Bounces:** Hard bounces (address doesn't exist) are automatically suppressed after first occurrence
- **Spam Reports:** Automatically suppressed when a spam report is received
- **Global Unsubscribes:** Added when a recipient clicks unsubscribe on any SendGrid email from your account
- **Blocks:** Temporary blocks (soft bounces, spam filter rejections)

**Query suppressions via API:**
```bash
# Get all hard bounces
curl "https://api.sendgrid.com/v3/suppression/bounces" \
  -H "Authorization: Bearer $SENDGRID_API_KEY"

# Delete a bounce (to retry sending to this address)
curl -X DELETE "https://api.sendgrid.com/v3/suppression/bounces/email@example.com" \
  -H "Authorization: Bearer $SENDGRID_API_KEY"
```

**Important:** Sync SendGrid suppressions back to Supabase. When a bounce is recorded, mark the creator's record with `email_status = 'bounced'` and stop sequencing them. This keeps your Supabase creator CRM accurate.

### SendGrid Pricing

| Plan | Monthly Cost | Daily Send Limit | Notes |
|---|---|---|---|
| Free | $0 | 100/day | No dedicated IP, limited features |
| Essentials 50K | $19.95 | ~1,700/day | 50,000 emails/month |
| Essentials 100K | $34.95 | ~3,300/day | 100,000 emails/month |
| Pro 100K | $89.95 | ~3,300/day | Dedicated IP, sub-users |
| Pro 300K | $249.00 | ~10,000/day | Higher volume |

For syncflow's transactional use case, the Essentials 50K plan handles most brands. Upgrade to Pro for the dedicated IP once you're sending over 20,000 emails/month consistently (dedicated IP improves deliverability at scale).

---

## 4. Postmark — Deliverability-First Transactional Email

### Why Postmark Exists and When to Choose It

Postmark is a transactional-only email service with one obsession: delivery rate. Where SendGrid handles both transactional and marketing email (plus SMS, and has gotten bloated as a result), Postmark does one thing — gets transactional email delivered, fast.

**Postmark's defining features:**
- **45-day searchable email logs:** Every email you send is logged with full headers, body, and delivery status. Invaluable for debugging. SendGrid's free tier gives you 3 days; Postmark gives you 45 for all plans.
- **Message Streams:** A first-class concept that separates transactional email from promotional email at the infrastructure level (shared sending reputation pools). Your order confirmations can't be dragged down by a promotional send gone wrong.
- **Fastest average delivery time in the industry:** Postmark consistently benchmarks faster than SendGrid or Mailgun on time-from-API-call to inbox.
- **Clean, honest pricing:** No tiered feature gates. All features available at all pricing tiers. Pay for volume only.

**When to choose Postmark over SendGrid:**
- Your brand sends critical transactional email (collab confirmations, invoices, contracts) where a delay or missed delivery is a business problem
- You need 45-day email logs without paying extra (important for audit trails)
- You're sending from a domain that also handles promotional email and want hard infrastructure separation
- You value a simpler, more focused product over SendGrid's sprawl

**When SendGrid wins over Postmark:**
- You need marketing campaign features alongside transactional (Postmark has zero marketing features)
- You need advanced suppression group management (SendGrid's is more mature)
- Your team is already authenticated with Twilio's ecosystem

### Postmark API — Sending Email

**Base URL:** `https://api.postmarkapp.com/`
**Authentication:** Server API Token in `X-Postmark-Server-Token` header

**Send a simple email:**
```bash
curl -X POST "https://api.postmarkapp.com/email" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Postmark-Server-Token: $POSTMARK_SERVER_TOKEN" \
  -d '{
    "From": "partnerships@greenlaf.com",
    "To": "sarah@example.com",
    "Subject": "Your GreenLeaf Collab is Confirmed! 🎉",
    "TextBody": "Hi Sarah, your collaboration with GreenLeaf is officially confirmed...",
    "HtmlBody": "<h1>Welcome aboard!</h1><p>Hi Sarah, your collaboration...</p>",
    "ReplyTo": "you@yourbrand.com",
    "MessageStream": "outbound"
  }'
```

**Response:**
```json
{
  "To": "sarah@example.com",
  "SubmittedAt": "2026-05-07T12:00:00.0000000-05:00",
  "MessageID": "b7bc2f4a-e38e-4336-af7d-e6c392c2f817",
  "ErrorCode": 0,
  "Message": "OK"
}
```

Note the `MessageID` — store this against the outreach record in Supabase for later delivery status lookups.

### Templates (Server-Side Rendering)

Postmark supports templates stored on their servers. Reference by alias:

```bash
curl -X POST "https://api.postmarkapp.com/email/withTemplate" \
  -H "X-Postmark-Server-Token: $POSTMARK_SERVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "From": "partnerships@greenlaf.com",
    "To": "sarah@example.com",
    "TemplateAlias": "creator-collab-welcome",
    "TemplateModel": {
      "first_name": "Sarah",
      "product_name": "GreenLeaf Collagen Powder",
      "discount_code": "SARAH20",
      "content_deadline": "May 21, 2026"
    },
    "MessageStream": "outbound"
  }'
```

### Batch Sending

Up to 500 messages per batch:
```bash
curl -X POST "https://api.postmarkapp.com/email/batch" \
  -H "X-Postmark-Server-Token: $POSTMARK_SERVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "From": "partnerships@greenlaf.com",
      "To": "sarah@example.com",
      "Subject": "Your GreenLeaf collab is live!",
      "TextBody": "Hi Sarah, your collaboration is active..."
    },
    {
      "From": "partnerships@greenlaf.com",
      "To": "mike@example.com",
      "Subject": "Your GreenLeaf collab is live!",
      "TextBody": "Hi Mike, your collaboration is active..."
    }
  ]'
```

### Message Streams — The Key Differentiator

Postmark's message stream concept is the feature that separates it from the competition. Every Postmark server has a default `outbound` transactional stream. You can create additional streams with different characteristics:

```
Postmark Server
├── outbound (default transactional stream — shared IP pool for transactional)
├── broadcast (promotional/marketing stream — separate shared IP pool)
└── [custom streams you create]
```

**Why this matters:** Transactional and broadcast emails share different IP reputation pools. If your marketing broadcast gets a spike in spam complaints, it affects the broadcast stream's reputation — not the transactional stream. Your order confirmations continue to arrive reliably even if a campaign goes sideways.

Create a broadcast stream for any non-transactional sends (creator outreach campaigns, newsletters):
```bash
curl -X POST "https://api.postmarkapp.com/message-streams" \
  -H "X-Postmark-Server-Token: $POSTMARK_SERVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ID": "creator-outreach",
    "MessageStreamType": "Broadcasts",
    "Name": "Creator Outreach Broadcasts",
    "Description": "Outbound email to creator prospects"
  }'
```

Then reference `"MessageStream": "creator-outreach"` in your send calls.

### Postmark Webhooks

Configure webhook URLs per message stream in the Postmark UI or API. Same event types as SendGrid: delivery, open, click, bounce, spam complaint. The webhook payload format is simpler and cleaner than SendGrid's:

```json
{
  "RecordType": "Delivery",
  "ServerID": 12345,
  "MessageID": "b7bc2f4a-e38e-4336-af7d-e6c392c2f817",
  "Recipient": "sarah@example.com",
  "Tag": "creator_outreach",
  "DeliveredAt": "2026-05-07T12:01:34.0000000Z",
  "Details": "Test delivery webhook details"
}
```

### Postmark Pricing

| Monthly Emails | Cost |
|---|---|
| Up to 1,000 | Free (Postmark's developer account) |
| 10,000 | $15/month |
| 50,000 | $50/month |
| 100,000 | $75/month |
| 500,000 | $275/month |

No contact limits. Pure per-email pricing. Significantly cheaper than SendGrid's Pro plans at high volume for purely transactional use.

---

## 5. ActiveCampaign — CRM + Email Automation

### What ActiveCampaign Adds Over Pure Email Tools

ActiveCampaign sits between an email marketing platform and a full CRM. It combines:
- Contact database with custom fields and tagging
- Email marketing (campaigns + automation sequences)
- **Deal/pipeline CRM:** Kanban-style pipeline with stages, deal values, and probability
- **Automation branching:** Workflows that branch on CRM events (deal moves to stage X → send email Y, notify team in Slack, update contact score)
- **Contact/lead scoring:** Assign points based on email opens, clicks, site visits, and form submissions
- **Site tracking:** Track contact behavior on your website

For Amazon brands, the critical feature is the **deal pipeline for creator/influencer management**. Creators move through stages (Identified → Reached Out → Responded → Interest Confirmed → Product Sent → Content Posted → Partnership Closed) with monetary values attached (estimated GMV, payment amounts). This is something Klaviyo cannot do.

### Creator/Influencer Pipeline in ActiveCampaign

The recommended pipeline configuration for creator relationship management:

```
Creator Pipeline
├── Stage 1: Identified (lead quality score calculated)
├── Stage 2: Outreach Sent (email sent, awaiting response)
├── Stage 3: Responded (creator expressed interest)
├── Stage 4: Details Confirmed (product, code, commission agreed)
├── Stage 5: Product Shipped (physical product or samples sent)
├── Stage 6: Content Live (post/video/reel published)
├── Stage 7: Performance Review (30-day GMV calculated)
└── Stage 8: Long-Term Partner (recurring collab agreement)
```

Each deal has:
- Title: "Sarah Chen × GreenLeaf Collagen Q2 2026"
- Value: Estimated GMV (e.g., $5,000)
- Contact: Linked to the creator profile
- Custom fields: Instagram handle, follower count, content type, discount code, commission rate, ASIN

### ActiveCampaign API Overview

**Base URL:** `https://{your-account}.api-us1.com/api/3/`
**Authentication:** API key in `Api-Token` header

Your account API URL is unique to your account name. Find it in ActiveCampaign → Settings → Developer.

**Key endpoints:**
| Resource | CRUD Methods |
|---|---|
| `/contacts` | Create, read, update, list, delete |
| `/deals` | Create, read, update, move stage |
| `/lists` | Read, add/remove contact from list |
| `/automations` | Read (cannot trigger directly — use tags or list additions) |
| `/tags` | Create, assign to contact |
| `/dealStages` | Read (get stage IDs for pipeline operations) |

### Create a Contact

```bash
curl -X POST "https://yourapp.api-us1.com/api/3/contacts" \
  -H "Api-Token: $ACTIVECAMPAIGN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contact": {
      "email": "sarah@example.com",
      "firstName": "Sarah",
      "lastName": "Chen",
      "phone": "+12025551234",
      "fieldValues": [
        { "field": "1", "value": "@sarahchen" },
        { "field": "2", "value": "285000" },
        { "field": "3", "value": "wellness" }
      ]
    }
  }'
```

Custom field IDs (`"1"`, `"2"`, `"3"`) are found via `GET /fields`. Set up your custom fields in the AC UI first.

### Create a Deal (CRM Record)

```bash
curl -X POST "https://yourapp.api-us1.com/api/3/deals" \
  -H "Api-Token: $ACTIVECAMPAIGN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "deal": {
      "contact": "42",
      "account": "",
      "title": "Sarah Chen × GreenLeaf Collagen Q2 2026",
      "group": "1",
      "stage": "1",
      "value": 500000,
      "currency": "usd",
      "owner": "1",
      "description": "Macro wellness creator, 285k followers. Product: Collagen Powder. Code: SARAH20"
    }
  }'
```

Note: `value` is in cents ($500,000 cents = $5,000). `group` is pipeline ID, `stage` is pipeline stage ID — get these from `GET /dealGroups` and `GET /dealStages`.

### Move a Deal to a New Stage

```bash
curl -X PUT "https://yourapp.api-us1.com/api/3/deals/123" \
  -H "Api-Token: $ACTIVECAMPAIGN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "deal": {
      "stage": "4"
    }
  }'
```

This can trigger automations configured to fire on stage transitions — e.g., move to Stage 5 (Product Shipped) → send internal Slack notification + fire "collab active" event in Klaviyo.

### n8n Integration — Native Nodes

n8n has a native ActiveCampaign node with the following operations:

**Contact:**
- Create
- Update
- Get
- GetAll (with filters)
- Delete

**Deal:**
- Create
- Update
- Get
- GetAll

**Connection setup in n8n:**
1. Credentials → ActiveCampaign API
2. Enter your API URL (format: `https://yourapp.api-us1.com`) and API key
3. Test connection

The native node covers 80% of use cases. For advanced operations (custom field management, automation triggering via tags), use the HTTP Request node.

### Triggering Automations via Tags

You cannot directly trigger an ActiveCampaign automation via API. The workaround: automations can be triggered by "Contact is tagged with X" — so you add a tag via API to trigger the automation.

```bash
# Add a tag to a contact to trigger automation
curl -X POST "https://yourapp.api-us1.com/api/3/contactTags" \
  -H "Api-Token: $ACTIVECAMPAIGN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contactTag": {
      "contact": "42",
      "tag": "15"
    }
  }'
```

Tag ID `15` corresponds to (for example) "collab_confirmed" — and your automation "When tagged with collab_confirmed → send welcome email sequence" fires automatically.

### ActiveCampaign Pricing

| Plan | Monthly (annual billing) | Contacts | Notes |
|---|---|---|---|
| Starter | $15/month | 1,000 | Email + basic automation, no CRM deals |
| Plus | $49/month | 1,000 | CRM deals, landing pages |
| Professional | $79/month | 1,000 | Predictive content, attribution |
| Enterprise | Custom | Custom | Custom reporting, SSO |

Additional contacts billed in increments — pricing shown is for 1,000 contacts. For 10,000 contacts, expect Plus at ~$135/month. The key upgrade from Starter to Plus is the CRM deal pipeline — worth it for creator pipeline management.

---

## 6. HubSpot — When Brands Outgrow Simpler CRMs

### The Case for HubSpot (and Against Rushing to It)

HubSpot is the go-to CRM for companies with multi-person sales teams, complex reporting needs, or significant B2B relationship management at scale. For a one- or two-person Amazon brand, it's almost certainly overkill. For a multi-brand agency with a creator partnerships team of 4+ people, it starts to make sense.

**HubSpot's genuine advantages over ActiveCampaign:**
- More powerful deal pipeline reporting (pipeline velocity, win rate by stage, deal amount over time)
- Better company/account management (great for B2B supplier and agency relationships)
- Native meeting scheduling integration (book a discovery call directly from an email)
- Sequences (a HubSpot-native feature for sales-style email outreach with follow-up scheduling)
- A legitimately useful free CRM tier — unlike most "free CRM" offers, HubSpot Free is genuinely functional

**When NOT to use HubSpot:**
- When Supabase + ActiveCampaign covers your needs
- When your team is one person with occasional help
- When you don't need reporting across multiple team members' pipelines
- When cost is a significant concern (HubSpot's paid tiers escalate quickly)

### HubSpot Free CRM — What's Actually Free

HubSpot Free is one of the most generous free tiers in the CRM space. Genuinely included at no cost:
- Unlimited contacts (no contact limit on the free CRM)
- Deal pipeline (one pipeline, unlimited deals)
- Contact, company, deal, and task records
- Email tracking (open + click notifications for emails sent from Gmail/Outlook with HubSpot extension)
- Meeting scheduling (connects to Google Calendar, sends booking links)
- Live chat widget for your website
- Basic email marketing (2,000 sends/month, HubSpot branding in footer)
- Contact activity timeline

**What you don't get free:**
- Multiple pipelines (one per account on free)
- Email sequences (requires Sales Hub Starter at $15/seat/month)
- Advanced reporting and dashboards
- HubSpot branding removed from emails and chat
- Workflow automation (requires Marketing Hub Starter at $15/month)

For creator/influencer CRM on a tight budget: HubSpot Free is viable if you only need one pipeline and are comfortable with HubSpot's branding in outbound emails. Otherwise, ActiveCampaign Plus is more capable at a similar price point.

### HubSpot CRM Objects API

**Base URL:** `https://api.hubapi.com/crm/v3/`
**Authentication:** OAuth 2.0 (preferred) or Private App API key

**Private App authentication (simpler for syncflow):**
Create a Private App in HubSpot → Settings → Integrations → Private Apps. Grant it scopes: `crm.objects.contacts.write`, `crm.objects.deals.write`, `crm.objects.contacts.read`.

```bash
curl -X GET "https://api.hubapi.com/crm/v3/objects/contacts" \
  -H "Authorization: Bearer $HUBSPOT_PRIVATE_APP_TOKEN" \
  -H "Content-Type: application/json"
```

### Create a Contact

```bash
curl -X POST "https://api.hubapi.com/crm/v3/objects/contacts" \
  -H "Authorization: Bearer $HUBSPOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "properties": {
      "email": "sarah@example.com",
      "firstname": "Sarah",
      "lastname": "Chen",
      "phone": "+12025551234",
      "instagram_handle": "@sarahchen",
      "follower_count": "285000",
      "creator_niche": "wellness",
      "lead_status": "NEW"
    }
  }'
```

Custom properties (`instagram_handle`, `follower_count`, `creator_niche`) must be created in HubSpot first: Settings → Properties → Contact Properties → Create Property.

### Create a Deal

```bash
curl -X POST "https://api.hubapi.com/crm/v3/objects/deals" \
  -H "Authorization: Bearer $HUBSPOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "properties": {
      "dealname": "Sarah Chen × GreenLeaf Collagen Q2 2026",
      "amount": "5000",
      "dealstage": "appointmentscheduled",
      "pipeline": "default",
      "closedate": "2026-06-30T00:00:00.000Z"
    }
  }'
```

Deal stage names depend on your pipeline configuration. Get stage IDs via `GET /crm/v3/pipelines/deals`.

### Associate a Deal with a Contact

HubSpot's CRM objects use separate associations:
```bash
curl -X PUT "https://api.hubapi.com/crm/v3/objects/deals/{deal_id}/associations/contacts/{contact_id}/deal_to_contact" \
  -H "Authorization: Bearer $HUBSPOT_TOKEN"
```

### Timeline Events — Log Custom Activity

HubSpot's Timeline Events API lets you log custom activity against a contact — useful for logging email sends, collab milestones, and content publication events from your external systems:

```bash
curl -X POST "https://api.hubapi.com/crm/v3/timeline/events" \
  -H "Authorization: Bearer $HUBSPOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventTemplateId": "your_event_template_id",
    "email": "sarah@example.com",
    "tokens": {
      "product_name": "GreenLeaf Collagen Powder",
      "content_url": "https://instagram.com/p/XXXXXXX",
      "gmv_attributed": "1247.00"
    },
    "timestamp": "2026-05-07T12:00:00Z"
  }'
```

### When to Migrate from ActiveCampaign to HubSpot

| Trigger | Implication |
|---|---|
| Team grows to 3+ people managing creator relationships | Multiple pipelines, team assignment, and pipeline reporting become critical |
| You need B2B company tracking (agencies, suppliers) | HubSpot's Companies object is much stronger than AC's account management |
| You need meeting scheduling integrated into outreach | HubSpot Sequences + meeting links > any AC equivalent |
| Revenue attributed to creator programs exceeds $500K/year | At this scale, you need real attribution reporting |
| You're managing 1,000+ active creator relationships | HubSpot's search, filtering, and dedup tooling scales better |

Below these thresholds: stay on ActiveCampaign or Supabase. The migration cost (data migration, workflow rebuild, team retraining) is not worth it until the thresholds are hit.

---

## 7. Creator/Influencer CRM Architecture

### What Data You Need to Track

Before choosing a tool, define the data model. A creator/influencer CRM for an Amazon brand needs to capture four categories of information:

**Contact identity:**
- Full name, email, phone
- Instagram handle + follower count + engagement rate
- TikTok handle + follower count
- YouTube channel + subscriber count
- Primary niche (wellness, tech, beauty, home, fitness, etc.)
- Location (country, city)
- Content language(s)
- Preferred contact channel (email, WhatsApp, DM)
- Contact source (manual, inbound inquiry, agency referral)

**Collaboration history:**
- Products sent (ASIN, product name, quantity, date)
- Discount codes assigned (code, expiry, commission rate)
- Content posted (URL, platform, post date, content type: reel, story, video, static)
- GMV attributed (total sales traced to their codes/links in the measurement period)
- Payment status and amounts (gifted, flat fee, commission)
- Content quality rating (internal)

**Communication log:**
- Every email sent (date, subject, template, sequence step)
- Every WhatsApp message sent
- Response received (date, channel, content summary)
- Current sequence status (active, paused, completed, opted out)
- CRM stage (Identified, Outreach Sent, Responded, Confirmed, Active, Review, Partner)

**Performance metrics:**
- Click-through rate on content links
- Conversion rate (clicks to purchases)
- Average order value from their audience
- Repeat purchase rate driven by their code
- Return rate on products sold through their channel

### Supabase Schema — Full SQL

This is the recommended schema for a Supabase-backed creator CRM. Run these migrations in order.

```sql
-- ============================================================
-- CREATORS TABLE
-- ============================================================
CREATE TABLE creators (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identity
    first_name          TEXT NOT NULL,
    last_name           TEXT,
    email               TEXT UNIQUE,
    phone               TEXT,
    email_status        TEXT DEFAULT 'active' 
                            CHECK (email_status IN ('active', 'bounced', 'unsubscribed', 'spam_report')),
    
    -- Contact preferences
    preferred_channel   TEXT DEFAULT 'email'
                            CHECK (preferred_channel IN ('email', 'whatsapp', 'instagram_dm', 'tiktok_dm')),
    
    -- Primary platform (denormalised for quick lookup)
    primary_platform    TEXT CHECK (primary_platform IN ('instagram', 'tiktok', 'youtube', 'blog')),
    primary_handle      TEXT,
    primary_followers   INTEGER,
    primary_eng_rate    NUMERIC(5,2),  -- stored as percentage: 3.45 = 3.45%
    
    -- Classification
    niche               TEXT,          -- wellness, tech, beauty, home, fitness, pets, etc.
    creator_tier        TEXT CHECK (creator_tier IN ('nano', 'micro', 'mid', 'macro', 'mega')),
    -- nano: <10k, micro: 10k-100k, mid: 100k-500k, macro: 500k-1M, mega: 1M+
    location_country    TEXT,
    location_city       TEXT,
    content_language    TEXT DEFAULT 'en',
    
    -- CRM status
    crm_stage           TEXT DEFAULT 'identified'
                            CHECK (crm_stage IN (
                                'identified', 'outreach_sent', 'responded',
                                'details_confirmed', 'product_shipped',
                                'content_live', 'under_review', 'long_term_partner',
                                'declined', 'blacklisted'
                            )),
    lead_score          INTEGER DEFAULT 0,  -- 0-100 scoring
    
    -- Attribution to tools
    klaviyo_profile_id  TEXT,
    activecampaign_id   TEXT,
    hubspot_contact_id  TEXT,
    
    -- Tracking
    source              TEXT,  -- 'manual', 'inbound_inquiry', 'agency', 'ai_prospecting'
    assigned_to         TEXT,  -- team member name or email
    internal_notes      TEXT,
    
    -- Timestamps
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    klaviyo_synced_at   TIMESTAMPTZ
);

-- Index for common queries
CREATE INDEX idx_creators_email ON creators(email);
CREATE INDEX idx_creators_crm_stage ON creators(crm_stage);
CREATE INDEX idx_creators_niche ON creators(niche);
CREATE INDEX idx_creators_tier ON creators(creator_tier);

-- ============================================================
-- CREATOR PLATFORMS (multiple platforms per creator)
-- ============================================================
CREATE TABLE creator_platforms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id      UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    platform        TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'twitter', 'pinterest', 'blog')),
    handle          TEXT NOT NULL,
    profile_url     TEXT,
    followers       INTEGER,
    following       INTEGER,
    avg_views       INTEGER,     -- average video/post views
    engagement_rate NUMERIC(5,2),
    verified        BOOLEAN DEFAULT FALSE,
    last_checked_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(creator_id, platform)
);

-- ============================================================
-- COLLABORATIONS (one record per collab engagement)
-- ============================================================
CREATE TABLE collaborations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id          UUID NOT NULL REFERENCES creators(id) ON DELETE RESTRICT,
    
    -- Product
    asin                TEXT NOT NULL,
    product_name        TEXT,
    
    -- Terms
    collab_type         TEXT CHECK (collab_type IN ('gifted', 'flat_fee', 'commission', 'affiliate', 'hybrid')),
    flat_fee_amount     NUMERIC(10,2),
    commission_rate     NUMERIC(5,2),   -- percentage: 10.00 = 10%
    discount_code       TEXT,
    tracking_url        TEXT,
    
    -- Logistics
    product_sent_at     DATE,
    product_sent_qty    INTEGER DEFAULT 1,
    tracking_number     TEXT,
    
    -- Content
    content_deadline    DATE,
    content_submitted_at DATE,
    content_url         TEXT,           -- final published URL
    content_type        TEXT CHECK (content_type IN ('reel', 'story', 'post', 'video', 'shorts', 'blog_post', 'ugc_raw')),
    content_quality     INTEGER CHECK (content_quality BETWEEN 1 AND 5),
    
    -- Performance (updated monthly or on demand)
    clicks              INTEGER DEFAULT 0,
    orders              INTEGER DEFAULT 0,
    revenue_attributed  NUMERIC(10,2) DEFAULT 0,
    refunds             INTEGER DEFAULT 0,
    measurement_period  TEXT,           -- 'Q1 2026', '30d', etc.
    last_measured_at    DATE,
    
    -- Payment
    payment_status      TEXT DEFAULT 'pending' 
                            CHECK (payment_status IN ('pending', 'approved', 'paid', 'disputed', 'cancelled')),
    payment_amount      NUMERIC(10,2),
    payment_date        DATE,
    invoice_url         TEXT,
    
    -- Status
    status              TEXT DEFAULT 'active' 
                            CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    notes               TEXT,
    
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_collaborations_creator ON collaborations(creator_id);
CREATE INDEX idx_collaborations_asin ON collaborations(asin);
CREATE INDEX idx_collaborations_status ON collaborations(status);

-- ============================================================
-- OUTREACH LOG (every contact event logged)
-- ============================================================
CREATE TABLE outreach_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id          UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    
    -- Channel and direction
    channel             TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'instagram_dm', 'tiktok_dm', 'phone', 'internal_note')),
    direction           TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
    
    -- Content
    subject             TEXT,   -- email subject line
    body_preview        TEXT,   -- first 500 chars of message body
    template_used       TEXT,   -- template name/ID
    sequence_step       INTEGER, -- which step in the sequence (1, 2, 3...)
    sequence_name       TEXT,   -- e.g., 'creator_outreach_q2_2026'
    
    -- Status tracking
    status              TEXT DEFAULT 'sent' 
                            CHECK (status IN ('draft', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed')),
    
    -- Provider tracking IDs
    sendgrid_message_id TEXT,
    postmark_message_id TEXT,
    whatsapp_wamid      TEXT,
    
    -- Timestamps
    sent_at             TIMESTAMPTZ,
    delivered_at        TIMESTAMPTZ,
    opened_at           TIMESTAMPTZ,
    clicked_at          TIMESTAMPTZ,
    replied_at          TIMESTAMPTZ,
    
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_outreach_log_creator ON outreach_log(creator_id);
CREATE INDEX idx_outreach_log_sequence ON outreach_log(sequence_name, sequence_step);
CREATE INDEX idx_outreach_log_sent_at ON outreach_log(sent_at DESC);

-- ============================================================
-- UPDATED_AT TRIGGER (keep updated_at current automatically)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER creators_updated_at 
    BEFORE UPDATE ON creators 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER collaborations_updated_at 
    BEFORE UPDATE ON collaborations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### When to Use Supabase CRM vs. Dedicated CRM

| Scenario | Recommendation |
|---|---|
| Under 300 creators, solo operator | Supabase + n8n sequences. No external CRM needed. |
| Under 500 creators, 1-2 people | Supabase + ActiveCampaign for email sequences. Supabase is the data source of truth. |
| 500–2,000 creators, 2-4 people | ActiveCampaign as primary CRM. Sync key data back to Supabase for analytics. |
| 2,000+ creators or 4+ person team | HubSpot Sales Hub. Full pipeline reporting, team assignment, meeting scheduling. |

The rule: **Supabase is always the data warehouse.** Even when you use ActiveCampaign or HubSpot as the operational CRM, Supabase stores the source-of-truth records and the performance analytics (GMV, clicks, orders) that the CRM tools don't handle well. The CRM handles pipeline state and communication sequences. Supabase handles business analytics.

---

## 8. n8n Integration Patterns

### SendGrid Node — Send Email + Handle Bounces

n8n has a native SendGrid node. Use it for straightforward sends; use HTTP Request for advanced patterns like dynamic template calls with custom headers.

**Native SendGrid node configuration:**
```
Node: SendGrid
Operation: Send Email
Resource: Mail
To: ={{ $json.email }}
From: partnerships@brand.com
From Name: GreenLeaf Partnerships
Subject: Your Creator Collab Details
HTML Body: ={{ $json.html_content }}
```

For dynamic templates (recommended), use HTTP Request:
```json
{
  "method": "POST",
  "url": "https://api.sendgrid.com/v3/mail/send",
  "headers": {
    "Authorization": "Bearer {{$credentials.sendgridApiKey}}",
    "Content-Type": "application/json"
  },
  "body": {
    "personalizations": [{
      "to": [{ "email": "={{$json.email}}", "name": "={{$json.first_name}}" }],
      "dynamic_template_data": {
        "first_name": "={{$json.first_name}}",
        "discount_code": "={{$json.discount_code}}",
        "product_name": "={{$json.product_name}}"
      }
    }],
    "from": { "email": "partnerships@brand.com", "name": "Brand Partnerships" },
    "template_id": "d-XXXXXXXXXXXXXXXXXXXXXXXX"
  }
}
```

**Bounce handler workflow:**
```
Webhook Trigger (SendGrid event webhook)
  → Filter: $json.event === "bounce"
  → Supabase Update: SET email_status = 'bounced' WHERE email = $json.email
  → ActiveCampaign Update: Update contact field emailStatus = bounced
  → (Optional) ClickUp Create Task: "Investigate bounce for {email}"
```

### Klaviyo Node — Add to List + Track Event

No native n8n Klaviyo node in the core library (there's a community one — quality varies). Use HTTP Request nodes consistently.

**Add to Klaviyo list pattern:**
```
HTTP Request — Create/Update Profile
  → IF: $json.statusCode === 409 (conflict = already exists)
    → Extract existing profile ID from $json.meta.duplicate_profile_id
  ELSE:
    → Extract new profile ID from $json.data.id
  → HTTP Request — Add profile to list
  → Supabase Update: SET klaviyo_profile_id = ..., klaviyo_synced_at = NOW()
```

**Track event to trigger flow:**
```json
POST https://a.klaviyo.com/api/events/
{
  "data": {
    "type": "event",
    "attributes": {
      "profile": { "data": { "type": "profile", "attributes": { "email": "={{ $json.email }}" } } },
      "metric": { "data": { "type": "metric", "attributes": { "name": "Creator Collab Activated" } } },
      "properties": {
        "product_name": "={{ $json.product_name }}",
        "discount_code": "={{ $json.discount_code }}"
      }
    }
  }
}
```

### HubSpot Node — Create/Update Contact + Deal

n8n's native HubSpot node covers most operations:

```
HubSpot Node
Operation: Create or Update Contact
Email: ={{ $json.email }}
Properties:
  firstname: ={{ $json.first_name }}
  lastname: ={{ $json.last_name }}
  instagram_handle: ={{ $json.instagram_handle }}
  creator_tier: ={{ $json.creator_tier }}
```

For creating and associating a deal:
```
HubSpot Node: Create Deal
  → properties.dealname: ={{ $json.first_name + ' × ' + $json.brand_name }}
  → properties.amount: ={{ $json.estimated_gmv }}
  → properties.dealstage: "outreachsent"
  → [store deal_id from response]
HubSpot Node: Create Association (Deal to Contact)
  → dealId: ={{ previously stored deal_id }}
  → contactId: ={{ contact_id }}
```

### Webhook Trigger on Email Opens → Update Supabase

This pattern captures engagement signals and keeps Supabase in sync with email platform events:

```
Webhook Trigger (POST endpoint — configure URL in SendGrid/Postmark webhook settings)
  → Split Out (each event in the array is processed separately)
  → Switch on event type:
      "open" →
        Supabase Update outreach_log:
          SET status = 'opened', opened_at = NOW()
          WHERE sendgrid_message_id = $json.sg_message_id
        Supabase Update creators:
          SET lead_score = lead_score + 5
          WHERE email = $json.email
      "click" →
        Supabase Update outreach_log:
          SET status = 'clicked', clicked_at = NOW()
          WHERE sendgrid_message_id = $json.sg_message_id
        Supabase Update creators:
          SET lead_score = lead_score + 10, crm_stage = 'responded'
          WHERE email = $json.email
      "bounce" →
        Supabase Update creators:
          SET email_status = 'bounced', crm_stage = 'declined'
          WHERE email = $json.email
      "spam_report" →
        Supabase Update creators:
          SET email_status = 'spam_report'
          WHERE email = $json.email
        Slack: Notify team of spam report (for reputation monitoring)
```

### Sequence Execution Pattern — Full Outreach Flow

The complete creator outreach sequence in n8n:

```
WORKFLOW: Creator Outreach Sequencer

Schedule Trigger: Every day at 9:00 AM

Step 1 — Get creators due for outreach
  Supabase: SELECT * FROM creators c
    LEFT JOIN outreach_log o ON c.id = o.creator_id
    WHERE c.crm_stage = 'identified'
      AND c.email_status = 'active'
      AND (o.sent_at IS NULL OR MAX(o.sent_at) < NOW() - INTERVAL '5 days')
      AND c.email NOT IN (SELECT email FROM creators WHERE email_status != 'active')
    GROUP BY c.id
    HAVING COUNT(o.id) < 3  -- max 3 touches

Step 2 — Determine which step to send
  Code node: Assign sequence_step based on outreach count

Step 3 — Switch on sequence_step
  Step 1 → Send initial pitch email via SendGrid template d-XXXXX
  Step 2 → Send follow-up email via SendGrid template d-YYYYY
  Step 3 → Send final touch email via SendGrid template d-ZZZZZ

Step 4 — Log to Supabase
  INSERT INTO outreach_log (creator_id, channel, direction, template_used, sequence_step, status, sent_at)
  VALUES (...)

Step 5 — Update creator stage if step 1
  UPDATE creators SET crm_stage = 'outreach_sent' WHERE id = ...
```

---

## 9. Creator Outreach Email Sequences

### Principles Before Templates

**Rule 1: Under 150 words per email.** Creators get dozens of pitches. Long pitches signal you don't respect their time. Short, specific, credible pitches get responses.

**Rule 2: The first line must not be about you.** Open with a specific reference to their content — a recent post, a niche you noticed, an aesthetic you admire. Generic openers ("I love your content!") are immediately recognized as bulk outreach.

**Rule 3: Make the ask clear.** Don't bury the CTA. Every pitch email should end with a single, obvious next step: "Would you be open to a collaboration?" or "Reply if interested and I'll send details."

**Rule 4: The product must be relevant.** A wellness creator getting pitched a gaming chair is a waste of everyone's time and damages sender reputation. Match the product to the niche before the workflow fires.

**Rule 5: Follow-ups are not reminders.** Each follow-up must add something new — a different angle, new information, social proof — not just "bumping this to the top of your inbox."

### Initial Pitch Template

**Subject lines that perform:**
- `{{first_name}} — {{brand_name}} collab for your {{niche}} audience?`
- `Quick collab idea for your {{platform}} community`
- `{{product_name}} x {{first_name}} — paid collab`
- `Free {{product_name}} + {{commission_rate}}% commission — interested?`

**Body:**
```
Hi {{first_name}},

Caught your [recent reel / recent post about X / series on Y] — love how you 
approach {{niche}} content for your audience.

I'm reaching out from {{brand_name}}. We make {{product_name}} and think your 
audience would genuinely love it ({{specific_reason_why}}).

We're offering:
• A free {{product_name}} to try
• {{commission_rate}}% commission on all sales from your unique code
• {{flat_fee}} flat fee for one dedicated post (optional)

No crazy requirements — one post or reel within {{content_deadline_days}} days 
of receiving the product.

Interested? Just reply and I'll send over the details.

{{sender_first_name}}
{{brand_name}} Partnerships
```

**Personalisation variables to pull from Supabase:**
- `{{first_name}}` — creator first name
- `{{niche}}` — creator niche (wellness, fitness, tech, etc.)
- `{{brand_name}}` — brand name
- `{{product_name}}` — product being pitched
- `{{commission_rate}}` — commission percentage
- `{{flat_fee}}` — flat fee if applicable
- `{{content_deadline_days}}` — e.g., "30 days"
- `{{specific_reason_why}}` — requires a human or AI-generated line (not templatable at scale; consider having Claude generate this per creator via n8n + AI node)

### Follow-Up 1 (Day 5 — Soft Bump)

**Subject:** `Re: {{brand_name}} collab — a quick note`

```
Hi {{first_name}},

Just checking if my last email landed — inboxes get busy.

Quick addition: we've had creators in the {{niche}} space seeing 
{{social_proof_stat}} (e.g., "average 8% conversion from their audience") 
with this product. It tends to do well with audiences that care about {{niche_angle}}.

Still happy to send details if you're curious — no pressure.

{{sender_first_name}}
```

### Follow-Up 2 (Day 10 — Final Touch)

**Subject:** `Last note from {{brand_name}}`

```
Hi {{first_name}},

I won't keep following up after this — I know you're busy.

Last thought: if the timing isn't right for a collab now but might be in 
the future, I'm happy to stay in touch. And if you know another creator 
in the {{niche}} space who might be a better fit, a referral is always 
appreciated (and we reward them).

Wishing you a great {{current_month}}.

{{sender_first_name}}
{{brand_name}} Partnerships
```

### Collab Active — Welcome Email (Sent After Confirmation)

**Subject:** `Welcome to the {{brand_name}} creator program, {{first_name}}! 🎉`

```
Hi {{first_name}},

Your collaboration with {{brand_name}} is officially active. Here's everything 
you need:

YOUR DETAILS:
• Discount code: {{discount_code}} ({{commission_rate}}% commission on all sales)
• Amazon tracking link: {{tracking_link}}
• Commission rate: {{commission_rate}}% — tracked monthly, paid by {{payment_day}}
• Content deadline: {{content_deadline}}

WHAT WE NEED FROM YOU:
• 1x {{content_type}} featuring {{product_name}}
• Tag @{{brand_instagram_handle}} and use #{{brand_hashtag}}
• Post the link when it goes live!

Your product ships within 3–5 business days to: {{shipping_address_summary}}

Content brief attached (optional guidance — feel free to make it your own).

Questions? Reply to this email or message {{sender_first_name}} directly.

Excited to work with you!
{{sender_first_name}}
{{brand_name}} Partnerships
```

### Post-Collab — Performance Review + Re-Pitch

**Subject:** `Your {{brand_name}} collab results + what's next`

**Timing:** 30 days after content goes live

```
Hi {{first_name}},

Your {{brand_name}} collaboration has been live for a month — here's how 
it performed:

RESULTS:
• Clicks on your tracking link: {{clicks}}
• Orders attributed: {{orders}}
• Revenue generated: ${{revenue_attributed}}
• Your commission earned: ${{commission_earned}}

{{#if above_average}}
You outperformed our average creator by {{outperformance_pct}}% — 
your audience is a great fit for our product.
{{/if}}

We'd love to continue working together. Options for Round 2:
• New product: {{new_product_name}} (just launched)
• Increased commission: {{new_commission_rate}}%
• {{#if flat_fee_offered}}Paid post: ${{flat_fee_amount}} flat fee{{/if}}

Interested in continuing? Just reply — happy to set it up.

{{sender_first_name}}
```

---

## 10. Deliverability Fundamentals

### Why Deliverability Matters More Than You Think

You can write the perfect outreach email, set up flawless n8n automation, and build a beautiful creator CRM — and it all fails if your emails land in spam. Deliverability is not a detail. For creator outreach at scale (sending hundreds of personalized emails per day), it's foundational infrastructure.

### DNS Authentication — The Non-Negotiables

Three DNS records protect your sender reputation and prove to receiving mail servers that your emails are legitimate. All three must be set up before you send at scale.

**SPF (Sender Policy Framework)**

SPF tells receiving servers which IP addresses are authorized to send email on behalf of your domain. Without SPF, emails appear unauthenticated and are more likely to be flagged as spam.

```dns
Type: TXT
Host: @  (or your domain)
Value: v=spf1 include:sendgrid.net include:klaviyo.com ~all
```

If using SendGrid: `include:sendgrid.net`
If using Klaviyo: `include:klaviyo.com`
If using Postmark: `include:spf.mtasv.net`

**Critical rule:** You can have only one SPF record per domain. If you need multiple sending services, combine them in a single record:
```
v=spf1 include:sendgrid.net include:klaviyo.com include:spf.mtasv.net ~all
```

The `~all` (softfail) is preferred over `-all` (hardfail) for initial setup. Switch to `-all` once you've confirmed all your legitimate sending sources are included.

**DKIM (DomainKeys Identified Mail)**

DKIM adds a cryptographic signature to every email, proving it wasn't tampered with in transit and that it genuinely came from your domain. Both SendGrid and Klaviyo provide DKIM as CNAME records you add to your DNS.

**SendGrid DKIM setup:**
SendGrid provides two CNAME records:
```dns
Type: CNAME
Host: em1234.yourdomain.com
Value: u1234567.wl123.sendgrid.net

Type: CNAME  
Host: s1._domainkey.yourdomain.com
Value: s1.domainkey.u1234567.wl123.sendgrid.net
```

Exact records are generated in SendGrid → Settings → Sender Authentication → Authenticate Your Domain.

**Klaviyo DKIM setup:**
Klaviyo provides similar CNAMEs in Account → Settings → Email → Domain. Add both and verify.

**DMARC (Domain-based Message Authentication, Reporting & Conformance)**

DMARC tells receiving servers what to do when an email fails SPF or DKIM checks, and where to send reports. Start permissive (`p=none`) and move to enforcement (`p=quarantine` or `p=reject`) after reviewing reports.

```dns
Type: TXT
Host: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc-reports@yourdomain.com; ruf=mailto:dmarc-forensics@yourdomain.com; fo=1
```

DMARC reporting emails come from external services like Google, Yahoo, and Microsoft — they send XML reports of authentication activity. Use a DMARC monitoring tool (Postmark's free DMARC report parser, Google Postmaster Tools, or dmarcian) to parse them.

**Move to enforcement after 30 days:**
```
v=DMARC1; p=quarantine; pct=50; rua=mailto:dmarc-reports@yourdomain.com
```
Then eventually:
```
v=DMARC1; p=reject; rua=mailto:dmarc-reports@yourdomain.com
```

### New Domain Warm-Up

A brand-new sending domain has no reputation. If you start blasting 500 emails/day on day one, major email providers (Gmail, Outlook, Yahoo) will flag your domain as suspicious and route everything to spam.

**Warm-up schedule:**

| Day | Max Emails |
|---|---|
| 1-3 | 25–50/day |
| 4-7 | 50–100/day |
| 8-14 | 100–200/day |
| 15-21 | 200–500/day |
| 22-30 | 500–1,000/day |
| 31-45 | 1,000–3,000/day |
| 46+ | Scale based on clean list and engagement data |

**Warm-up rules:**
- Start with your cleanest, most engaged contacts first (existing relationships, not cold prospects)
- Monitor spam complaint rate — if it exceeds 0.1% (1 in 1,000 emails), pause and investigate
- Monitor bounce rate — if hard bounces exceed 2%, stop and clean the list
- Use Google Postmaster Tools and Yahoo Postmaster to monitor domain reputation in real-time (both are free)

**Postmaster Tools setup:**
1. Google Postmaster: `postmaster.google.com` → Add domain → Add TXT record to DNS for verification
2. Yahoo Postmaster: `senders.yahooinc.com` → Register → Add TXT record

Both show domain reputation (High / Medium / Low / Bad), spam rate trends, and IP reputation — invaluable for warm-up monitoring.

### Engagement-Based Deliverability

After warm-up, ongoing deliverability depends on engagement. Email providers watch:

- **Open rate:** Above 20% is healthy. Below 10% is a signal of list quality problems.
- **Click rate:** Above 2% is good.
- **Spam complaint rate:** Below 0.1% is safe. Above 0.3% triggers throttling or blocks.
- **Unsubscribe rate:** Below 0.5% is normal. Above 1% signals list mismatch or excessive frequency.

Practical rules:
- Remove contacts who haven't opened in 6 months before they drag your reputation down
- Suppress bounced addresses immediately
- Send at consistent times (not all at once — randomize send times across a window)
- Use custom engagement-based segments in Klaviyo to suppress unengaged contacts from campaigns

---

## 11. Amazon Buyer-Seller Messaging Rules

### What Amazon Allows (and Doesn't)

Amazon's Buyer-Seller Messaging policy is the critical constraint every Amazon brand must internalize. Violating it risks account suspension. The rules are strict and actively enforced.

**Permitted messages (the short list):**
- Responding to a buyer's question about their order
- Providing shipping tracking information when the buyer asked
- Resolving an order issue (return, refund, replacement)
- Sending required regulatory or warranty information
- Proactive delivery notifications (only for orders with potential shipping issues)

**Prohibited messages (the longer and more important list):**
- Review requests or incentivized feedback of any kind (other than via Amazon's own Request a Review button)
- Marketing messages, promotions, or discount codes
- Links to any website other than Amazon (with very limited exceptions like safety documentation)
- Links to social media
- Requests to contact you outside of Amazon's messaging system
- References to your DTC store or any external channel
- Messages that include external images (tracked pixels for open rates are also prohibited)
- Any message that feels like marketing or a sales pitch

### The Request a Review Button

Amazon's Request a Review feature is the only legitimate way to solicit reviews. It:
- Sends a standardized, Amazon-designed email to the buyer
- Cannot be customized with your own text
- Can be sent once per order, between 5 and 30 days after the order's estimated delivery date
- Can be triggered manually in Seller Central or automatically via the SP-API

**Automating via SP-API:**
```bash
POST /messaging/v1/orders/{amazonOrderId}/messages/requestReview

Headers:
  x-amz-access-token: {access_token}
  Content-Type: application/json

Body: {}  (no customizable body — Amazon handles the content)
```

This is a fire-and-forget call. Amazon validates the order is in the eligible window and sends the email. Log the call in Supabase with the order ID and timestamp to prevent duplicate requests.

### Consequences of Violations

Amazon monitors Buyer-Seller Messages and takes complaints from buyers seriously.

First offense: Warning + message removal
Second offense: Messaging privileges suspended (cannot use Buyer-Seller Messaging at all)
Third offense: Account suspension risk

Beyond the policy violations, any message that feels like marketing will generate spam reports from buyers — which Amazon tracks separately and can trigger listing suppression or account reviews.

### The Legitimate Alternative Stack

Since Amazon restricts direct customer email, build the DTC channel as the legitimate email acquisition path:

1. Include an insert card in every Amazon package (permitted by Amazon policy) with a short URL to your DTC site or a QR code leading to a lead magnet (product guide, recipe book, discount on next order from your Shopify store)
2. Capture email on DTC site with strong incentive
3. Add to Klaviyo
4. Run full post-purchase, winback, and loyalty flows via Klaviyo on the DTC channel

This is the standard play for Amazon brands building email lists legally.

---

## 12. CAN-SPAM & GDPR Compliance for Creator Outreach

### CAN-SPAM (US) — The Basics

CAN-SPAM applies to commercial email sent from US businesses or to US recipients. For creator outreach, the relevant rules:

**Required in every email:**
1. Accurate "From," "To," and "Reply-To" information (no spoofed headers)
2. Non-deceptive subject lines (subject must match email content)
3. Identification as an advertisement if it's promotional (for creator outreach, a disclosure isn't typically required since it's a business-to-business pitch, not a consumer ad)
4. **Physical postal address** — a valid street address, PO box, or private mailbox registered with a commercial mail receiving agency
5. **Clear and conspicuous unsubscribe mechanism** — must be honored within 10 business days

**Unsubscribe mechanism options:**
- A one-click unsubscribe link (simplest, recommended)
- A reply-to-unsubscribe option (reply with "STOP" — must be monitored)

For creator outreach sequences, include in the email footer:
```
GreenLeaf Brands, LLC | 123 Main St, Suite 100, Los Angeles, CA 90001
Not interested? [Unsubscribe](https://yourdomain.com/unsubscribe?email={{email}}&token={{unsubscribe_token}})
```

The unsubscribe link must work. Build a simple endpoint in Supabase Edge Functions or n8n that sets `email_status = 'unsubscribed'` for that address.

### GDPR (EU/UK) — Key Considerations for Creator Outreach

GDPR applies when you're contacting people in the EU or UK, or if you're an EU/UK business. For creator outreach (B2B context), the rules are more permissive than for consumer marketing.

**Legal basis for B2B outreach:**

**Legitimate Interests** (Article 6(1)(f)) is the standard legal basis for B2B cold outreach to business contacts. The argument: you have a legitimate commercial interest in reaching out to professionals (creators) who publicly market their services, and contacting them about a relevant business opportunity is a proportionate use of their professional contact information.

This basis holds when:
- The contact is a business professional (creator/influencer running a business)
- Their contact information is publicly available (public email on their profile, in their bio, or on their media kit)
- The subject matter is relevant to their professional activities
- The communication is not overly intrusive (1-3 touch sequence, not 10 emails over a month)

**Legitimate Interests does NOT justify:**
- Contacting private individuals (non-business consumers) without explicit consent
- Sending to personal email addresses that aren't publicly listed for business purposes
- Marketing products unrelated to the contact's business activities

**GDPR documentation you should maintain:**
- A Legitimate Interests Assessment (LIA) — a simple internal document arguing why your outreach meets the LI test
- A privacy policy that covers how you process creator data
- Your retention policy (how long you keep creator contact data)

**Subject Rights:** GDPR gives data subjects (including creators) the right to request erasure ("right to be forgotten"). Build a process: if a creator emails requesting data deletion, your n8n workflow should delete their record from Supabase, remove from Klaviyo/ActiveCampaign, and confirm in writing.

### Opt-In Best Practices

Even where legally optional, getting explicit consent improves deliverability and relationship quality:

- When creators respond positively to your outreach, include a line in your confirmation: "By proceeding with this collaboration, you agree to receive occasional updates and performance reports from us. You can unsubscribe at any time."
- For DTC consumer email: always use double opt-in. Single opt-in has higher bounce and complaint rates.
- Store opt-in timestamp, source, and the exact consent language in Supabase.

---

## 13. Cost Comparison at Volume

### Monthly Cost by Platform at Key Volume Thresholds

The table below compares the cost of running each platform at different email volumes. This assumes email-only (no SMS) and uses published 2025/2026 pricing.

**At 1,000 contacts / ~10,000 emails per month:**

| Platform | Monthly Cost | Notes |
|---|---|---|
| SendGrid Essentials | $19.95 | 50,000 emails/month included. Transactional only. |
| Postmark | $15.00 | 10,000 emails included. No contact limits. |
| Klaviyo | $45–$60 | ~1,000 contacts plan. Includes marketing flows + campaigns. |
| Mailchimp | $20–$30 | Standard plan at 1,000 contacts. Feature-limited vs. Klaviyo. |
| ActiveCampaign Starter | $15 | Basic automation only; no deal pipeline (need Plus at $49). |

**At 10,000 contacts / ~100,000 emails per month:**

| Platform | Monthly Cost | Notes |
|---|---|---|
| SendGrid Pro 100K | $34.95 | Shared IP. Dedicated IP requires Pro ($89.95+). |
| Postmark | $75.00 | 100,000 emails. Message streams included. |
| Klaviyo | $400–$500 | 10,000 contact plan. Flows, segmentation, A/B testing. |
| Mailchimp | $300–$350 | Standard plan at 10,000 contacts. Attribution weaker than Klaviyo. |
| ActiveCampaign Plus | ~$135 | 10,000 contacts. CRM deals, landing pages. |
| HubSpot Marketing Starter | $800+ | 10,000 contacts on paid plan. Powerful but expensive. |

**At 50,000 contacts / ~500,000 emails per month:**

| Platform | Monthly Cost | Notes |
|---|---|---|
| SendGrid Pro | $249+ | 300,000 emails; scale further with volume plans. |
| Postmark | $275 | Includes all features. No contact limits. |
| Klaviyo | ~$1,500–2,000 | Pricing customized at this scale. |
| Mailchimp | ~$700+ | Standard plan pricing at this scale. |
| ActiveCampaign | Custom | Enterprise pricing at 50k contacts. |

**Key takeaways:**
- For pure transactional volume (system emails, alerts), Postmark wins on price and deliverability at all scales
- For DTC marketing flows, Klaviyo is expensive but earns it back in revenue attribution — brands consistently report 20-30% of DTC revenue attributed to Klaviyo flows
- Mailchimp is the "safe" brand-name choice but consistently outperformed by Klaviyo on ecommerce features; not recommended for new setups
- SendGrid is the right choice for transactional at scale when you don't need Postmark's message streams
- ActiveCampaign is the right choice when you need CRM deal pipelines without the cost of HubSpot

---

## 14. WhatsApp ↔ Email Channel Coordination

### When to Use Email vs. WhatsApp

The two channels are complementary, not competitive. They serve different moments in the creator relationship:

| Situation | Channel | Reason |
|---|---|---|
| Initial cold outreach (no prior relationship) | **Email** | More professional, less intrusive. WhatsApp cold messages feel aggressive. |
| Formal proposal or collaboration terms | **Email** | Creates a written record. Easier to attach a brief or PDF. |
| Contract or legal document | **Email** | DocuSign, PDF attachments. Clear chain of record. |
| Quick reply to a creator who messaged you first | **WhatsApp** | Match the channel they initiated on. |
| Casual relationship maintenance check-in | **WhatsApp** | Higher response rates for informal touch. "Hey, how's the reel coming along?" |
| Performance report (data-heavy) | **Email** | Numbers, tables, and charts render poorly in WhatsApp. |
| Urgent shipping or logistics update | **WhatsApp** | Higher read rates, faster responses. |
| Collab confirmation (formal) | **Email** | Creates a formal record; attach brief and terms. |
| Post-confirmation onboarding details | **WhatsApp** | More casual, humanizes the brand. Often a short follow-up to the email. |
| Negotiating terms | **Email** (start) → **WhatsApp** (finalize) | Start formally for record-keeping; switch to WhatsApp if they prefer. |

### The Coordination Pattern

**Rule:** Email creates the formal record. WhatsApp maintains the relationship.

When a creator confirms interest via email, follow up on WhatsApp with a warm, brief message: "Hey Sarah! Just sent you the collaboration details by email — let me know if you have any questions! Excited to work together."

This two-channel confirmation (email for the record + WhatsApp for the human touch) achieves better engagement rates than either channel alone.

**In Supabase, track both channels per creator:**
- `preferred_channel` — where they respond best
- `email_status` — deliverability health
- `whatsapp_status` — opt-in status and window state

**In n8n, route based on `preferred_channel`:**
```
Switch on creator.preferred_channel:
  "email" → SendGrid template
  "whatsapp" → WhatsApp Cloud API template
  "both" → Send email first, WhatsApp 2 hours later
```

### Handling Replies Across Channels

The hardest part of multi-channel outreach: when a creator replies on WhatsApp but your sequence is sending emails, or vice versa. The sequence must pause across both channels when any reply is received.

**Implementation:**
- WhatsApp inbound webhook → n8n → `UPDATE creators SET crm_stage = 'responded', sequence_paused = TRUE`
- SendGrid "reply received" event (email `replied_at` set when creator replies to tracked email) → n8n → same Supabase update
- Sequence executor: always check `sequence_paused = FALSE` before sending next message in any channel

---

## 15. Dos & Don'ts

### ✅ DOs

1. **Do set up SPF, DKIM, and DMARC before sending a single email from your brand domain.** These three records take 30 minutes to configure and protect your domain reputation from day one. Retroactively fixing a damaged domain reputation takes months.

2. **Do warm new sending domains gradually.** Start at 25–50 emails per day, doubling weekly. A new domain that jumps to 500/day on day one will be flagged by Gmail and Outlook as suspicious and route everything to spam.

3. **Do use Postmark for critical transactional email (collab confirmations, invoices, contracts) and keep it strictly separate from marketing sends.** Message Streams exist for a reason — protect your transactional reputation from marketing volatility.

4. **Do sync email status events (bounces, spam reports, unsubscribes) back to Supabase immediately.** The worst pattern is sending 5 sequence emails to a bounced address because your CRM didn't know. Webhook → Supabase update should happen within seconds of the event.

5. **Do use dynamic templates stored in SendGrid or Postmark** rather than constructing HTML email bodies in n8n Code nodes. Template management in the platform is easier to maintain, allows non-technical preview and editing, and doesn't expose HTML in your workflow configuration.

6. **Do check `crm_stage` and `sequence_paused` before every sequence step.** A creator who replied and is in active negotiation should never receive an automated follow-up. This check must happen at the moment of send, not when the sequence was last configured.

7. **Do store the opt-in timestamp, consent language, and source for every contact you add to a marketing list.** GDPR enforcement is growing. "We had their consent" is not a defense. "We collected consent at 2026-03-15T14:22:00Z via form submission on landing page /collab-program with the text: 'Sign up to receive collaboration opportunities from GreenLeaf'" is a defense.

8. **Do monitor Google Postmaster Tools and Yahoo Postmaster weekly** during ramp-up and monthly during steady state. These are free tools that show your domain reputation in real time. Catching a reputation drop early (before you're blocked) gives you time to investigate.

9. **Do use email for formal proposals and WhatsApp for relationship maintenance.** The channel mismatch is real — sending a detailed collaboration brief on WhatsApp loses information, and sending a quick "how are you?" on email feels cold and corporate.

10. **Do A/B test subject lines before scaling.** Send two variants to 20% each of your list, let Klaviyo determine the winner by open rate after 4 hours, then send the winner to the remaining 60%. A 5-point improvement in open rate compounds significantly at scale.

11. **Do version your email templates.** Name them `creator_outreach_pitch_v1`, `creator_outreach_pitch_v2` — never edit a template in place if sequences are currently running from it. Editing a live template can retroactively change what future steps in a sequence look like.

12. **Do use subdomain sending for marketing email** (`email.yourdomain.com` or `marketing.yourdomain.com`) to isolate marketing reputation from your primary domain reputation (`yourdomain.com`). This protects your core domain's deliverability even if a marketing campaign goes sideways.

---

### ❌ DON'Ts

1. **Don't send Amazon customer emails via Buyer-Seller Messaging for anything other than order-related support.** Not discount codes, not review requests, not product launches. This gets accounts suspended. The only legitimate review mechanism is Amazon's own Request a Review button.

2. **Don't use a free Gmail or Yahoo address as your sending address for creator outreach.** `partnerships@brand.com` gets opened. `brand_collab_2026@gmail.com` gets marked as spam. Domains are cheap. Set one up.

3. **Don't put all your sending volume on a single domain.** If that domain gets blacklisted (one bad campaign, one spam spike), all your email — transactional and marketing — is compromised. Separate transactional from marketing at the domain or subdomain level.

4. **Don't hardcode API keys in n8n workflows.** Use n8n's credential store for SendGrid API keys, Klaviyo API keys, and Postmark server tokens. Hardcoded keys appear in workflow exports, logs, and version history.

5. **Don't buy email lists for creator outreach.** Purchased lists have abysmal deliverability, are full of fake or inactive addresses, will spike your bounce rate above 5% immediately (which triggers SendGrid/Postmark account review), and often contain spam traps. Build your lists organically or through social media scraping of publicly listed business emails.

6. **Don't ignore unsubscribe requests or delay honoring them.** CAN-SPAM requires honoring unsubscribes within 10 business days. GDPR requires immediate action. Build your unsubscribe endpoint to update Supabase instantly. Any delay is a legal liability.

7. **Don't send the same outreach template to 500 creators in a single batch.** ISPs flag high-volume identical sends as spam even if your domain is healthy. Randomize sending times across a 4-8 hour window, personalize at least the first line, and stagger sends by niche or region.

8. **Don't use open tracking pixels in Amazon Buyer-Seller Messages.** This is explicitly prohibited by Amazon's messaging policy. External image loading is not permitted. Violations result in messaging suspension.

9. **Don't use Klaviyo for B2B creator outreach sequences.** Klaviyo's data model is consumer-centric — profiles, lists, and flows are designed for consumer marketing. Creator outreach needs deal pipelines, stage tracking, and B2B context. Use ActiveCampaign, HubSpot, or Supabase + SendGrid instead.

10. **Don't skip the unsubscribe footer to "save space" or "look cleaner."** It's legally required under CAN-SPAM for any commercial email. It also reduces spam complaints (people who can easily opt out don't need to mark you as spam). The compliance risk of omitting it far outweighs any aesthetic preference.

11. **Don't treat bounce rate as a vanity metric.** A 5% hard bounce rate means your list has serious quality problems. SendGrid will suspend your account if sustained bounce rates exceed their threshold. Clean your list before sending, not after.

12. **Don't send more than 3 unsolicited outreach touches to a creator who hasn't responded.** Three touches over 10 days is the industry norm for creator prospecting. Four or more touches without a response signals that you're a pest, damages the brand's reputation among creator communities, and generates spam complaints. Mark as `crm_stage = 'no_response'` after 3 touches and move on.

---

## 16. Quick Reference Cheat Sheet

### API Base URLs

| Service | Base URL | Auth Header |
|---|---|---|
| Klaviyo | `https://a.klaviyo.com/api/` | `Authorization: Klaviyo-API-Key KEY` + `revision: 2024-10-15` |
| SendGrid | `https://api.sendgrid.com/v3/` | `Authorization: Bearer API_KEY` |
| Postmark | `https://api.postmarkapp.com/` | `X-Postmark-Server-Token: TOKEN` |
| ActiveCampaign | `https://{account}.api-us1.com/api/3/` | `Api-Token: KEY` |
| HubSpot | `https://api.hubapi.com/crm/v3/` | `Authorization: Bearer PRIVATE_APP_TOKEN` |

### Key Endpoints Quick Reference

```bash
# Klaviyo — Create/update profile
POST https://a.klaviyo.com/api/profiles/

# Klaviyo — Add to list
POST https://a.klaviyo.com/api/lists/{LIST_ID}/relationships/profiles/

# Klaviyo — Track event
POST https://a.klaviyo.com/api/events/

# SendGrid — Send email
POST https://api.sendgrid.com/v3/mail/send

# SendGrid — Get bounces
GET https://api.sendgrid.com/v3/suppression/bounces

# Postmark — Send email
POST https://api.postmarkapp.com/email

# Postmark — Send with template
POST https://api.postmarkapp.com/email/withTemplate

# ActiveCampaign — Create contact
POST https://{account}.api-us1.com/api/3/contacts

# ActiveCampaign — Create deal
POST https://{account}.api-us1.com/api/3/deals

# ActiveCampaign — Move deal stage
PUT https://{account}.api-us1.com/api/3/deals/{id}

# ActiveCampaign — Add tag to trigger automation
POST https://{account}.api-us1.com/api/3/contactTags

# HubSpot — Create contact
POST https://api.hubapi.com/crm/v3/objects/contacts

# HubSpot — Create deal
POST https://api.hubapi.com/crm/v3/objects/deals

# Amazon SP-API — Request Review
POST /messaging/v1/orders/{amazonOrderId}/messages/requestReview
```

### Creator Outreach Sequence Timing

| Step | Channel | Timing | Template |
|---|---|---|---|
| 1 | Email | Day 0 | Initial pitch (under 150 words) |
| 2 | Email | Day 5 | Soft bump + social proof |
| 3 | Email | Day 10 | Final touch + referral ask |
| — | — | Day 11+ | Mark as `no_response`, stop |
| Confirm | Email | On reply | Welcome email + details |
| Follow | WhatsApp | 2 hrs after confirm email | Warm confirmation |
| Post-collab | Email | 30 days after content live | Performance report + re-pitch |

### DNS Deliverability Checklist

| Record | Status to Verify |
|---|---|
| SPF | `dig TXT yourdomain.com` — should contain `v=spf1 include:...` |
| SendGrid DKIM | `dig CNAME em1234.yourdomain.com` — should resolve |
| Klaviyo DKIM | Verify in Klaviyo Account → Settings → Email → Domain |
| DMARC | `dig TXT _dmarc.yourdomain.com` — should contain `v=DMARC1` |
| Google Postmaster | `postmaster.google.com` — domain registered and verified |

### CRM Decision Tree

```
How many active creators?
  < 300 → Supabase + n8n sequences + SendGrid
  300–1000 → ActiveCampaign Plus + Supabase (analytics layer)
  > 1000 or team 3+ → HubSpot Sales Hub + Supabase

Email volume type?
  Transactional/system → Postmark or SendGrid
  DTC marketing flows → Klaviyo
  Creator outreach sequences → SendGrid or Postmark + n8n

Need marketing automation flows?
  Consumer (DTC) → Klaviyo
  B2B (creators) → ActiveCampaign or HubSpot Sequences
```

### Suppression Check Before Sending

Always run this Supabase query before a batch send to avoid sending to bounced, unsubscribed, or spam-reported addresses:

```sql
SELECT id, email, first_name, crm_stage
FROM creators
WHERE id = ANY($1::uuid[])
  AND email_status = 'active'
  AND crm_stage NOT IN ('declined', 'blacklisted', 'no_response')
  AND sequence_paused = FALSE
  AND email IS NOT NULL;
```

Only send to creators returned by this query.
