# Notion · MCP setup

**Estimated time:** 5 minutes
**Tier:** Pure-artifact compatible
**What syncflow gets:** search and read your Notion workspace pages, databases, and content blocks.

---

## Why connect Notion

If Notion is your team wiki / SOP / project-doc hub, this MCP lets syncflow:

- Read existing SOPs, runbooks, and project specs to ground the migration plan in your actual ops vocabulary.
- Mirror the roadmap to a Notion page after rendering, so it lives where the team already reads docs *(opt-in, never automatic)*.
- Reference real Notion page titles when explaining where future-state automations slot in.

Default scope is read-only. Write access *(creating mirror pages)* requires explicit confirmation per write.

---

## Prerequisites

- A Notion workspace with **admin** access *(needed to install integrations)*.
- A **Notion internal integration**:
  1. https://www.notion.so/my-integrations → **+ New integration**
  2. Name it `syncflow-mcp`, associate with your workspace, capabilities: read content, read user info, search.
  3. Copy the **Internal Integration Secret** *(starts with `ntn_`)*.
- **Share** specific Notion pages / databases with the integration:
  - Open a top-level page → *Share* → invite *syncflow-mcp* → grant access.
  - The integration only sees pages explicitly shared with it. Share only what's relevant.

---

## Step 1 — Add the MCP server

Open `~/Library/Application Support/Claude/claude_desktop_config.json` and add to `mcpServers`:

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": {
        "OPENAPI_MCP_HEADERS": "{\"Authorization\":\"Bearer ntn_REPLACE_WITH_YOUR_TOKEN\",\"Notion-Version\":\"2022-06-28\"}"
      }
    }
  }
}
```

The `OPENAPI_MCP_HEADERS` value is a JSON string — keep the inner double-quotes escaped as shown.

## Step 2 — Restart Claude Desktop

⌘Q. Reopen.

## Step 3 — Confirm

```
/health-check
```

Should report `notion` MCP connected.

---

## What syncflow will do with it

- Search shared pages / databases for SOP language, project specs, or runbooks relevant to the diagnosed bottleneck.
- Read 1-2 existing SOPs to phrase the future-state ops layer in your team's vocabulary.
- On request: create a Notion page mirroring the roadmap *(after asking which parent page to put it under)*. Always confirms before writing.

It will **not**:

- Touch pages not shared with the integration.
- Modify or delete existing pages without explicit per-edit confirmation.
- Read user data outside the integration's granted scopes.

---

## Sharing scope

The integration can only see pages **explicitly shared with it**. To grant access:

- Per page: *Share* → invite `syncflow-mcp`.
- Per workspace: not possible via integration — Notion requires page-level grants.

Share **read-only** unless you specifically want write *(creating mirror pages)*. You can revoke access at any time from the page's Share menu.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| MCP missing after restart | Full ⌘Q. Reopen. |
| `object_not_found` errors | The page isn't shared with the integration. Add `syncflow-mcp` to the page's share list. |
| `unauthorized` | Token expired or rotated. Regenerate at *my-integrations* and update the config. |
| `JSON parse error` in MCP startup | The `OPENAPI_MCP_HEADERS` value is malformed. Check the escaped quotes. |
| Token leaked | *my-integrations* → your integration → *Rotate secret*. Update config. |

---

## Removing it

Delete the `notion` block, save, restart. Optionally remove the integration at *my-integrations*.

---

## Reference

- MCP package: `@notionhq/notion-mcp-server`
- Notion API docs: https://developers.notion.com
