---
type: supplier
name:
country:
city:
factory_or_trader: factory       # factory | trader | hybrid
moq:                             # units, default
lead_time_days:
payment_terms:                   # e.g. 30/70 (deposit/balance)
incoterms:                       # FOB / EXW / DDP / etc
currency: USD
since:
status: active                   # active | shadow | dormant | dropped
skus_supplied: []
defect_rate_lifetime:            # %, lifetime
last_sample: YYYY-MM-DD
last_audit: YYYY-MM-DD
tags: [supplier]
---

# {{ Supplier name }}

One-line on what they make for you.

---

## Contacts

| Role | Name | WeChat / WhatsApp | Email | Notes |
|---|---|---|---|---|
| Sales | | | | |
| Sourcing manager | | | | |
| QC contact | | | | |

---

## Commercial terms
- MOQ: {units}
- Lead time: {days} from PO confirmed to FOB shipment
- Payment terms: {e.g. 30% deposit, 70% before shipment}
- Incoterms: {e.g. FOB Yantian}
- Price tier: {USD per unit at MOQ vs at next break}
- Tooling owned by: {us / them / shared}

---

## SKUs supplied
- [[SKU-name-1]]
- [[SKU-name-2]]

---

## Sample log

| Date | SKU | Sample # | Outcome | Notes |
|---|---|---|---|---|
| YYYY-MM-DD | | | pass / fail / partial | |

---

## Defect history

| Date | SKU | Issue | Units affected | Resolution | Cost to us |
|---|---|---|---|---|---|
| YYYY-MM-DD | | | | | |

---

## Audit log

| Date | Type | Outcome | Doc |
|---|---|---|---|
| YYYY-MM-DD | factory visit / video / 3rd-party | pass / fail / conditional | [[link]] |

---

## Risk flags
- {e.g. Single-source for SKU X. Backup options: [[Supplier-Y]]}
- {e.g. Lunar New Year shutdown: typically Jan 20 - Feb 15}

---

## Decisions linked
- [[YYYY-MM-decision-name]]

---

## Claude prompt block

> - `/supplier-brief {{name}}` - generate negotiation prep
> - `/restock-memo {{SKU}} --supplier={{name}}` - decision draft
