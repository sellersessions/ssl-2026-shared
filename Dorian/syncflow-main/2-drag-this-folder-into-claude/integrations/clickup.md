# ClickUp · MCP setup

**Estimated time:** 5 minutes
**Tier:** Pure-artifact compatible *(no filesystem MCP required)*
**What syncflow gets:** read access to your workspace hierarchy (spaces / folders / lists / tasks), task comments, time entries, custom fields, and members.

---

## Why connect ClickUp

If your team operates in ClickUp, this MCP lets syncflow:

- Read the existing list / folder / task structure when sequencing the migration plan — so module rollout slots into your real ops, not a fictional one.
- Surface time-tracking data when diagnosing the bottleneck *(if you use ClickUp time tracking)*.
- Reference real task names and comments when designing the future-state ops layer.

It does **not** create / update / delete anything by default. syncflow treats ClickUp as read-only in the consultant scope. If you later want write access *(creating the migration-plan tasks for you)*, ask explicitly and re-config.

---

## Prerequisites

- A ClickUp workspace you have at least **member** access to.
- A ClickUp **personal API token**:
  1. ClickUp → top-right avatar → **My Settings**
  2. **Apps** → **API Token** → *Generate*
  3. Copy the token *(starts with `pk_`)*. Treat it like a password.

---

## Step 1 — Add the MCP server to Claude Desktop

Open the Claude Desktop config:

```
~/Library/Application Support/Claude/claude_desktop_config.json
```

If the file doesn't exist yet, create it. Paste this `mcpServers` entry (merge with anything already there — don't overwrite siblings):

```json
{
  "mcpServers": {
    "clickup": {
      "command": "npx",
      "args": ["-y", "@hauptsache.net/clickup-mcp"],
      "env": {
        "CLICKUP_API_KEY": "pk_REPLACE_WITH_YOUR_TOKEN"
      }
    }
  }
}
```

If you already have other MCP servers *(filesystem, etc.)*, leave them untouched and add `clickup` alongside.

## Step 2 — Restart Claude Desktop

Quit fully *(⌘Q — closing the window doesn't reload MCP servers)*. Reopen.

## Step 3 — Confirm

In your syncflow Project chat, type:

```
/health-check
```

syncflow should report `clickup` MCP connected. If not, see Troubleshooting below.

---

## What syncflow will do with it

When the ClickUp MCP is live, syncflow will:

- Read your **workspace hierarchy** when generating the migration plan, so module rollout maps to your real spaces/folders.
- Reference **specific task names** when explaining where a future-state automation slots in.
- Pull **time entries** *(if you track time in ClickUp)* when diagnosing the bottleneck — so "you spend 3 hours / week on the Mondays ritual" gets backed by your data, not a guess.
- Cite real ClickUp examples in the **Featured Module** deep-dive when relevant.

It will **not**:

- Create, update, or delete tasks / lists / folders / spaces.
- Modify custom fields or automations.
- Add or remove members.

If you want write access for a specific build *(e.g., "create the Module 02 tasks in ClickUp for me")*, ask explicitly and we'll guide a scoped re-config — not a default.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `/health-check` says ClickUp MCP missing | You didn't fully quit Claude Desktop. ⌘Q (not just close window), then reopen. |
| ClickUp MCP shows up but syncflow can't read your workspace | Token is invalid or expired. Regenerate at *My Settings → Apps → API Token* and re-paste into the config. Restart again. |
| `npx` errors in the MCP startup logs | Node 18+ not installed. `brew install node` and restart. |
| `pk_...` token leaked into a screenshot or chat | Regenerate the token in ClickUp; the old one stops working immediately. |

---

## Removing it

Delete the `clickup` block from `claude_desktop_config.json`, save, restart Claude Desktop. The token is yours; revoke it from ClickUp's API Token page if you want it permanently dead.

---

## Reference

- ClickUp API docs: https://clickup.com/api
- MCP package: `@hauptsache.net/clickup-mcp` *(npm)*

If your team uses a different ClickUp MCP package, the wiring is the same shape — only the `command`, `args`, and env-var name change.
