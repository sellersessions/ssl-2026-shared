# n8n · MCP setup

**Estimated time:** 7 minutes
**Tier:** Pure-artifact compatible *(works against n8n Cloud or self-hosted)*
**What syncflow gets:** search nodes, get SDK reference, prepare workflow code, validate workflows, create / update / archive workflows in your n8n instance.

---

## Why connect n8n

If n8n is *(or will be)* your orchestration glue, this MCP lets syncflow:

- Read your existing workflows when sequencing the migration plan — so we don't propose duplicating something that already exists.
- Discover available nodes (Gmail, Slack, Schedule Trigger, Set, If, Merge, Code, etc.) when designing flows.
- Validate proposed workflow code against the n8n SDK *before* you implement.
- On request *(write-mode opt-in)*: scaffold the workflow in your instance, ready for you to test.

Read-only by default. Write *(create / update / archive workflows)* is opt-in and asks before each call.

---

## Prerequisites

- An **n8n instance** — either:
  - **n8n Cloud:** sign up at https://app.n8n.cloud — your instance URL is `https://<your-name>.app.n8n.cloud`, or
  - **Self-hosted:** running locally or on your server, accessible at `https://n8n.yourdomain.com` *(or `http://localhost:5678` for dev)*.
- An **n8n API key**:
  1. Open your n8n instance → top-right user menu → **Settings → API**.
  2. Click *Create an API Key*. Copy the token.
  3. Treat it like a password.

---

## Step 1 — Add the MCP server

Open `~/Library/Application Support/Claude/claude_desktop_config.json` and add to `mcpServers`:

```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": ["-y", "n8n-mcp"],
      "env": {
        "N8N_API_URL": "https://YOUR-INSTANCE.app.n8n.cloud",
        "N8N_API_KEY": "REPLACE_WITH_YOUR_KEY"
      }
    }
  }
}
```

For self-hosted, set `N8N_API_URL` to your full instance URL *(e.g., `http://localhost:5678` for local dev)*. The API key is per-instance.

## Step 2 — Restart Claude Desktop

⌘Q. Reopen.

## Step 3 — Confirm

```
/health-check
```

Should report `n8n` MCP connected.

---

## What syncflow will do with it

When the n8n MCP is live, syncflow will:

- **Search existing workflows** in your instance to avoid proposing duplicates.
- **Search nodes** to ground each future-state automation in real, available primitives.
- **Validate proposed workflow code** against the n8n SDK before recommending it — broken workflows don't make it into the build plan.
- **Generate test pin data** to dry-run a flow before publishing.
- On request, **create the workflow** in your instance *(unpublished by default — you publish after testing)*.
- **Get execution logs** when troubleshooting a workflow you've built.

It will **not**:

- Auto-publish workflows. Creation defaults to draft / unpublished.
- Touch credentials. Credential setup stays in n8n's UI for security.
- Delete workflows without explicit per-call confirmation *(use `archive_workflow` to reversibly remove)*.

---

## The build pattern syncflow follows

Every n8n flow syncflow proposes goes through this pipeline *(per principle #2: plan before execute, and #4: verification > speed)*:

1. **`search_nodes`** for the services involved.
2. **`get_node_types`** for exact parameter definitions — no guessing.
3. **Write the workflow code** following SDK guidelines.
4. **`validate_workflow`** until valid.
5. **`prepare_test_pin_data`** for dry-run input.
6. **`test_workflow`** locally.
7. Only after that, **`create_workflow_from_code`** in your instance.
8. You publish via `publish_workflow` after manual review.

This is non-negotiable — it's how Sim's verification > speed principle gets enforced for orchestration code.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| MCP missing after restart | Full ⌘Q. Reopen. |
| `401 unauthorized` | Wrong API key, or key expired. Regenerate at *Settings → API*. |
| `connection refused` | Wrong `N8N_API_URL`. Confirm the URL works in a browser; check trailing slash. |
| `workflow validation failed` after create | The workflow code didn't pass `validate_workflow` first. Re-validate. Don't bypass. |
| Self-hosted instance not reachable | Check that the n8n public URL matches `N8N_API_URL` and that the instance is up. |
| Token leaked | Regenerate at *Settings → API*; old key stops working. Update config. |

---

## Removing it

Delete the `n8n` block, save, restart. Optionally regenerate the API key in n8n.

---

## Reference

- MCP package: `n8n-mcp`
- n8n SDK docs: https://docs.n8n.io
- n8n Cloud: https://app.n8n.cloud
