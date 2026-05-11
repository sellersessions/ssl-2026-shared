# Supabase · MCP setup

**Estimated time:** 7 minutes
**Tier:** Best with filesystem MCP (tier-2) for migration files; works without it.
**What syncflow gets:** read schemas, list tables, run SELECT queries, inspect Edge Functions, generate TypeScript types, list migrations.

---

## Why connect Supabase

If Supabase is your owned database *(or you're planning to make it one)*, this MCP lets syncflow:

- Inspect your real schema when designing the future-state owned blueprint — so the architecture isn't speculative.
- List tables and indexes to identify where current data lives versus where it should live.
- Generate TypeScript types from your schema for the build plan.
- Surface advisor warnings *(missing indexes, security gaps)* in the diagnosis.

Default scope is **read-only**. Write operations *(applying migrations, creating tables, deploying edge functions)* require explicit confirmation per call and are intentionally separate.

---

## Prerequisites

- A Supabase project you own *(or have admin access to)*.
- A **Supabase access token**:
  1. https://supabase.com/dashboard/account/tokens → **Generate new token**
  2. Name it `syncflow-mcp` → copy the token *(starts with `sbp_`)*.
- *(Optional)* The project ref *(found at *Project Settings → General → Reference ID*)* — used to scope the MCP to a single project.

---

## Step 1 — Add the MCP server

Open `~/Library/Application Support/Claude/claude_desktop_config.json` and add to `mcpServers`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=YOUR_PROJECT_REF"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_REPLACE_WITH_YOUR_TOKEN"
      }
    }
  }
}
```

`--read-only` is the safe default. Drop the flag *(and we recommend you don't, until you're ready)* only when you explicitly want write access.

`--project-ref=...` scopes the MCP to one project. Omit it to operate across all projects under the token's account.

## Step 2 — Restart Claude Desktop

⌘Q. Reopen.

## Step 3 — Confirm

```
/health-check
```

Should report `supabase` MCP connected.

---

## What syncflow will do with it

- **List tables** in your project to confirm where data actually lives.
- **Inspect schemas** — columns, types, relationships, indexes, RLS policies.
- **Run SELECT queries** *(read-only, scoped)* to sample real data when sizing the migration *("you have 12k rows in `inventory_snapshots`; the future-state schema needs to handle that volume")*.
- **List edge functions** to map current automation surface area.
- **List migrations** to understand schema history.
- **Generate TypeScript types** for the build plan, so module implementation has the right shape from day one.
- **Pull advisor warnings** *(performance, security)* into the diagnosis.

It will **not** *(while `--read-only` is set)*:

- Apply migrations or run DDL.
- Create / drop / alter tables, columns, indexes, policies.
- Deploy or modify edge functions.
- Touch storage buckets or auth users.

---

## Going read-write *(later, scoped)*

When you're ready to let syncflow apply a migration *(e.g., the Module 02 schema setup)*, edit the args:

```json
"args": [
  "-y",
  "@supabase/mcp-server-supabase@latest",
  "--project-ref=YOUR_PROJECT_REF"
]
```

*(Drop `--read-only`.)* Restart. Then ask syncflow for the migration plan; it will surface the SQL, ask for explicit OK, then apply via `apply_migration`. Always uses migrations *(not raw `execute_sql`)* for schema changes — they're tracked.

Best practice: run write-mode against a **branch project** *(Supabase's branching feature)* first, verify, then merge.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| MCP missing after restart | Full ⌘Q. Reopen. |
| `unauthorized` | Token expired or rotated. Regenerate and update config. |
| `project_not_found` | Wrong `--project-ref`. Check Project Settings → General → Reference ID. |
| Schema queries timeout | Project is paused. Visit the dashboard to wake it up. |
| Token leaked | Revoke at *account/tokens*; regenerate; update config. |

---

## Removing it

Delete the `supabase` block, save, restart. Optionally revoke the access token.

---

## Reference

- MCP package: `@supabase/mcp-server-supabase`
- Docs: https://supabase.com/docs/guides/getting-started/mcp
