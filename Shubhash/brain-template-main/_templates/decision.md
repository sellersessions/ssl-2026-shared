---
type: decision
date: YYYY-MM-DD
title:
status: proposed                 # proposed | decided | reversed | superseded
reversibility: low               # low | medium | high (1-way vs 2-way door)
owner:
sku: [[]]
supplier: [[]]
channel: [[]]
estimated_impact:                # $ value or % delta
follow_up_date:
tags: [decision]
---

# {{ Decision title }}

One-line summary.

---

## Context
What's the situation? What forced this decision now?

---

## Options considered

| Option | Pros | Cons | Estimated impact |
|---|---|---|---|
| A. | | | |
| B. | | | |
| C. (chosen) | | | |

---

## Decision
Plain-English statement of what we are doing.

---

## Reversibility
- One-way door (hard / impossible to reverse): {yes / no}
- If we are wrong, what does it cost? {$ or time}
- What signal would tell us we are wrong? {metric, threshold, by when}

---

## Sign-off

| Role | Name | Date |
|---|---|---|
| Operator | | |
| Reviewer (if any) | | |

---

## Follow-up
- Review on: YYYY-MM-DD
- Owner: {person}
- What we are checking: {specific metric or outcome}
