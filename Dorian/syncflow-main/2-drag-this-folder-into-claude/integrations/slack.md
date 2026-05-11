# Slack · MCP setup

**Estimated time:** 5 minutes
**Tier:** Pure-artifact compatible
**What syncflow gets:** read channels and threads, search public + private messages, send messages to channels you've authorised.

---

## Why connect Slack

If Slack is where your team coordinates, this MCP lets syncflow:

- Reference the actual channels and threads where the bottleneck shows up *(e.g., "the Monday-3hr ritual" originates as a thread in #ops every week)* when diagnosing.
- Post the roadmap summary or build plan into a channel for the team — once you authorise it.
- Read existing pinned context when sequencing the rollout.

The default scope is read-only; sending requires you to confirm channel + draft per send. syncflow will never auto-broadcast.

---

## Prerequisites

- A Slack workspace where you can install apps *(or are an admin)*.
- A **bot token** *(starts with `xoxb-`)* with at least these scopes:
  - `channels:read`, `channels:history`
  - `groups:read`, `groups:history` *(private channels)*
  - `users:read`
  - `chat:write` *(only if you want syncflow to post)*
  - `search:read`

If you don't have a bot already:
1. https://api.slack.com/apps → **Create New App** → *From scratch* → name it `syncflow-mcp` (or whatever) → pick your workspace.
2. **OAuth & Permissions** → add the scopes above → install to workspace → copy the **Bot User OAuth Token** *(`xoxb-...`)*.

---

## Step 1 — Add the MCP server

Open `~/Library/Application Support/Claude/claude_desktop_config.json` and add to `mcpServers`:

```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-REPLACE_WITH_YOUR_TOKEN",
        "SLACK_TEAM_ID": "T-REPLACE_WITH_YOUR_TEAM_ID"
      }
    }
  }
}
```

Find your team ID at *workspace name → Settings & administration → Workspace settings → URL* (or via `https://<workspace>.slack.com/api/team.info` after auth).

## Step 2 — Restart Claude Desktop fully

⌘Q, reopen.

## Step 3 — Confirm

```
/health-check
```

Should report `slack` MCP connected.

---

## What syncflow will do with it

- Read channel history and threads *(only ones the bot is in)* to find concrete bottleneck examples.
- Search public + private messages for keywords like "CSV", "manual", "again" — the linguistic signals of a glue-human or CSV moment.
- Surface 1-2 illustrative threads in the diagnosis section of the roadmap *(quoted, not screenshot)*.
- On request: draft a Slack message summarising the roadmap and ask you to confirm before posting. **Never auto-posts.**

It will **not**:

- Read DMs or channels the bot isn't in.
- Post anywhere without explicit channel + content confirmation.
- Add / remove channel members or modify channel settings.

---

## Inviting the bot to channels

For the bot to see a channel, you need to `/invite @syncflow-mcp` *(or your bot name)* in that channel. The bot only sees channels it's a member of.

If you want syncflow to read **all** public channels, run `/invite @syncflow-mcp` in each — Slack has no bulk-invite API for bots.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| MCP missing after restart | Full ⌘Q, not window-close. Reopen. |
| `not_in_channel` errors | The bot isn't in the channel you're asking about. `/invite @<bot-name>` in that channel. |
| `missing_scope` | Re-edit the app at api.slack.com/apps, add the missing scope, *Reinstall to Workspace*, copy the new token, update config, restart. |
| Token leaked into a screenshot or chat | Slack apps page → *Install App* → *Reinstall* (rotates the token). Update config. |

---

## Removing it

Delete the `slack` block, save, restart. Optionally revoke the app at api.slack.com/apps → your app → *Install App* → *Revoke Tokens*.

---

## Reference

- MCP package: `@modelcontextprotocol/server-slack`
- Slack API docs: https://api.slack.com
