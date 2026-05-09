# `florence-help`

**When**
- User says: "help", "help", "Florence stopped working", "I'm stuck", "this isn't working"
- Another skill calls this with a structured failure (HTTP status, error message, which skill failed)
- User uploads a brain.json that fails restore

**Inputs**
- The user's complaint or the failure context handed in
- Result of `skills/setup-validate.md` (called silently by this skill)
- In-context brain (so suggestions are specific to this user's setup)

**Tools**
- Chat (one targeted clarifying question max)
- `skills/setup-validate.md` (called silently to capture state snapshot)
- Reference: `integrations/n8n.md`, `integrations/sellerapp.md`, `integrations/product-pinion.md` for fix steps

**Outputs**
- Specific fix steps in chat (not generic advice)
- A re-validation after the fix lands
- For unknown failures: an honest "I don't recognise this" + workaround + escalation path

---

## Behaviour

### Step 1 — Listen

If a skill called `help` with a failure context (status code, message, skill name), use it directly.

If the user typed `help` ad-hoc, ask one short question:

> What's going wrong?

Don't ask a battery of diagnostic questions. One open question, then look.

### Step 2 — Snapshot state

Run `skills/setup-validate.md` silently (capture the result; don't render the artifact). This gives a current state snapshot regardless of what the user said.

### Step 3 — Match against the runbook

The most common failures and fixes:

| Symptom | Likely cause | Fix |
|---|---|---|
| Webhook returns 401/403 | Shared secret mismatch | Check `integrations/n8n-webhooks.md` `secret:` matches the value pasted into n8n's *Florence — Webhook Secret* credential |
| Webhook returns 404 | Workflow not active in n8n | Tell user to toggle the workflow on in n8n's UI |
| Webhook returns 500 | Workflow has an internal error | Suggest checking n8n's Executions tab; offer to interpret the error if they paste it |
| Webhook returns timeout | URL wrong, or n8n instance asleep (Cloud free tier) | Suggest reactivating the workflow; if Cloud free, this is normal latency on first call |
| `florence-shopper-pp-openended-launch` returns 422 | Poll payload malformed (missing `target_url` or `question`) | Re-run with the canonical payload from `skills/shopper-interrogator.md` Step 2 |
| Anthropic API call returns 401 | API key wrong | Check the *Florence — Anthropic API* credential in n8n; the key starts `sk-ant-` |
| Brain restore fails | Schema mismatch (`schema_version` doesn't match `templates/brain-schema.json`) | Either upgrade the file (Florence offers a migration if the bump is supported) or fall back to fresh `onboard` |
| User says "Florence reverted to default Claude voice" | Custom Instructions drift on long sessions | Start a new chat in the same project; Custom Instructions reload |
| User says "Florence forgot my brand" | brain.json not in Project Knowledge, or session memory cleared | Ask user to re-upload `brain.json`; route to `skills/restore-brain.md` |
| `setup-validate` shows the webhooks file isn't in Knowledge | User filled URLs locally but didn't drag the file back into Cowork | Tell user to drag `integrations/n8n-webhooks.md` (their filled version) into Project Knowledge |

### Step 4 — Apply the fix

Always specific. Two-step format:

> Two things to check:
> 1. Open n8n → Workflows → "Florence — Shopper — Review Mining". Check the toggle in the top-right is "Active".
> 2. Click the Webhook node → copy the Production URL → check it matches what's in `integrations/n8n-webhooks.md` for the `review-mining` key.
>
> Tell me when done and I'll re-validate.

### Step 5 — Re-validate

After the user says they've fixed something, run `skills/setup-validate.md` again. Confirm the previously-red row is now green. If it isn't, pick the next-most-likely cause from the table.

---

## When the runbook doesn't match

If the failure isn't in the table:

> I don't recognise this one. Two ways forward:
>
> 1. Paste the n8n execution log here — the relevant workflow's Executions tab will show what failed.
> 2. Open an issue at the Florence repo: github.com/ctrboost/florence/issues. Include the workflow name and the error.
>
> If it's blocking your daily brief, here's a workaround for now: …

The workaround should be specific to what the user was trying to do. *"You can still get today's brief without the reports webhook — the priority pick will come from the brain alone, missing the latest sales numbers."*

---

## Don't

- Don't pretend to fix something you can't verify. If you suggest a fix, follow up with `setup-validate` to prove it worked.
- Don't escalate to "rebuild from scratch" advice. Almost every failure is a single misconfiguration.
- Don't read raw secrets to the user. The shared secret in `integrations/n8n-webhooks.md` is private; refer to it as "your secret" not by value.
- Don't ask a battery of diagnostic questions. One open question, snapshot state, then act.
- Don't blame the user. The frustration of breakage is enough; Florence's role is to fix calmly.