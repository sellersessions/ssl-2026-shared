# Webhook & Event-Driven Architecture — Expert Reference

> **Scope:** The complete practitioner's guide to event-driven architecture for Amazon seller operations — specifically connecting SP-API real-time notifications through AWS SQS into n8n and Supabase for automated responses. This is the architecture layer that sits on top of [amazon-sp-api.md](./amazon-sp-api.md), [n8n-skill-research.md](./n8n-skill-research.md), and [supabase.md](./supabase.md). Read those first if you're new to the stack.
>
> **System context:** syncflow — an AI agent platform that builds automation modules for Amazon sellers. The patterns here are production-grade for a seller doing 500–5,000 orders/month.

---

## Table of Contents

1. [Why Event-Driven Beats Polling for Amazon Operations](#1-why-event-driven-beats-polling-for-amazon-operations)
2. [SP-API Notifications API — Complete Reference](#2-sp-api-notifications-api--complete-reference)
3. [Notification Delivery Options — SQS vs EventBridge vs SNS](#3-notification-delivery-options--sqs-vs-eventbridge-vs-sns)
4. [AWS SQS Setup — Step by Step](#4-aws-sqs-setup--step-by-step)
5. [n8n + SQS Integration](#5-n8n--sqs-integration)
6. [n8n Webhook Node — Inbound Webhooks (Non-SQS)](#6-n8n-webhook-node--inbound-webhooks-non-sqs)
7. [Supabase as Event Store](#7-supabase-as-event-store)
8. [The Standard Pipeline Pattern — End to End](#8-the-standard-pipeline-pattern--end-to-end)
9. [Specific Pipeline Implementations](#9-specific-pipeline-implementations)
10. [Idempotency Patterns](#10-idempotency-patterns)
11. [Error Handling & Reliability](#11-error-handling--reliability)
12. [Monitoring Event Pipelines](#12-monitoring-event-pipelines)
13. [Cost Considerations](#13-cost-considerations)
14. [Webhook Security for Inbound Webhooks](#14-webhook-security-for-inbound-webhooks)
15. [Common Pitfalls](#15-common-pitfalls)
16. [Dos & Don'ts](#16-dos--donts)
17. [Quick Reference Cheat Sheet](#17-quick-reference-cheat-sheet)
18. [Useful Links](#18-useful-links)

---

## 1. Why Event-Driven Beats Polling for Amazon Operations

### The Core Problem with Polling

Polling means asking "has anything changed?" on a schedule. Event-driven means being told "something just changed" the moment it happens. For Amazon seller operations, the difference is not just philosophical — it has direct business impact.

### Latency Comparison

| Approach | Best-case latency | Typical latency | Worst-case latency |
|---|---|---|---|
| Polling every 5 min | ~0 sec (event just happened) | ~2.5 min | ~5 min |
| Polling every 1 min | ~0 sec | ~30 sec | ~1 min |
| SQS push notification | ~2-10 sec | ~5-15 sec | ~30 sec |

For a high-volume seller, a 5-minute polling interval means an order placed at 11:00:01 isn't processed until 11:05. An SQS notification arrives in under 15 seconds. For FBA inventory notifications and listing suppression events, this difference is the gap between catching a problem before customers see it vs. hours after.

### API Call Cost Comparison

| Approach | API calls/day | Monthly calls | SP-API tokens consumed |
|---|---|---|---|
| Poll Orders every 5 min | 288 | 8,640 | Medium |
| Poll Orders every 1 min | 1,440 | 43,200 | High (throttle risk) |
| Push notifications | ~N (one per event) | ~N (event-driven) | Minimal |

SP-API has rate limits per operation. Polling every minute for orders burns your `getOrders` quota continuously even when nothing is happening at 3 AM. Push notifications only generate API calls when events actually occur.

### Reliability: No Missed Events

A polling loop can miss events if:
- Your polling interval is longer than the event's business window (flash inventory depletion)
- Your polling service goes down and events accumulate
- Amazon's API throttles your poll request (you get a 429, skip the interval, miss events)

SQS queues events durably. Messages persist for up to 14 days by default. Even if your n8n instance is down for 2 hours, all events are waiting in the queue when it comes back up. No events lost.

### Use Cases Where Event-Driven Is Non-Negotiable

**Order fulfillment timing.** An order with `UNSHIPPED` status has an SLA. Missing the first few minutes of that window because of a polling delay compounds downstream. Push notification means your fulfillment workflow starts within seconds.

**Listing suppression detection.** A `LISTINGS_ITEM_STATUS_CHANGE` event for a suppression can happen at any time. Detecting it 5 minutes later vs. 10 seconds later is the difference between a 10-minute suppression and a 30-minute one. During peak traffic hours, even a 10-minute suppression costs real revenue.

**Inventory alerts.** `FBA_INVENTORY_AVAILABILITY_CHANGES` can signal a sudden sellout. You want to stop ads, create a restock task, and alert ops — in seconds, not minutes.

**Report completion.** After submitting a large report request, polling every 30 seconds for completion wastes API calls. `REPORT_PROCESSING_FINISHED` fires the moment Amazon is done, letting you instantly fetch and process the data.

**Feed processing.** Same pattern. Large catalog feeds take minutes to process on Amazon's side. `FEED_PROCESSING_FINISHED` fires immediately upon completion — no need to poll `getFeed` in a tight loop.

**Branded content drift detection.** `BRANDED_ITEM_CONTENT_CHANGE` fires when listing content changes (competitor or Amazon hijack). The event-driven pattern lets you diff within seconds and alert brand owners before the change is seen by buyers.

### Summary Principle

> **Rule:** If the business needs to *react* to an Amazon event, use push notifications. Only use polling for data where you need current state on-demand (ad metrics, BSR snapshots, financial reports you initiate on a schedule).

---

## 2. SP-API Notifications API — Complete Reference

### Overview

The Notifications API is a separate SP-API resource that lets you register destinations (SQS queues, EventBridge) and subscribe to specific notification types per marketplace. It uses grantless operations for destination management and seller-authorized calls for subscriptions.

### Required SP-API Roles

Not all notification types are available to all apps. You must have the correct role granted during app registration.

| SP-API Role | Notification Types Unlocked |
|---|---|
| `Selling Partner Insights` | `ORDER_CHANGE`, `MFN_ORDER_STATUS_CHANGE`, `ITEM_SALES_EVENT` |
| `Direct-to-Consumer Shipping` | Shipping-related notifications |
| `Inventory and Order Management` | `FBA_INVENTORY_AVAILABILITY_CHANGES`, `ORDER_CHANGE` |
| `Pricing` | `ANY_OFFER_CHANGED`, `B2B_ANY_OFFER_CHANGED`, `PRICING_HEALTH` |
| `Product Listing` | `LISTINGS_ITEM_STATUS_CHANGE`, `LISTINGS_ITEM_ISSUES_CHANGE`, `BRANDED_ITEM_CONTENT_CHANGE`, `ITEM_SALES_STATUS_CHANGE` |
| `Reports` | `REPORT_PROCESSING_FINISHED` |
| `Fulfillment By Amazon (FBA)` | `FBA_INVENTORY_AVAILABILITY_CHANGES`, `FULFILLMENT_ORDER_STATUS` |
| `Amazon Fulfillment` | `FULFILLMENT_ORDER_STATUS` |
| `Feeds` | `FEED_PROCESSING_FINISHED` |

> ⚠️ **Role approval takes time.** When registering your SP-API app, request every role you will ever need. Adding roles later requires re-review by Amazon and can take days to weeks.

### Complete Notification Types Reference

#### Order Notifications

**`ORDER_CHANGE`**
- Fires when: a new order is placed, order status changes (`Pending` → `Unshipped` → `Shipped` → `Delivered`), order is cancelled, or a return is initiated
- Payload contains: `AmazonOrderId`, `BuyerInfo` (if PII-authorized), `OrderStatus`, `MarketplaceId`, `PurchaseDate`
- Use cases: kickstart fulfillment, update inventory, notify warehouse, create ClickUp task for FBA exception handling
- Rate: Very high during Prime Day/holidays — design for burst
- Notes: You get one event per status transition, not one per order. A single order may generate 3-5 events across its lifecycle.

**`MFN_ORDER_STATUS_CHANGE`**
- Fires when: merchant-fulfilled order status changes
- Specific to MFN (Merchant Fulfilled Network) sellers
- Use cases: Track self-ship SLA, trigger carrier pickup scheduling

**`ITEM_SALES_EVENT`** (also seen as `ITEM_SALES_STATUS_CHANGE`)
- Fires when: a sale is recorded for a tracked ASIN
- Use cases: real-time revenue tracking, sales velocity calculation, inventory depletion alerts
- Note: This is ASIN-level, not order-level — useful for brand-wide monitoring

#### Listing Notifications

**`LISTINGS_ITEM_STATUS_CHANGE`**
- Fires when: a listing becomes ACTIVE, INACTIVE, or SUPPRESSED in a marketplace
- Payload contains: `SellerId`, `MarketplaceId`, `Asin`, `SellerSku`, `Status` (`ACTIVE` | `INACTIVE` | `SUPPRESSED`)
- Use cases: **Listing suppression detection** (the most critical real-time use case for brand protection), relisting automation, suppression root-cause lookup
- Priority: HIGH — this is the #1 notification every Amazon brand should have running

**`LISTINGS_ITEM_ISSUES_CHANGE`**
- Fires when: issue codes on a listing change (new suppression reason, compliance warning, content policy flag)
- Payload contains: `Issues` array with `Code`, `Message`, `Severity` (`ERROR` | `WARNING`), `AttributeNames`
- Use cases: Proactive suppression prevention, automated issue ticket creation, compliance monitoring
- Note: Often fires before `LISTINGS_ITEM_STATUS_CHANGE` — you get warning before suppression

**`BRANDED_ITEM_CONTENT_CHANGE`**
- Fires when: title, description, bullet points, images, or A+ content changes on a branded ASIN
- Payload contains: `MarketplaceId`, `Asin`, `BrandName`, `AttributesChanged` (list of changed attribute names)
- Use cases: Brand hijack detection, unauthorized content changes, A/B test monitoring, brand registry protection
- Priority: HIGH for brand owners — detect hijacks in seconds, not hours

#### Pricing Notifications

**`ANY_OFFER_CHANGED`**
- Fires when: any seller changes their offer price or availability on an ASIN you're monitoring
- Very high volume on competitive ASINs (can be thousands of events/day per ASIN)
- Use cases: Repricing triggers, competitive intelligence, buy box monitoring
- ⚠️ **High volume warning.** Monitoring 100+ competitive ASINs with `ANY_OFFER_CHANGED` generates significant SQS volume. Design your pipeline for throughput, not just latency.

**`B2B_ANY_OFFER_CHANGED`**
- Same as above but for B2B (business buyer) price changes
- Requires B2B pricing enabled on your account

**`PRICING_HEALTH`**
- Fires when: Amazon's pricing health algorithm flags your pricing as potentially unhealthy (suppression risk for buy box or featured offer eligibility)
- Use cases: Automated pricing health alerts, proactive repricing before suppression

#### Fulfillment Notifications

**`FULFILLMENT_ORDER_STATUS`**
- Fires when: a Multi-Channel Fulfillment (MCF) order status changes
- Payload: order details, shipment tracking, status codes
- Use cases: MCF order tracking, customer notification automation

**`FBA_INVENTORY_AVAILABILITY_CHANGES`**
- Fires when: available FBA inventory quantity changes (sale, return received, transfer, FC adjustment)
- Payload contains: `MarketplaceId`, `Fnsku`, `Asin`, `SellerSku`, `Condition`, `IsHazmat`, `QuantityDetails`
- Use cases: Low stock alerts, restock trigger, inventory reconciliation
- Note: Fires on *every* inventory change, including small adjustments. Filter by threshold in your n8n logic.

#### Report & Feed Notifications

**`REPORT_PROCESSING_FINISHED`**
- Fires when: a report you requested finishes processing (status: `DONE`, `CANCELLED`, or `FATAL`)
- Payload contains: `ReportId`, `ReportType`, `ProcessingStatus`, `MarketplaceIds`
- Use cases: Fully automated report-process-insert pipeline (no polling), scheduled data sync
- Priority: HIGH for data pipeline work — eliminates polling entirely

**`FEED_PROCESSING_FINISHED`**
- Fires when: a feed you submitted finishes processing
- Payload contains: `FeedId`, `FeedType`, `ProcessingStatus`
- Use cases: Validate bulk listing updates, trigger error handling if feed fails, chain workflows (feed done → verify listings active)

### ORDER_CHANGE Payload — Annotated Example

```json
{
  "NotificationVersion": "1.0",
  "NotificationType": "ORDER_CHANGE",
  "PayloadVersion": "1.0",
  "EventTime": "2026-05-07T14:23:45.123Z",
  "Payload": {
    "OrderChangeNotification": {
      "SellerId": "A3EXAMPLE123456",
      "AmazonOrderId": "111-1234567-1234567",
      "PurchaseDate": "2026-05-07T14:20:00Z",
      "OrderStatus": "Unshipped",
      "MarketplaceId": "ATVPDKIKX0DER",
      "FulfillmentType": "MFN",
      "NumberOfItemsShipped": 0,
      "NumberOfItemsUnshipped": 2,
      "OrderTotal": {
        "CurrencyCode": "USD",
        "Amount": "47.99"
      },
      "Summary": {
        "CreatedBefore": "2026-05-07T14:23:45Z",
        "LastUpdatedDate": "2026-05-07T14:23:42Z"
      }
    }
  },
  "NotificationMetadata": {
    "ApplicationId": "amzn1.sellerapps.app.example",
    "SubscriptionId": "sub-abc123def456",
    "PublishTime": "2026-05-07T14:23:45.456Z",
    "NotificationId": "notif-xyz789abc012"
  }
}
```

> **Key fields for routing:** `NotificationType` (determines which handler to invoke), `EventTime` (for lag monitoring), `NotificationMetadata.NotificationId` (for deduplication), and `Payload` (event-specific data).

### API Operations — Grantless vs. Seller-Authorized

| Operation | Auth Required | Description |
|---|---|---|
| `createDestination` | Grantless | Register an SQS queue or EventBridge as a destination |
| `getDestination` | Grantless | Retrieve a specific destination |
| `getDestinations` | Grantless | List all destinations |
| `deleteDestination` | Grantless | Remove a destination |
| `createSubscription` | Seller access token | Subscribe a seller to a notification type at a destination |
| `getSubscription` | Seller access token | Get subscription details |
| `getSubscriptionById` | Seller access token | Get subscription by ID (grantless) |
| `deleteSubscription` | Seller access token | Cancel a subscription |

> **Grantless operations** use `grant_type=client_credentials` with `scope=sellingpartnerapi::notifications` — no Refresh Token needed. Use for destination management in your infrastructure setup scripts.

### One-Time Setup Sequence

```
1. Create SQS queue in AWS
2. Set SQS resource policy (allow SP-API principal to SendMessage)
3. Call createDestination (grantless) → get destinationId
4. For each seller:
   a. Exchange Refresh Token for Access Token
   b. For each notification type you need:
      Call createSubscription(notificationType, destinationId)
      → get subscriptionId (save to your database)
```

---

## 3. Notification Delivery Options — SQS vs EventBridge vs SNS

### Option 1: Amazon SQS (Recommended for syncflow)

**How it works:** SP-API pushes notification JSON directly into your SQS queue. Your consumer (n8n SQS trigger) polls the queue and processes messages.

**Pros:**
- Simplest architecture — SP-API → SQS → n8n, 3 components
- Native n8n SQS trigger node (no custom code to receive)
- Durable — messages survive consumer downtime (up to 14 days)
- Dead letter queue support out of the box
- Cheapest option for single-app consumption

**Cons:**
- One queue per app (or complex routing if you need multiple consumers)
- n8n polls SQS — not truly push to n8n (polling interval: typically 20 sec)
- Standard SQS doesn't preserve order

**Best for:** syncflow's architecture. One n8n instance consuming events for one or more seller accounts. Simple, reliable, cheap.

### Option 2: Amazon EventBridge

**How it works:** SP-API pushes events to Amazon EventBridge (default event bus or partner event bus). You create EventBridge rules to route events to targets (Lambda, SQS, SNS, Step Functions, etc.).

**Pros:**
- Schema registry — auto-documents your event shapes
- Event filtering with pattern matching (route `ORDER_CHANGE` to one target, `LISTINGS_ITEM_STATUS_CHANGE` to another)
- Fan-out to multiple targets per event type
- Integrates with AWS CloudWatch for monitoring
- Serverless — no queue management

**Cons:**
- More complex setup (event bus, rules, targets, IAM)
- More expensive for simple single-consumer cases
- n8n doesn't have a native EventBridge trigger — need Lambda → SQS → n8n or Lambda → webhook

**Best for:** Large-scale multi-team architectures where different teams own different event types, or when you need routing logic at the infrastructure layer.

### Option 3: SNS + SQS Fanout

**How it works:** SP-API → SQS queue → SNS topic → multiple subscriber SQS queues (one per consumer).

```
SP-API → SQS (raw) → Lambda (forward) → SNS Topic
                                              ├─► SQS Queue A (n8n handler)
                                              ├─► SQS Queue B (analytics)
                                              └─► SQS Queue C (alerts)
```

**Pros:**
- True fanout — same event processed by multiple independent consumers
- Each consumer has its own queue with independent DLQ
- Consumers can scale independently

**Cons:**
- Most complex setup
- SP-API doesn't push directly to SNS (you need a routing Lambda or SQS intermediate)
- Overkill for a single app with a single consumer

**Best for:** Enterprise setups where the same SP-API event must drive multiple independent systems simultaneously.

### Decision Matrix

| Scenario | Recommended Option |
|---|---|
| Single n8n instance, one or a few sellers | **SQS** |
| Multiple teams consuming the same events | **EventBridge** |
| Same event → multiple independent systems | **SNS + SQS fanout** |
| Testing / prototyping | **SQS** |
| Need event filtering at infra layer | **EventBridge** |
| Budget-sensitive, simple architecture | **SQS** |

---

## 4. AWS SQS Setup — Step by Step

### Queue Type: Standard vs. FIFO

| Feature | Standard Queue | FIFO Queue |
|---|---|---|
| Ordering | Best-effort (not guaranteed) | First-in, first-out (guaranteed) |
| Delivery | At-least-once (duplicates possible) | Exactly-once processing |
| Throughput | Unlimited | 3,000 msg/sec (with batching) |
| Price | $0.40/million requests | $0.50/million requests |
| SP-API support | ✅ | ❌ (SP-API does NOT support FIFO) |

> ⚠️ **Always use Standard queues for SP-API.** Amazon's Notifications API explicitly does not support FIFO queues. Attempting to use a FIFO queue as a destination will fail during `createDestination`.

### Step 1: Create the SQS Queue

Via AWS Console:
1. Navigate to **SQS → Create Queue**
2. Select **Standard**
3. Name: `sp-api-notifications-prod` (or seller-specific: `sp-api-notifications-{sellerId}`)
4. Configure:
   - **Visibility Timeout:** 300 seconds (5 minutes) — must be longer than your n8n workflow execution time
   - **Message Retention Period:** 4 days (default 4 days; max 14 days)
   - **Receive Message Wait Time:** 20 seconds (enables long polling — reduces cost and latency vs. 0)
   - **Maximum Message Size:** 256 KB (default, sufficient for all SP-API notifications)
5. Click **Create Queue** — note the **Queue ARN** and **Queue URL**

Via AWS CLI:
```bash
aws sqs create-queue \
  --queue-name sp-api-notifications-prod \
  --attributes '{
    "VisibilityTimeout": "300",
    "MessageRetentionPeriod": "345600",
    "ReceiveMessageWaitTimeSeconds": "20"
  }'
```

### Step 2: Set the SQS Resource Policy

SP-API uses AWS principal `437568002678` (Amazon's SP-API service account) to publish to your queue. You must grant this principal `SendMessage` and `GetQueueAttributes` permissions.

In AWS Console:
1. Open your queue → **Access policy** tab → **Edit**
2. Replace the policy with:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSPAPIToSendMessages",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::437568002678:root"
      },
      "Action": [
        "SQS:SendMessage",
        "SQS:GetQueueAttributes"
      ],
      "Resource": "arn:aws:sqs:us-east-1:YOUR_ACCOUNT_ID:sp-api-notifications-prod",
      "Condition": {
        "StringEquals": {
          "aws:SourceAccount": "YOUR_AWS_ACCOUNT_ID"
        }
      }
    }
  ]
}
```

> ⚠️ Replace `YOUR_ACCOUNT_ID` with your actual 12-digit AWS account ID (appears twice). The `Condition` block with `aws:SourceAccount` is a security best practice — it prevents other accounts from using your queue policy to deliver messages to your queue via confused deputy attack.

### Step 3: Configure the Dead Letter Queue (DLQ)

The DLQ receives messages that fail processing after N attempts. Without a DLQ, failed messages either disappear (if retention expires) or loop forever (if your consumer keeps failing on poison messages).

1. Create a second SQS queue: `sp-api-notifications-dlq`
   - No special policy needed (only your consumer reads it)
   - Longer retention: 14 days (catch errors even if you're on vacation)
2. On your main queue → **Dead-letter queue** tab → **Edit**:
   - Enable DLQ → select `sp-api-notifications-dlq`
   - **Maximum receives:** 3 (after 3 failed processing attempts, move to DLQ)

### Step 4: Register the Destination in SP-API

This is a grantless operation — call it once from your infrastructure setup script.

```python
import requests

def get_grantless_token(client_id, client_secret):
    """Get access token using grantless operation scope."""
    response = requests.post(
        "https://api.amazon.com/auth/o2/token",
        data={
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret,
            "scope": "sellingpartnerapi::notifications"
        }
    )
    return response.json()["access_token"]

def create_sqs_destination(access_token, sqs_arn, region="us-east-1"):
    """Register SQS queue as SP-API notification destination."""
    response = requests.post(
        f"https://sellingpartnerapi-na.amazon.com/notifications/v1/destinations",
        headers={
            "x-amz-access-token": access_token,
            "Content-Type": "application/json"
        },
        json={
            "name": "syncflow-sqs-prod",
            "resourceSpecification": {
                "sqs": {
                    "arn": sqs_arn
                }
            }
        }
    )
    data = response.json()
    return data["payload"]["destinationId"]  # Save this!

# Usage
token = get_grantless_token(CLIENT_ID, CLIENT_SECRET)
destination_id = create_sqs_destination(
    token,
    "arn:aws:sqs:us-east-1:123456789012:sp-api-notifications-prod"
)
print(f"Destination ID: {destination_id}")  # Store in your DB
```

> ⚠️ This call must also be properly SigV4-signed. The example above omits SigV4 signing for brevity. Use the `python-amazon-sp-api` library or `requests-aws4auth` for production use.

### Step 5: Create Subscriptions Per Seller

For each seller account and each notification type you need:

```python
def create_subscription(seller_access_token, notification_type, destination_id):
    """Subscribe a seller to a notification type."""
    response = requests.post(
        f"https://sellingpartnerapi-na.amazon.com/notifications/v1/subscriptions/{notification_type}",
        headers={
            "x-amz-access-token": seller_access_token,
            "Content-Type": "application/json"
        },
        json={
            "payloadVersion": "1.0",
            "destinationId": destination_id
        }
    )
    return response.json()["payload"]["subscriptionId"]

# Subscribe to key notification types for a seller
notification_types = [
    "ORDER_CHANGE",
    "LISTINGS_ITEM_STATUS_CHANGE",
    "LISTINGS_ITEM_ISSUES_CHANGE",
    "FBA_INVENTORY_AVAILABILITY_CHANGES",
    "REPORT_PROCESSING_FINISHED",
    "FEED_PROCESSING_FINISHED",
    "BRANDED_ITEM_CONTENT_CHANGE"
]

seller_token = get_seller_access_token(seller_refresh_token)
for notif_type in notification_types:
    sub_id = create_subscription(seller_token, notif_type, destination_id)
    # Save sub_id to Supabase subscriptions table
    save_subscription(seller_id, notif_type, sub_id)
```

### IAM Credentials for n8n to Read SQS

Your n8n instance needs IAM credentials to consume (read + delete) messages from the queue.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowN8nToConsumeQueue",
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
        "sqs:ChangeMessageVisibility"
      ],
      "Resource": "arn:aws:sqs:us-east-1:YOUR_ACCOUNT_ID:sp-api-notifications-prod"
    }
  ]
}
```

Create an IAM user with this policy, generate access keys, and store them in n8n as AWS credentials.

---

## 5. n8n + SQS Integration

### AWS SQS Trigger Node — Configuration

The n8n AWS SQS Trigger node polls your queue and fires the workflow for each message (or batch of messages).

**Credential Setup in n8n:**
1. **Credentials → New → AWS**
2. Enter:
   - **Access Key ID:** IAM user key (from step above)
   - **Secret Access Key:** IAM user secret
   - **Region:** Must match your SQS queue region (e.g., `us-east-1`)

**Node Configuration:**
```
Node: AWS SQS Trigger
  Queue URL: https://sqs.us-east-1.amazonaws.com/123456789012/sp-api-notifications-prod
  Credentials: [your AWS credentials]
  Options:
    Max Number of Messages: 10          ← Process up to 10 messages per poll
    Visibility Timeout: 300             ← Must match or exceed workflow execution time
    Wait Time Seconds: 20               ← Long polling (20 = max, reduces cost)
    Binary: false                       ← SP-API payloads are JSON, not binary
```

> **Polling interval note:** The SQS trigger node polls every 20 seconds when using long polling (`Wait Time Seconds: 20`). With SQS long polling, if there are no messages, the request waits up to 20 seconds for one to arrive — this is NOT the same as polling every 20 seconds. It means you get near-real-time delivery within ~20 seconds of a message arriving.

### Message Structure in n8n

When the SQS trigger fires, each item's `$json` contains the raw SQS message wrapper:

```json
{
  "MessageId": "abc-123-def-456",
  "ReceiptHandle": "AQEBwJnKyrHigUMZj6reyNurx...",
  "MD5OfBody": "e3d9e02908526c3c...",
  "Body": "{\"NotificationVersion\":\"1.0\",\"NotificationType\":\"ORDER_CHANGE\",...}",
  "Attributes": {
    "SenderId": "AROAI3HMJT2ITYCEXXXX:SP-API-Notification-Prod",
    "ApproximateReceiveCount": "1",
    "SentTimestamp": "1715091825123",
    "ApproximateFirstReceiveTimestamp": "1715091826456"
  }
}
```

> ⚠️ **The SP-API payload is in `Body` as an escaped JSON string.** You must parse it with a Code node or `JSON.parse($json.Body)` expression.

### Parsing the SQS Message

Add a **Code node** immediately after the SQS trigger to parse and normalize the message:

```javascript
// Code node: "Parse SP-API Notification"
// Run mode: Run Once for Each Item

const rawBody = $json.Body;
const receiptHandle = $json.ReceiptHandle;
const sqsMessageId = $json.MessageId;

// Parse the SQS message body
let notification;
try {
  notification = JSON.parse(rawBody);
} catch (e) {
  // Malformed message — will go to DLQ after max retries
  throw new Error(`Failed to parse SQS message body: ${e.message}`);
}

// Extract SP-API notification fields
const notificationType = notification.NotificationType;
const eventTime = notification.EventTime;
const notificationId = notification.NotificationMetadata?.NotificationId;
const sellerId = notification.Payload?.[Object.keys(notification.Payload)[0]]?.SellerId;
const marketplaceId = notification.Payload?.[Object.keys(notification.Payload)[0]]?.MarketplaceId;

return {
  json: {
    // Routing fields (used by Switch node)
    notificationType,
    notificationId,
    eventTime,
    sellerId,
    marketplaceId,
    
    // Full payload for handler nodes
    rawPayload: notification.Payload,
    fullNotification: notification,
    
    // SQS metadata (needed for dedup check)
    sqsMessageId,
    receiptHandle,
    
    // Processing metadata
    receivedAt: new Date().toISOString()
  }
};
```

### Acknowledgement Pattern

SQS messages are NOT automatically deleted after processing. They become visible again after the **Visibility Timeout** expires if not explicitly deleted. n8n's SQS trigger node handles this automatically — it deletes the message after successful workflow execution. However, if your workflow errors, n8n does NOT delete the message, allowing it to be retried (up to the `MaxReceiveCount` DLQ threshold).

**This means:**
- Successful workflow execution → message deleted from SQS ✅
- Workflow errors → message becomes visible again after visibility timeout → n8n retries it
- Message fails 3 times (MaxReceiveCount=3) → moves to DLQ

### Handling Duplicate Deliveries

SQS standard queues deliver at least once. Duplicates are rare but possible (< 0.1% in practice, higher during AWS infrastructure events). **Design for them:**

1. Use `notificationId` (from `NotificationMetadata.NotificationId`) as your deduplication key in Supabase
2. Check for existing records before processing (see Section 10 — Idempotency)
3. Use `INSERT ... ON CONFLICT DO NOTHING` for event inserts

---

## 6. n8n Webhook Node — Inbound Webhooks (Non-SQS)

Not all event sources use SQS. For third-party tools (SellerApp alerts, external analytics, or testing), you'll use n8n's Webhook trigger.

### Webhook Node Setup

```
Node: Webhook
  HTTP Method: POST
  Path: /sp-api-events            ← becomes /webhook/sp-api-events in your n8n URL
  Authentication: Header Auth
  Response Mode: Respond Immediately  ← critical for performance (see below)
  Response Code: 200
  Response Body: { "status": "received" }
```

**Your webhook URL format:**
- n8n Cloud: `https://yourorg.app.n8n.cloud/webhook/sp-api-events`
- Self-hosted: `https://n8n.yourdomain.com/webhook/sp-api-events`

### Authentication Options

**Header Auth (Recommended):**
```
Header Name: X-Webhook-Secret
Header Value: [your secret, stored in n8n credentials]
```

The caller includes `X-Webhook-Secret: your-secret` in request headers. n8n validates it automatically and returns 401 if missing or wrong.

**Basic Auth:**
Standard HTTP Basic authentication. Caller provides username:password in Authorization header.

**HMAC Signature Verification (Most Secure — see Section 14):**
For external callers where you control both sides, implement HMAC verification in a Code node immediately after the Webhook trigger.

**JWT:**
Use n8n's built-in JWT auth option for machine-to-machine API patterns.

### Response Mode: Immediately vs. On Last Node

**Respond Immediately (recommended for event pipelines):**
- n8n sends HTTP 200 back to the caller before the workflow completes
- Caller doesn't wait → no timeout issues for long workflows
- Trade-off: caller can't receive workflow output
- Use when: the caller only needs ACK, not the processing result

**Respond on Last Node:**
- Caller waits for the entire workflow to complete
- Use **Respond to Webhook** node at the end to explicitly send a response
- Risk: long workflows can cause caller timeouts (most webhooks timeout at 30-60 seconds)
- Use when: you're building a synchronous API (caller needs the processed result)

> **Rule for event pipelines:** Always use **Respond Immediately**. SP-API doesn't care about your response — it just needs a 2xx ACK. Long-running event workflows should never block the caller.

### Webhook Test vs. Production Mode

- **Test mode:** Active only while you're viewing the workflow in the editor. Captures one execution and shows you the data. Disabled when you navigate away.
- **Production mode:** Always active. Requires the workflow to be saved and **Activated** (toggle in top-right).

> ⚠️ **Common mistake:** Testing a webhook integration and wondering why nothing works in production — because the workflow was never activated.

---

## 7. Supabase as Event Store

Using Supabase as an event store serves three purposes:
1. **Durability** — events are persisted even if n8n processing fails
2. **Auditability** — full history of what happened, when, and what the system did
3. **Replayability** — failed events can be re-processed from the database

### Events Table Schema

```sql
-- Core event store
CREATE TABLE sp_api_events (
  id                BIGSERIAL PRIMARY KEY,
  event_id          TEXT NOT NULL,          -- NotificationMetadata.NotificationId
  sqs_message_id    TEXT,                   -- SQS MessageId (second dedup layer)
  event_type        TEXT NOT NULL,          -- e.g. 'ORDER_CHANGE'
  seller_id         TEXT,                   -- Amazon SellerId
  marketplace_id    TEXT,                   -- e.g. 'ATVPDKIKX0DER'
  event_time        TIMESTAMPTZ,            -- EventTime from SP-API
  received_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at      TIMESTAMPTZ,            -- NULL = unprocessed
  status            TEXT NOT NULL DEFAULT 'pending',
                                            -- 'pending' | 'processing' | 'done' | 'failed' | 'skipped'
  error             TEXT,                   -- Error message if status='failed'
  retry_count       INT NOT NULL DEFAULT 0,
  payload           JSONB NOT NULL,         -- Full notification payload
  result            JSONB,                  -- What the handler created/updated
  n8n_execution_id  TEXT,                   -- For cross-referencing n8n execution logs
  
  -- Deduplication constraint
  CONSTRAINT sp_api_events_event_id_unique UNIQUE (event_id)
);

-- Indexes for common query patterns
CREATE INDEX idx_sp_api_events_status ON sp_api_events(status) WHERE status != 'done';
CREATE INDEX idx_sp_api_events_event_type ON sp_api_events(event_type, received_at DESC);
CREATE INDEX idx_sp_api_events_seller ON sp_api_events(seller_id, received_at DESC);
CREATE INDEX idx_sp_api_events_received_at ON sp_api_events(received_at DESC);
CREATE INDEX idx_sp_api_events_payload_gin ON sp_api_events USING GIN (payload);
```

### Status Lifecycle

```
pending → processing → done
              └────────→ failed → pending (after retry)
                   └────→ skipped (duplicate detected)
```

### Inserting Events (Idempotent)

```sql
-- Insert with conflict handling — safe to call multiple times with same event_id
INSERT INTO sp_api_events (
  event_id, sqs_message_id, event_type, seller_id, marketplace_id,
  event_time, payload, status
)
VALUES (
  $1, $2, $3, $4, $5, $6, $7, 'pending'
)
ON CONFLICT (event_id) DO NOTHING;

-- Check if we actually inserted (or if it was a duplicate)
-- In n8n: use the "Rows Affected" output — if 0, it's a duplicate
```

### Updating Event Status

```sql
-- Mark as processing (claim the event)
UPDATE sp_api_events
SET status = 'processing',
    n8n_execution_id = $1
WHERE id = $2 AND status = 'pending'
RETURNING id;

-- Mark as done with result
UPDATE sp_api_events
SET status = 'done',
    processed_at = NOW(),
    result = $1
WHERE id = $2;

-- Mark as failed
UPDATE sp_api_events
SET status = 'failed',
    error = $1,
    retry_count = retry_count + 1
WHERE id = $2;
```

### Supplementary Tables

```sql
-- Track which sellers have which subscriptions
CREATE TABLE sp_api_subscriptions (
  id                BIGSERIAL PRIMARY KEY,
  seller_id         TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  subscription_id   TEXT NOT NULL,          -- From SP-API createSubscription response
  destination_id    TEXT NOT NULL,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(seller_id, notification_type)
);

-- Track listing baselines for change detection
CREATE TABLE listing_baselines (
  id             BIGSERIAL PRIMARY KEY,
  asin           TEXT NOT NULL,
  seller_id      TEXT NOT NULL,
  marketplace_id TEXT NOT NULL,
  snapshot       JSONB NOT NULL,            -- Full listing attributes at baseline
  snapshotted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(asin, seller_id, marketplace_id)
);
```

---

## 8. The Standard Pipeline Pattern — End to End

### Architecture Overview

```
Amazon SP-API
     │
     │ push notification (JSON)
     ▼
┌─────────────┐
│  AWS SQS    │ ← durable message queue, 4-day retention
│   Queue     │   standard queue, long polling enabled
└──────┬──────┘
       │ poll every ~20 sec
       ▼
┌─────────────────────────────────────────────────────────────┐
│                     n8n Workflow                            │
│                                                             │
│  [SQS Trigger]                                              │
│       │                                                     │
│  [Code: Parse & Normalize]                                  │
│       │                                                     │
│  [Supabase: INSERT event (idempotent)]                      │
│       │ if rows affected = 0 → [Stop: duplicate]            │
│       │                                                     │
│  [Supabase: UPDATE status = processing]                     │
│       │                                                     │
│  [Switch: route by notificationType]                        │
│       ├── ORDER_CHANGE ────────────────► [Order Handler]    │
│       ├── LISTINGS_ITEM_STATUS_CHANGE ► [Suppression Handler]│
│       ├── REPORT_PROCESSING_FINISHED ► [Report Handler]     │
│       ├── FBA_INVENTORY_* ──────────► [Inventory Handler]   │
│       ├── BRANDED_ITEM_CONTENT_CHANGE► [Brand Handler]      │
│       └── (default) ────────────────► [Log & Skip]         │
│                                                             │
│  [Handler Sub-flow]                                         │
│       │                                                     │
│  [Supabase: UPDATE status = done, result = {...}]           │
│       │                                                     │
│  [Optional actions]                                         │
│       ├── ClickUp: create task                              │
│       ├── Slack: send alert                                 │
│       └── SP-API: write-back (re-list, reprice)             │
└─────────────────────────────────────────────────────────────┘
```

### N8n Workflow Node-by-Node Description

**Node 1: AWS SQS Trigger**
- Type: `AWS SQS Trigger`
- Configuration: Queue URL, credentials, max 10 messages, wait time 20s
- Output: Raw SQS message items

**Node 2: Code — Parse & Normalize**
- Parses `$json.Body` string into notification object
- Extracts routing fields: `notificationType`, `notificationId`, `sellerId`, `marketplaceId`
- Adds `receivedAt` timestamp
- Errors here cause retry via SQS visibility timeout

**Node 3: Supabase — Insert Event (Idempotent)**
- Node type: Supabase or HTTP Request to PostgREST
- Operation: `INSERT INTO sp_api_events ... ON CONFLICT (event_id) DO NOTHING`
- Check `rows_affected` in output — if 0, this is a duplicate

**Node 4: IF — Duplicate Check**
- Condition: `{{ $json.rows_affected === 0 }}`
- True branch: Stop workflow (don't process duplicate)
- False branch: Continue to processing

**Node 5: Supabase — Claim Event**
- `UPDATE sp_api_events SET status='processing' WHERE id=$eventId`
- Prevents parallel processing if SQS delivers a duplicate mid-processing

**Node 6: Switch — Route by notificationType**
- Output 1: `ORDER_CHANGE`
- Output 2: `LISTINGS_ITEM_STATUS_CHANGE`
- Output 3: `LISTINGS_ITEM_ISSUES_CHANGE`
- Output 4: `REPORT_PROCESSING_FINISHED`
- Output 5: `FBA_INVENTORY_AVAILABILITY_CHANGES`
- Output 6: `BRANDED_ITEM_CONTENT_CHANGE`
- Output 7: `FEED_PROCESSING_FINISHED`
- Default: log as unknown type, mark skipped

**Nodes 7-N: Handler Sub-flows (Execute Workflow)**
- Each handler is a separate n8n workflow (Execute Workflow node)
- Receives normalized event data as input
- Returns result object
- Errors bubble up to error handler

**Final Node: Supabase — Mark Done**
- `UPDATE sp_api_events SET status='done', processed_at=NOW(), result=$result WHERE id=$eventId`

### Why Sub-workflows for Handlers?

Breaking each event type into its own sub-workflow:
- **Independently deployable** — update order handler without touching suppression handler
- **Independently debuggable** — execution history shows order-handler failures separately
- **Reusable** — trigger order handler from multiple sources (SQS, manual, test webhook)
- **Cleaner canvas** — main router stays simple; complexity lives in focused sub-workflows

---

## 9. Specific Pipeline Implementations

### 9.1 Order Processing Pipeline

**Trigger:** `ORDER_CHANGE` with `OrderStatus: "Unshipped"` (new order)

```
[SQS Trigger] 
    → [Parse notification]
    → [INSERT to sp_api_events]
    → [Duplicate check]
    → [Switch: OrderStatus == "Unshipped"]
        → [SP-API: getOrder(amazonOrderId)]          ← fetch full order details
        → [SP-API: getOrderItems(amazonOrderId)]     ← get line items
        → [Supabase: INSERT into orders table]
        → [Code: check inventory for each SKU]
        → [Supabase: UPDATE inventory quantities]
        → [IF: any SKU below restock threshold?]
            → TRUE:
               [Supabase: get SKU details + supplier info]
               → [ClickUp: create restock task]
                   Title: "Restock: {SKU} — {qty} remaining"
                   Priority: HIGH if qty < safety_stock / 2
                   Assignee: ops team
                   Custom fields: ASIN, current qty, reorder qty
            → FALSE: skip
        → [Supabase: UPDATE order status = processed]
```

**Key Supabase tables touched:**
- `orders` — INSERT new order
- `order_items` — INSERT line items
- `inventory` — UPDATE available quantity
- `restock_rules` — SELECT threshold config per SKU
- `sp_api_events` — UPDATE status = done

**Critical timing:** `ORDER_CHANGE` for `Unshipped` orders must be processed quickly — late fulfillment confirmation can cause Amazon to hold disbursements or penalize seller metrics.

### 9.2 Listing Suppression Detection Pipeline

**Trigger:** `LISTINGS_ITEM_STATUS_CHANGE` with `Status: "SUPPRESSED"`

```
[SQS Trigger]
    → [Parse: extract Asin, SellerSku, Status, MarketplaceId, SellerId]
    → [INSERT to sp_api_events]
    → [Duplicate check]
    → [IF: Status == "SUPPRESSED"]
        → [SP-API: getListingsItem(sellerId, sku, marketplaceId)]
            ← fetch suppression reasons from issues
        → [Code: extract suppression reason codes]
            ← map reason codes to human-readable messages
        → [Supabase: INSERT into listing_issues table]
        → [Supabase: UPDATE listing status = suppressed]
        → [ClickUp: create URGENT task]
            Title: "🚨 SUPPRESSED: {ASIN} — {suppression_reason}"
            Priority: URGENT
            List: Brand Operations → Listing Issues
            Custom fields: ASIN, SKU, suppression reason, marketplace
            Due date: NOW + 2 hours  ← SLA for suppression response
        → [Slack: send alert to #listing-alerts]
            Message: "🚨 {ASIN} suppressed on {marketplace}
                      Reason: {reason}
                      ClickUp: {task_url}"
        → [Supabase: mark event done]
```

**Human-readable suppression reason mapping:**

```javascript
// Code node: Map suppression reason codes
const reasonMap = {
  "MISSING_BULLET_POINT": "Missing bullet points (add 5 bullet points)",
  "MISSING_PRODUCT_DESCRIPTION": "Missing product description",
  "MISSING_IMAGE": "Missing main image",
  "LOW_QUALITY_IMAGE": "Image quality too low (< 1000px)",
  "PRICING_HEALTH": "Price too high/low vs. competitive benchmark",
  "HAZMAT_REVIEW": "Product flagged for hazmat review",
  "CATALOG_ITEM_MISSING_SAFETY_DATA_SHEET": "Missing SDS (safety data sheet)",
  "COMPLIANCE": "Compliance/regulatory issue"
};
```

### 9.3 Report Completion Trigger Pipeline

**Trigger:** `REPORT_PROCESSING_FINISHED` with `ProcessingStatus: "DONE"`

```
[SQS Trigger]
    → [Parse: extract ReportId, ReportType, ProcessingStatus, MarketplaceIds]
    → [INSERT to sp_api_events]
    → [IF: ProcessingStatus == "DONE"]
        → [Supabase: SELECT report_run WHERE report_id = $reportId]
            ← look up which report type this is and what to do with it
        → [SP-API: getReport(reportId)]
            ← fetch reportDocumentId
        → [SP-API: getReportDocument(reportDocumentId)]
            ← fetch download URL (pre-signed S3 URL, valid 5 min)
        → [HTTP Request: download report content]
            ← decompress if gzip
        → [Code: parse report TSV/CSV]
            ← convert to array of objects
        → [Switch: route by ReportType]
            INVENTORY_REPORT:
                → [Supabase: bulk UPSERT inventory_snapshots]
                → [Code: compare with previous snapshot → find deltas]
                → [IF: significant delta] → [Slack: inventory change alert]
            
            SALES_AND_TRAFFIC_REPORT:
                → [Supabase: bulk INSERT sales_metrics]
                → [Code: calculate day-over-day deltas]
            
            SEARCH_TERMS_REPORT (SQP):
                → [Supabase: bulk INSERT sqp_data]
        → [Supabase: UPDATE report_runs SET status='processed', processed_at=NOW()]
        → [Supabase: mark event done]
    
    → [ELSE if FATAL/CANCELLED]
        → [Supabase: UPDATE report_runs SET status='failed']
        → [Slack: alert "Report {reportId} ({reportType}) failed — {processingStatus}"]
```

### 9.4 Branded Content Change Detection Pipeline

**Trigger:** `BRANDED_ITEM_CONTENT_CHANGE`

```
[SQS Trigger]
    → [Parse: extract Asin, BrandName, MarketplaceId, AttributesChanged[]]
    → [INSERT to sp_api_events]
    → [Duplicate check]
    → [SP-API: getListingsItem(asin, marketplaceId)]
        ← fetch current listing data (title, images, bullets, description)
    → [Supabase: SELECT listing_baselines WHERE asin=$asin AND marketplace=$mkt]
        ← fetch the approved baseline version
    → [Code: diff current vs. baseline]
        ← compare title, images (by URL), bullets, description
        ← classify: TITLE_CHANGED | IMAGE_CHANGED | CONTENT_CHANGED
    → [IF: significant change detected AND change not triggered by us]
        → [Supabase: INSERT listing_change_events (diff details)]
        → [Supabase: UPDATE listing_baselines.status = 'drifted']
        → [ClickUp: create HIGH priority task]
            Title: "⚠️ Content change: {ASIN} — {changeType}"
            Description: diff showing old vs. new values
        → [Slack: alert to #brand-protection]
    → [ELSE: expected change (we triggered it)]
        → [Supabase: UPDATE listing_baselines with new snapshot]
        → [Mark event skipped]
    → [Supabase: mark event done]
```

**Expected vs. unexpected change detection:**
Track your own SP-API write operations. When you update a listing via SP-API Listings API, write a record to `listing_updates_pending` with the ASIN and expected new values. In the brand change handler, check this table — if there's a pending update for this ASIN, the change was expected (update baseline, clear pending record). If not, it's unexpected (alert).

---

## 10. Idempotency Patterns

### Why Idempotency Is Non-Negotiable

SQS delivers messages at least once. Your n8n workflow can crash mid-execution. Amazon can deliver a notification twice (rare but documented). The same `ORDER_CHANGE` event arriving twice MUST NOT create two ClickUp tasks, two inventory deductions, or two Slack alerts.

### Layer 1: Supabase UNIQUE Constraint

The primary deduplication layer. Every event has a `NotificationId` in `NotificationMetadata`. This is Amazon's unique identifier for the notification.

```sql
-- Schema: unique constraint on event_id
CONSTRAINT sp_api_events_event_id_unique UNIQUE (event_id)
```

```sql
-- Insert pattern: silently ignore duplicates
INSERT INTO sp_api_events (event_id, event_type, seller_id, payload, status)
VALUES ($1, $2, $3, $4, 'pending')
ON CONFLICT (event_id) DO NOTHING;

-- Check if insert happened (rows_affected = 0 means duplicate)
```

In n8n after the Supabase INSERT, check `$json.rowsAffected === 0`. If true, stop processing — this is a duplicate.

### Layer 2: Status Check Before Processing

Even if the INSERT succeeded (not a duplicate by `event_id`), check status before doing work:

```sql
-- Atomic claim: only succeeds if event is still 'pending'
UPDATE sp_api_events
SET status = 'processing', n8n_execution_id = $1
WHERE id = $2 AND status = 'pending'
RETURNING id;
```

If this UPDATE returns 0 rows, another execution already claimed the event. Stop.

### Layer 3: Idempotent Side Effects

Design all downstream actions to be idempotent:

**ClickUp tasks:** Before creating a task, check if one already exists for this event:
```javascript
// In n8n Code node before ClickUp create
const existingTask = await supabase
  .from('clickup_tasks')
  .select('id')
  .eq('source_event_id', notificationId)
  .single();

if (existingTask.data) {
  // Task already created — skip
  return { json: { skipped: true, taskId: existingTask.data.id } };
}
```

**Inventory updates:** Use absolute values (set to X), not relative adjustments (+/- Y):
```sql
-- BAD: vulnerable to double-processing
UPDATE inventory SET available = available - $ordered_qty WHERE sku = $sku;

-- GOOD: idempotent update (upsert with order-specific key)
INSERT INTO inventory_deductions (order_id, sku, qty)
VALUES ($order_id, $sku, $qty)
ON CONFLICT (order_id, sku) DO NOTHING;
-- Then recalculate available from deductions sum
```

**Supabase UPSERT for report data:**
```sql
INSERT INTO inventory_snapshots (asin, sku, available_qty, snapshot_date)
VALUES ($1, $2, $3, $4)
ON CONFLICT (asin, sku, snapshot_date) DO UPDATE
SET available_qty = EXCLUDED.available_qty,
    updated_at = NOW();
```

### Layer 4: SQS Message Deduplication ID

For an extra safety layer (rarely needed), you can add SQS deduplication at the queue level using the `MessageDeduplicationId` attribute. However, this requires FIFO queues (which SP-API doesn't support), so this isn't applicable for SP-API notifications. Use it for any SQS queues YOU publish to (not SP-API queues).

---

## 11. Error Handling & Reliability

### The Three Failure Modes

**Mode 1: Transient failures** — network timeout, downstream API 429/503, temporary DB connection issue. These should be retried automatically.

**Mode 2: Processing failures** — bad data, unexpected payload shape, business logic exception. These need human review.

**Mode 3: Poison messages** — malformed messages that will always fail. These must be moved to DLQ to prevent blocking the queue.

### SQS Retry Behavior

When n8n workflow execution fails (unhandled error):
1. n8n does NOT delete the SQS message
2. After **Visibility Timeout** (300 sec), message becomes visible again
3. n8n picks it up and retries
4. After **MaxReceiveCount** retries (configured in DLQ settings, recommend: 3), message moves to DLQ

This means you get 3 automatic retries for free with ~5 minutes between attempts.

### n8n Error Workflow

Configure a dedicated error workflow in n8n:
1. Create new workflow: "SP-API Event Error Handler"
2. Add **Error Trigger** node
3. In your main workflow settings → **Error Workflow** → select this workflow

The error trigger provides:
```javascript
{
  execution: {
    id: "exec-123",
    url: "https://n8n.yourdomain.com/execution/123",
    error: {
      message: "Error in node 'Supabase - Insert Order'",
      stack: "..."
    }
  },
  workflow: {
    id: "wf-456",
    name: "SP-API Order Pipeline"
  }
}
```

Your error workflow should:
```
[Error Trigger]
    → [Code: extract event details from execution context]
    → [Supabase: UPDATE sp_api_events SET status='failed', error=$errorMsg WHERE n8n_execution_id=$execId]
    → [Slack: alert to #n8n-errors]
        "❌ SP-API pipeline error
         Workflow: {workflowName}
         Execution: {executionUrl}
         Error: {errorMessage}"
```

### Dead Letter Queue Monitoring

Set up a CloudWatch alarm on your DLQ:

```json
{
  "AlarmName": "SP-API-DLQ-Messages",
  "MetricName": "ApproximateNumberOfMessagesVisible",
  "Namespace": "AWS/SQS",
  "Dimensions": [{"Name": "QueueName", "Value": "sp-api-notifications-dlq"}],
  "Threshold": 1,
  "ComparisonOperator": "GreaterThanOrEqualToThreshold",
  "EvaluationPeriods": 1,
  "Period": 60,
  "Statistic": "Maximum",
  "AlarmActions": ["arn:aws:sns:...your-alert-topic"]
}
```

Alternatively, create an n8n workflow on a schedule (every 5 minutes) that checks DLQ depth via AWS SDK and alerts if > 0.

### Re-processing from Supabase

When messages fail and land in DLQ, you can re-process them from your Supabase event store:

```sql
-- Find failed events eligible for retry
SELECT id, event_type, seller_id, payload, retry_count
FROM sp_api_events
WHERE status = 'failed'
  AND retry_count < 5
  AND received_at > NOW() - INTERVAL '24 hours'
ORDER BY received_at ASC;
```

Create an n8n workflow triggered manually or on schedule that:
1. Queries failed events from Supabase
2. Resets their status to `pending`
3. They'll be picked up by the event-type-specific handler directly (bypass SQS — you have the data in DB)

### Exponential Backoff for SP-API Write-back

When your event handler calls SP-API (e.g., to re-list a suppressed item), implement backoff:

```javascript
// Code node: SP-API call with retry
async function callWithRetry(fn, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 || error.status === 503) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error; // Non-retryable error
    }
  }
  throw new Error(`Failed after ${maxRetries} retries`);
}
```

---

## 12. Monitoring Event Pipelines

### Key Metrics to Track

**Processing lag** — time from event receipt to processing completion:
```sql
SELECT
  event_type,
  AVG(EXTRACT(EPOCH FROM (processed_at - event_time))) AS avg_lag_seconds,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY 
    EXTRACT(EPOCH FROM (processed_at - event_time))) AS p95_lag_seconds,
  MAX(EXTRACT(EPOCH FROM (processed_at - event_time))) AS max_lag_seconds
FROM sp_api_events
WHERE status = 'done'
  AND received_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY avg_lag_seconds DESC;
```

**Failed event counts by type (last 24h):**
```sql
SELECT
  event_type,
  COUNT(*) AS failed_count,
  MAX(received_at) AS last_failure,
  ARRAY_AGG(DISTINCT error ORDER BY error) AS unique_errors
FROM sp_api_events
WHERE status = 'failed'
  AND received_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY failed_count DESC;
```

**Throughput per event type:**
```sql
SELECT
  event_type,
  COUNT(*) AS events_total,
  COUNT(*) FILTER (WHERE status = 'done') AS processed,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed,
  COUNT(*) FILTER (WHERE status = 'pending' OR status = 'processing') AS in_queue,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'done') / COUNT(*), 1) AS success_rate_pct
FROM sp_api_events
WHERE received_at > NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY events_total DESC;
```

**Unprocessed event backlog (SLA monitoring):**
```sql
SELECT
  event_type,
  COUNT(*) AS pending_count,
  MIN(received_at) AS oldest_pending,
  EXTRACT(EPOCH FROM (NOW() - MIN(received_at))) / 60 AS oldest_age_minutes
FROM sp_api_events
WHERE status IN ('pending', 'processing')
GROUP BY event_type
HAVING COUNT(*) > 0
ORDER BY oldest_age_minutes DESC;
```

**Hourly event volume (for capacity planning):**
```sql
SELECT
  DATE_TRUNC('hour', received_at) AS hour,
  event_type,
  COUNT(*) AS event_count
FROM sp_api_events
WHERE received_at > NOW() - INTERVAL '7 days'
GROUP BY 1, 2
ORDER BY 1 DESC, 3 DESC;
```

### Supabase Dashboard Views

Create a Supabase View for quick monitoring:

```sql
CREATE VIEW v_event_pipeline_health AS
SELECT
  event_type,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending,
  COUNT(*) FILTER (WHERE status = 'processing') AS processing,
  COUNT(*) FILTER (WHERE status = 'done' AND processed_at > NOW() - INTERVAL '1 hour') AS done_last_hour,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_total,
  AVG(EXTRACT(EPOCH FROM (processed_at - received_at))) 
    FILTER (WHERE status = 'done' AND processed_at > NOW() - INTERVAL '1 hour') AS avg_process_sec
FROM sp_api_events
WHERE received_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type;
```

### n8n Execution History

In n8n, each workflow execution is logged:
- Navigate to a workflow → **Executions** tab
- Filter by status (Success/Error), date range
- Click any execution to see node-by-node data flow
- For failed executions: see exactly which node failed and why

**Store n8n execution IDs in Supabase** (the `n8n_execution_id` column) to cross-reference n8n execution logs with Supabase event records. When an event shows `status='failed'` in Supabase, you can directly open the corresponding n8n execution URL to see the error details.

### SQS Queue Depth Monitoring

Via AWS CloudWatch → SQS → your queue:
- `ApproximateNumberOfMessagesVisible` — messages waiting to be processed (normal: 0–few)
- `ApproximateAgeOfOldestMessage` — should stay below your SLA threshold
- `NumberOfMessagesSent` — incoming rate
- `NumberOfMessagesDeleted` — successfully processed rate

Alert thresholds for a typical seller:
- Queue depth > 100: Warning (pipeline slow)
- Queue depth > 1000: Critical (pipeline stopped)
- DLQ depth > 0: Immediate alert (something is broken)
- Oldest message age > 10 minutes: Warning

---

## 13. Cost Considerations

### AWS SQS Pricing

SQS charges per API request (64 KB = 1 request; larger messages = multiple requests):
- **Standard queues:** $0.40 per 1 million requests
- **First 1 million requests/month:** Free (AWS Free Tier)

For a mid-size seller doing 1,000 orders/month:

| Notification type | Events/month | SQS operations | Cost/month |
|---|---|---|---|
| `ORDER_CHANGE` | ~3,000 (3 transitions × 1K orders) | ~6,000 (send + receive + delete) | <$0.01 |
| `LISTINGS_ITEM_STATUS_CHANGE` | ~100 | ~300 | <$0.01 |
| `FBA_INVENTORY_AVAILABILITY_CHANGES` | ~5,000 | ~15,000 | <$0.01 |
| `REPORT_PROCESSING_FINISHED` | ~60 | ~180 | <$0.01 |
| `BRANDED_ITEM_CONTENT_CHANGE` | ~50 | ~150 | <$0.01 |
| **Total** | **~8,210** | **~21,630** | **~$0.01** |

> **SQS is essentially free** at Amazon seller operation scale. Even 10x larger sellers (10,000 orders/month) stay well under $1/month for notifications.

### n8n Execution Costs

n8n Cloud charges per execution (each workflow run = 1 execution regardless of nodes):
- ~8,210 events/month × 1 execution each = ~8,210 executions/month
- n8n Cloud Starter: 2,500 executions/month (~$24/mo for additional)
- n8n Cloud Pro: 10,000 executions/month (~$50/mo base)
- Self-hosted: execution cost is your server cost (typically $5–20/month on a VPS)

**Cost optimization:** Batch multiple SQS messages per n8n execution. Configure SQS trigger with `Max Number of Messages: 10`. Each n8n execution processes up to 10 events (using n8n's item looping), reducing execution count by up to 10x.

With batching (10 per execution): 8,210 events ÷ 10 = ~821 executions/month — stays within n8n Cloud Starter free tier.

### AWS Data Transfer

SQS messages between your SQS queue and n8n:
- If n8n is in the same AWS region: minimal/free data transfer
- If n8n is outside AWS (n8n Cloud, self-hosted elsewhere): ~$0.09/GB data transfer out
- SP-API notification payloads: typically 1–5 KB each
- 8,210 events × 3 KB avg = ~24 MB = ~$0.002/month

### Total Estimated Monthly Cost (1,000 orders/month seller)

| Component | Cost |
|---|---|
| AWS SQS | ~$0.01 |
| AWS data transfer | ~$0.01 |
| n8n (self-hosted $5 VPS) | $5.00 |
| n8n Cloud (if using) | $0–$50 |
| Supabase (free tier easily covers this) | $0 |
| **Total** | **~$5–50/month** |

The event-driven architecture itself is essentially free — the cost is the compute (n8n) and database (Supabase), which you're paying for regardless of the architecture choice.

---

## 14. Webhook Security for Inbound Webhooks

When you expose n8n webhook endpoints (for non-SP-API sources, or for testing), proper security prevents unauthorized callers from injecting fake events.

### HMAC Signature Verification

The gold standard for webhook security. The caller signs the request body with a shared secret. You verify the signature before processing.

**Pattern overview:**
1. You and the caller agree on a shared secret (e.g., 32-byte random hex)
2. Caller computes: `HMAC-SHA256(requestBody, sharedSecret)` → hex digest
3. Caller sends the signature in a header (e.g., `X-Signature: sha256=<hexdigest>`)
4. You recompute the HMAC on your side and compare

**n8n implementation — Code node immediately after Webhook trigger:**

```javascript
// Code node: "Verify HMAC Signature"
// Run mode: Run Once for Each Item

const crypto = require('crypto');

// Get raw body and signature from webhook
const rawBody = JSON.stringify($json.body); // or $json.rawBody if available
const receivedSignature = $json.headers['x-signature'];
const receivedTimestamp = $json.headers['x-timestamp']; // Unix timestamp

// Shared secret from n8n environment variable
const secret = $env.WEBHOOK_SIGNING_SECRET;

if (!receivedSignature || !receivedTimestamp) {
  throw new Error('Missing signature or timestamp headers');
}

// Timestamp validation: reject requests older than 5 minutes (replay attack prevention)
const requestTime = parseInt(receivedTimestamp, 10);
const currentTime = Math.floor(Date.now() / 1000);
const maxAge = 300; // 5 minutes

if (Math.abs(currentTime - requestTime) > maxAge) {
  throw new Error(`Request timestamp too old: ${currentTime - requestTime} seconds`);
}

// Compute expected signature (include timestamp to prevent replay attacks)
const signaturePayload = `${receivedTimestamp}.${rawBody}`;
const expectedSignature = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(signaturePayload)
  .digest('hex');

// Timing-safe comparison (prevents timing attacks)
const sigBuffer = Buffer.from(receivedSignature);
const expectedBuffer = Buffer.from(expectedSignature);

if (sigBuffer.length !== expectedBuffer.length || 
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
  throw new Error('Invalid webhook signature');
}

// Signature valid — pass through
return { json: $json };
```

**Caller-side signing (example in Python):**

```python
import hmac
import hashlib
import time
import requests

def sign_and_send_webhook(url, payload, secret):
    timestamp = str(int(time.time()))
    body = json.dumps(payload)
    
    signature_payload = f"{timestamp}.{body}"
    signature = "sha256=" + hmac.new(
        secret.encode(),
        signature_payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    response = requests.post(
        url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "X-Signature": signature,
            "X-Timestamp": timestamp
        }
    )
    return response
```

### Timestamp Validation (Replay Attack Prevention)

Including the timestamp in the signed payload prevents **replay attacks** — where an attacker captures a valid signed request and re-sends it later.

**How it works:**
1. Timestamp is included in the signature payload: `HMAC(timestamp + body)`
2. Signature is only valid for that specific timestamp
3. If the timestamp is more than 5 minutes old, reject the request
4. Even if an attacker captures a valid request, they can't replay it after 5 minutes

### Storing Secrets in n8n

Never hardcode signing secrets in workflow code. Use n8n's built-in secret management:
1. **Settings → Variables** (n8n Cloud) or environment variables (self-hosted)
2. Access in Code nodes via `$env.WEBHOOK_SIGNING_SECRET`
3. Never log or expose the secret in n8n execution data

### IP Allowlisting (Defense in Depth)

For additional security, configure your n8n instance's reverse proxy (nginx/Caddy) to only accept webhook requests from known IP ranges. SP-API does not publish a stable list of IP ranges for notifications, but for your own internal callers you can restrict by IP.

---

## 15. Common Pitfalls

### Pitfall 1: Visibility Timeout Too Short

**Problem:** Your n8n workflow takes 45 seconds to process an event, but the SQS visibility timeout is 30 seconds. The message becomes visible again while n8n is still processing it. Another n8n execution picks it up. Now you have two parallel executions processing the same event — double ClickUp tasks, double inventory deductions.

**Fix:** Set visibility timeout to at minimum 2× your typical workflow execution time. For complex pipelines with SP-API calls (each ~500ms): budget 60–120 seconds and set timeout to 300 seconds (5 minutes). Use Supabase status claims (Section 10, Layer 2) as a second defense.

### Pitfall 2: Missing IAM Permission for SP-API to Publish

**Problem:** You create the SQS queue, set the resource policy, register the destination with SP-API, create subscriptions — but notifications never arrive.

**Diagnosis:** Check the SP-API principal in the resource policy. The correct principal for most regions is `437568002678`. For some regions (EU, FE) it may differ.

**Fix:** Also check `GetQueueAttributes` is in the policy — SP-API calls this to validate the queue before accepting the destination.

### Pitfall 3: n8n Polling Too Frequent

**Problem:** SQS trigger with `Wait Time Seconds: 0` means n8n polls the queue every second regardless of whether messages are waiting. At $0.40/million requests, this generates ~2.5 million requests/month (~$1/month) just from empty polls.

**Fix:** Always set `Wait Time Seconds: 20` (long polling). This reduces empty poll requests by ~95% with no meaningful latency increase — SQS will return immediately if a message is waiting, and wait up to 20 seconds before returning empty if no messages arrive.

### Pitfall 4: Not Handling Duplicate Deliveries

**Problem:** SQS standard queues guarantee at-least-once delivery. Under normal conditions, duplicates are rare. Under high load, infrastructure events, or after DLQ reprocessing, duplicates happen. Without idempotency: duplicate orders in your system, double notifications sent, double ClickUp tasks created.

**Fix:** Implement all three idempotency layers from Section 10. The Supabase UNIQUE constraint on `event_id` is the minimum viable protection.

### Pitfall 5: Processing SQS Messages in FIFO Assumption

**Problem:** Assuming that events arrive in chronological order. `ORDER_CHANGE` for `Unshipped` arrives before `Shipped` arrives before `Delivered`. This is usually true, but SQS standard doesn't guarantee it. If `Shipped` arrives before `Unshipped`, your workflow may try to process a shipment update for an order not yet in your database.

**Fix:** Check if the referenced entity exists before processing. If the order isn't in your DB when `Shipped` arrives, either wait and retry, or fetch the order details fresh from SP-API regardless of DB state.

### Pitfall 6: Blocking the Webhook Response

**Problem:** Using webhook "Respond on Last Node" for SP-API event processing. Your pipeline takes 10 seconds to process an order. SP-API doesn't wait for webhook responses (it uses SQS, not direct webhooks), but if you're using direct webhooks from other sources, a slow response causes timeouts and retries from the caller.

**Fix:** Always use "Respond Immediately" for event ingestion webhooks. Separate the "receive" step from the "process" step.

### Pitfall 7: Storing Credentials in Workflow Code

**Problem:** Hardcoding AWS keys, SQS URLs, or API secrets directly in n8n Code node JavaScript. These values are stored in the workflow definition, visible in exported workflow JSON, and accessible to anyone with n8n access.

**Fix:** Store all secrets in n8n credentials or environment variables. Access via `$env.MY_SECRET` or via credential references in HTTP Request nodes.

### Pitfall 8: Not Setting Up DLQ

**Problem:** Without a DLQ, messages that fail repeatedly either expire (lost event data) or get retried indefinitely. A "poison message" (malformed payload your parser can't handle) blocks the retry queue forever if you're not careful.

**Fix:** Always configure DLQ with MaxReceiveCount = 3. Monitor DLQ with CloudWatch alert. Have a process to inspect and replay DLQ messages.

### Pitfall 9: Forgetting to Unsubscribe When Seller Deauthorizes

**Problem:** A seller removes your app's authorization. Their Refresh Token becomes invalid. But their SP-API notification subscriptions still exist. SP-API keeps trying to deliver to your queue. You receive events with an invalid seller's data that your system can't process (Refresh Token calls will fail).

**Fix:** When a seller deauthorizes (you'll know because token exchange starts returning errors), call `deleteSubscription` for all their notification types before removing their record from your DB.

### Pitfall 10: Ignoring the SP-API Principal Account ID Depending on Region

**Problem:** The SP-API principal `437568002678` is for North America (NA) and covers `us-east-1`. For EU and FE (Far East) regions, the SP-API notification service may use different internal account IDs when publishing.

**Fix:** Test notification delivery in each region you operate in. Monitor SQS for delivery failures. Check Amazon's official SP-API notification documentation for your region's principal ID.

### Pitfall 11: Not Monitoring Processing Lag

**Problem:** Your pipeline works — events are being processed — but silently falling behind. During Prime Day, event volume spikes 10×. n8n can't keep up. Queue depth grows from 0 to 50,000. Events from 3 hours ago are just now being processed. Suppression alerts arrive 3 hours late.

**Fix:** Monitor `ApproximateAgeOfOldestMessage` in SQS CloudWatch. Alert if > 5 minutes. If you hit volume spikes, consider: (1) increasing n8n parallel executions, (2) filtering low-priority notifications, (3) batching more messages per execution.

---

## 16. Dos & Don'ts

### ✅ DOs

**DO use SQS standard queues as your SP-API notification destination.** It's the simplest reliable architecture — SP-API pushes, SQS buffers, n8n consumes. One destination handles all sellers.

**DO enable long polling on SQS (WaitTimeSeconds: 20).** This reduces empty poll API calls by ~95% at zero cost to latency. It's a free performance improvement.

**DO set SQS Visibility Timeout to at least 2× your expected workflow execution time.** If your pipeline can take up to 2 minutes, set visibility timeout to 5 minutes minimum. Undersized visibility timeouts cause duplicate processing.

**DO persist every incoming event to Supabase before processing.** The event store is your audit log, your retry mechanism, and your source of truth. Process from the database, not from ephemeral workflow state.

**DO implement idempotency at every layer.** Database UNIQUE constraint for deduplication, status-check UPDATE for claim, and idempotent side effects (ON CONFLICT DO NOTHING for inserts, absolute values for inventory updates).

**DO configure a Dead Letter Queue with MaxReceiveCount = 3.** Without a DLQ, failed messages either loop forever or silently disappear. With a DLQ, you get 3 retries, then a safe holding area for manual inspection.

**DO monitor DLQ depth with a CloudWatch alarm.** Any message in the DLQ means something broke. Set an alarm to alert you immediately — don't let DLQ messages age silently for days.

**DO use SP-API's `LISTINGS_ITEM_STATUS_CHANGE` for suppression detection.** This is faster and more reliable than polling `getListingsItem` to check status. Every Amazon brand protecting their listings should have this subscription running.

**DO subscribe to `REPORT_PROCESSING_FINISHED` to eliminate polling for report completion.** The pattern of submit report → poll every 30 seconds wastes API quota. Subscribe once, process immediately on completion.

**DO store `NotificationMetadata.NotificationId` as your deduplication key.** Amazon generates this unique ID per notification. It's the most reliable dedup key — more stable than SQS message IDs.

**DO use sub-workflows in n8n for each event handler.** Route in the main workflow, handle in dedicated sub-workflows. This keeps each handler independently deployable, debuggable, and versioned.

**DO test your SQS resource policy immediately after creation.** Use the SP-API Notifications sandbox to send a test notification and verify it arrives in your queue. Resource policy errors are silent — SP-API will accept `createDestination` even with a broken policy; messages just don't arrive.

**DO include a timestamp in HMAC webhook signatures** to prevent replay attacks. Sign `timestamp.body`, not just `body`. Validate the timestamp is within 5 minutes on receive.

**DO use timing-safe comparison (`crypto.timingSafeEqual`) for HMAC verification.** Standard string equality (`===`) leaks timing information that can reveal partial matches to an attacker.

**DO log the `n8n_execution_id` in your Supabase event record.** When debugging a failed event, you need to jump directly from the Supabase record to the n8n execution log without hunting through execution history.

**DO set message retention on SQS to at least 4 days (default).** This gives you a full weekend to recover from infrastructure issues without losing events.

### ❌ DON'Ts

**DON'T use FIFO SQS queues for SP-API notifications.** Amazon's Notifications API explicitly does not support FIFO destinations. Your `createDestination` call will fail or behave unexpectedly.

**DON'T poll SP-API for events that have push notification equivalents.** Polling `getOrders` every minute is expensive, slow, and misses events that happen between polls. Use `ORDER_CHANGE` instead.

**DON'T process duplicate events.** Not having idempotency protection leads to: double inventory deductions, duplicate ClickUp tasks, duplicate Slack alerts, and corrupted data. Implement all three idempotency layers from Section 10.

**DON'T trust SQS to deliver messages in order.** Standard SQS is best-effort ordered. Design your handlers to be order-independent, or explicitly check prerequisite state before processing.

**DON'T hardcode AWS credentials in n8n workflow code.** Store them in n8n's credential store. Hardcoded secrets end up in exported workflow JSON, logs, and error messages.

**DON'T block webhook callers with slow processing.** Use "Respond Immediately" for event ingestion webhooks. Separate receipt from processing.

**DON'T ignore the `ApproximateAgeOfOldestMessage` SQS metric.** Queue depth tells you how many messages are waiting. Age tells you how long they've been waiting — the actual SLA impact. Monitor both.

**DON'T delete subscriptions without first checking they exist.** If you call `deleteSubscription` with an invalid subscription ID, you get an error. Always query existing subscriptions before attempting deletion.

**DON'T share one SQS queue between multiple SP-API applications in different organizations.** Each app should have its own destination queue. Sharing queues means one app's processing errors can block another app's messages (visibility timeout contention).

**DON'T assume `BRANDED_ITEM_CONTENT_CHANGE` means a brand attack.** Your own team updating a listing via SP-API also triggers this notification. Track your own write operations and classify changes as expected vs. unexpected before alerting.

**DON'T use visibility timeout of 0 or very short values (< 60 seconds).** Even fast n8n workflows can take more than 30 seconds when downstream APIs are slow. A visibility timeout of 30s on an AWS-throttled day means constant duplicate processing.

**DON'T build a monitoring system that only watches for failures.** Also monitor processing lag and throughput. A pipeline that's "not failing" but silently processing events 20 minutes late is a problem — you won't see it unless you watch the age metric.

---

## 17. Quick Reference Cheat Sheet

### SP-API Notifications Key Values

| Item | Value |
|---|---|
| SP-API SQS principal (NA region) | `arn:aws:iam::437568002678:root` |
| Grantless token scope | `sellingpartnerapi::notifications` |
| Grantless token URL | `https://api.amazon.com/auth/o2/token` |
| SP-API Notifications endpoint (NA) | `https://sellingpartnerapi-na.amazon.com/notifications/v1/` |
| SP-API Notifications endpoint (EU) | `https://sellingpartnerapi-eu.amazon.com/notifications/v1/` |
| SP-API Notifications endpoint (FE) | `https://sellingpartnerapi-fe.amazon.com/notifications/v1/` |
| SQS queue type | Standard (NOT FIFO) |
| Max SQS message size | 256 KB |
| SQS max retention period | 14 days |
| Recommended retention | 4 days |

### SQS Configuration Recommendations

| Setting | Recommended Value | Why |
|---|---|---|
| Queue Type | Standard | Required by SP-API |
| Visibility Timeout | 300 seconds | Handles slow n8n executions |
| Message Retention | 4–7 days | Recovery window |
| Receive Wait Time | 20 seconds | Long polling (cost reduction) |
| DLQ MaxReceiveCount | 3 | 3 retries before DLQ |
| DLQ Retention | 14 days | Review window |

### n8n SQS Trigger Configuration

```
Queue URL: https://sqs.<region>.amazonaws.com/<account>/<queue-name>
Max Number of Messages: 10
Visibility Timeout: 300
Wait Time Seconds: 20
Binary: false
```

### Event Status State Machine

```
incoming → pending → processing → done
                         └──────→ failed (retry_count++)
                                     └─ (if retry_count >= 5) → manual_review
pending (duplicate) → skipped
```

### Supabase idempotent INSERT template

```sql
INSERT INTO sp_api_events (event_id, event_type, seller_id, marketplace_id, event_time, payload, status)
VALUES ($1, $2, $3, $4, $5, $6, 'pending')
ON CONFLICT (event_id) DO NOTHING;
```

### HMAC Signature Header Convention

```
X-Timestamp: <unix_timestamp>
X-Signature: sha256=<hmac_hex_of_timestamp.body>
```

---

## 18. Useful Links

### Amazon SP-API

- [SP-API Notifications API Documentation](https://developer-docs.amazon.com/sp-api/docs/notifications-api-v1-reference)
- [SP-API Notification Types Reference](https://developer-docs.amazon.com/sp-api/docs/notifications-api-v1-use-case-guide)
- [SP-API SQS Destination Setup Guide](https://developer-docs.amazon.com/sp-api/docs/notifications-api-v1-use-case-guide#tutorial-set-up-notifications-span-idset-up-notificationsspan)
- [SP-API Developer Documentation](https://developer-docs.amazon.com/sp-api/docs/welcome)
- [Amazon SP-API Python Library](https://github.com/saleweaver/python-amazon-sp-api)

### AWS

- [SQS Developer Guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html)
- [SQS Pricing](https://aws.amazon.com/sqs/pricing/)
- [Amazon EventBridge Documentation](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-what-is.html)
- [IAM Policy Generator](https://awspolicygen.s3.amazonaws.com/policygen.html)
- [SQS Long Polling Guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-short-and-long-polling.html)

### n8n

- [n8n AWS SQS Trigger Node](https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.sqstrigger/)
- [n8n Webhook Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [n8n Error Workflow Documentation](https://docs.n8n.io/flow-logic/error-handling/)
- [n8n Execute Workflow Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflow/)

### Security

- [HMAC-based Authentication (IETF RFC 2104)](https://www.rfc-editor.org/rfc/rfc2104)
- [Webhook Signature Verification Best Practices](https://webhooks.fyi/security/hmac)
- [AWS SQS Security Best Practices](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-security-best-practices.html)

### Related syncflow Skill Files

- [amazon-sp-api.md](./amazon-sp-api.md) — SP-API auth, rate limits, all endpoints
- [n8n-skill-research.md](./n8n-skill-research.md) — n8n architecture, nodes, workflow patterns
- [supabase.md](./supabase.md) — Supabase schema design, RLS, queries, auth
- [clickup-amazon-business.md](./clickup-amazon-business.md) — ClickUp task creation patterns for seller ops
