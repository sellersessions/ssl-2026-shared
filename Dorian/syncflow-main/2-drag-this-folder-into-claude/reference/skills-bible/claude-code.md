# Claude Code — Expert Reference for syncflow Build Execution

> **Scope:** Everything the syncflow system needs to know about Claude Code as an autonomous build execution engine — installation, CLAUDE.md authoring, MCP server wiring (Supabase, n8n, ClickUp), prompt engineering for cc-prompts, token discipline, failure recovery, and the full permissions model. This is not a neutral survey — it is the opinionated, practitioner-level guide for generating and executing build plans on the syncflow Supabase + n8n + ClickUp stack.
> **NOT covered here:** Claude CoWork, connector ecosystem, plugin marketplace — those are in `claude-connectors-cowork-code.md`.
> **Last Updated:** May 2026

---

## Table of Contents

1. [What Claude Code Is — and What It Isn't](#1-what-claude-code-is--and-what-it-isnt)
2. [Installation and Setup](#2-installation-and-setup)
3. [Interactive vs Non-Interactive Modes](#3-interactive-vs-non-interactive-modes)
4. [CLAUDE.md Files — Persistent Project Context](#4-claudemd-files--persistent-project-context)
5. [MCP Server Configuration](#5-mcp-server-configuration)
6. [Project Knowledge — What Claude Code Reads Automatically](#6-project-knowledge--what-claude-code-reads-automatically)
7. [Permissions Model](#7-permissions-model)
8. [Agentic Execution Patterns](#8-agentic-execution-patterns)
9. [Working with Supabase MCP Inside Claude Code](#9-working-with-supabase-mcp-inside-claude-code)
10. [Working with n8n MCP Inside Claude Code](#10-working-with-n8n-mcp-inside-claude-code)
11. [Working with ClickUp MCP Inside Claude Code](#11-working-with-clickup-mcp-inside-claude-code)
12. [Writing Effective cc-Prompts for syncflow](#12-writing-effective-cc-prompts-for-syncflow)
13. [Cost and Token Discipline](#13-cost-and-token-discipline)
14. [Common Failure Modes and Recovery](#14-common-failure-modes-and-recovery)
15. [Verification From Within Claude Code](#15-verification-from-within-claude-code)
16. [Version and Update Management](#16-version-and-update-management)
17. [Dos and Don'ts](#17-dos-and-donts)

---

## 1. What Claude Code Is — and What It Isn't

### The Core Concept

Claude Code is Anthropic's **CLI-based agentic coding tool**. It is a terminal process — you install it with npm, you call it with `claude`, and it reads your files, runs commands, calls MCP-connected APIs, writes code, and executes build tasks with minimal human intervention. Think of it less like a chatbot and more like a capable junior engineer you can script against.

For syncflow specifically: Claude Code is the **build execution layer**. syncflow's AI planner generates structured build plans (cc-prompts); Claude Code is what *runs* those plans — spinning up Supabase schemas, creating n8n workflows, scaffolding ClickUp task structures, and wiring everything together.

### How It Differs from CoWork

| Dimension | Claude Code | Claude CoWork |
|---|---|---|
| Interface | Terminal / CLI | Desktop app / GUI |
| Primary user | Developers, automated pipelines | Non-technical operators |
| Context source | CLAUDE.md + file system + MCP | Chat history + connected apps |
| Best for | Building, editing, deploying code | Researching, drafting, managing work |
| MCP config | `~/.claude.json` (per-project) | Connectors UI (global) |
| Automation | Fully scriptable (`--print` flag) | Conversational only |
| Cost model | Per token (API / Max plan) | Plan subscription |

They share the same underlying MCP protocol. An MCP server you configure in Claude Code also works in CoWork — but the configuration method is different and the use cases diverge significantly.

### What Claude Code Excels At

- Reading an entire codebase and making contextually correct edits across multiple files in one shot
- Executing multi-step build sequences: create schema → seed data → generate TypeScript types → write n8n integration → update ClickUp task
- Running shell commands, interpreting their output, and reacting (e.g., running a migration and then checking if it errored)
- Working within a project's file system with full read/write access
- Operating in fully automated pipelines where no human is present (headless/non-interactive mode)
- Calling multiple MCP servers in a single session — hitting Supabase for schema state, n8n for workflow creation, and ClickUp for task tracking all without switching contexts

### What Claude Code Is NOT Good At

- Long-running daemons or persistent services — it's a one-shot agent, not a server
- Tasks requiring visual UI interaction (use CoWork or computer use for that)
- Keeping state across sessions without explicit checkpointing (CLAUDE.md or progress files)
- Tasks where the file scope is unbounded or unclear — it needs to know what to touch

---

## 2. Installation and Setup

### Prerequisites

- **Node.js 18+** (LTS recommended). Check with `node --version`.
- An **Anthropic account** with Claude Max plan or an API key with billing enabled.
- macOS, Linux, or Windows (WSL2 recommended on Windows).

### Install

```bash
npm install -g @anthropic-ai/claude-code
```

Verify installation:

```bash
claude --version
```

### Authenticate

```bash
claude login
```

This opens a browser for OAuth. After authenticating, credentials are stored in `~/.claude.json`. For CI/CD environments where browser login isn't possible, set the environment variable instead:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### First Run

Navigate to a project directory, then:

```bash
cd /path/to/your/project
claude
```

This starts the interactive REPL. Claude Code will automatically read any `CLAUDE.md` in the current directory.

### Initialise a CLAUDE.md

```bash
claude /init
```

This scans your project structure and generates a starter `CLAUDE.md`. Edit it — the generated file is a scaffold, not the final product.

### IDE Integration

Claude Code has a first-class VS Code extension (install from the VS Code marketplace). The extension gives you:
- Inline diff views for proposed edits
- A conversation panel embedded in the IDE
- The full Claude Code engine behind the scenes — same tool, just surfaced in VS Code

---

## 3. Interactive vs Non-Interactive Modes

### Interactive Mode (Default)

Invoking `claude` in a terminal starts an interactive REPL. You type prompts, Claude Code responds, asks for confirmation on destructive operations, and maintains conversation state for the session. This is the right mode for development, debugging, and exploratory builds.

**Key REPL commands:**

| Command | Effect |
|---|---|
| `/help` | Show available slash commands |
| `/init` | Generate CLAUDE.md for current project |
| `/clear` | Clear conversation history (free context, start fresh) |
| `/compact` | Summarise conversation history to free context without losing thread |
| `/usage` | Show token usage and estimated cost for current session |
| `/config` | Open configuration menu |
| `/effort [low\|medium\|high]` | Adjust reasoning depth (affects thinking tokens) |
| `/mcp` | Show configured MCP servers and their status |
| `Escape` | Cancel current tool call mid-execution |
| `Ctrl+C` | Exit the session |

### Non-Interactive (Headless) Mode — `--print` / `-p`

The `--print` flag is what makes Claude Code usable in automated pipelines. It processes a prompt, outputs to stdout, and exits — no interactive session, no waiting for human confirmation.

```bash
claude -p "Create the migration for the amazon_listings table as specified in CLAUDE.md"
```

**Essential flags for non-interactive use:**

| Flag | Purpose |
|---|---|
| `-p "prompt"` | Run non-interactively with this prompt |
| `--allowedTools "Read,Edit,Bash"` | Whitelist specific tools (no confirmation required for these) |
| `--output-format json` | Return structured JSON output instead of plain text |
| `--dangerously-skip-permissions` | Bypass all confirmation prompts (see section 7) |
| `--model claude-sonnet-4-6` | Specify model explicitly |
| `--max-turns 30` | Limit the number of agentic turns (prevents infinite loops) |

**Piping input:**

```bash
# Pipe a generated prompt from syncflow's planner into Claude Code
echo "$(cat build-plan.txt)" | claude -p - --allowedTools "Read,Edit,Bash,mcp__supabase__*"
```

**Capturing structured output:**

```bash
RESULT=$(claude -p "List all tables in the syncflow-prod project" --output-format json)
echo $RESULT | jq '.result'
```

**When to use each mode:**

- **Interactive:** Development sessions, debugging, first-time builds, anything needing human review
- **Non-interactive:** syncflow automated build execution, CI/CD pipelines, scheduled maintenance tasks, batch migrations

---

## 4. CLAUDE.md Files — Persistent Project Context

### What CLAUDE.md Is

CLAUDE.md is a Markdown file Claude Code reads **automatically at the start of every session**. It is your mechanism for giving Claude Code persistent, project-specific knowledge that it can't infer from the code itself — conventions, architecture decisions, environment details, and build rules.

Think of it as the onboarding document you'd give a new engineer, optimised for an AI reader.

### Two Scopes

**Project-level** — `./CLAUDE.md` (in the project root)
- Loaded when you run `claude` from that directory
- Contains project-specific instructions: stack overview, schema conventions, environment variables, build steps
- Should be committed to version control so the team gets the same context

**User-level** — `~/.claude/CLAUDE.md`
- Loaded for every project, every session
- Contains cross-project preferences: response style, tool preferences, personal conventions
- Not committed to version control

You can also nest `CLAUDE.md` files in subdirectories — Claude Code will load them when working in that folder.

### What to Put in CLAUDE.md

**Good candidates:**
- Stack overview and technology choices with rationale
- Database schema conventions (naming, types, RLS policy patterns)
- Environment variable names (not values — never commit secrets)
- Build sequence for this project type
- File structure conventions
- How to run tests and what "success" looks like
- Known gotchas specific to this project

**Keep out:**
- Secrets, API keys, passwords (use env vars)
- Information Claude Code can infer by reading the code
- Verbose explanations that bloat context — keep it under 200 lines

### Rules Files (Context-Efficient Scoping)

For large projects, use `rules` frontmatter to scope instructions to specific file patterns:

```markdown
---
paths: ["src/supabase/**", "migrations/**"]
---

## Database Rules

All migrations must use timestamped filenames: `YYYYMMDDHHMMSS_description.sql`.
Never use `DROP TABLE` directly — use soft deletes with `deleted_at TIMESTAMPTZ`.
All tables must have `created_at`, `updated_at`, and `id UUID DEFAULT gen_random_uuid()`.
```

This rule only loads context when Claude Code is working on Supabase or migration files, saving tokens during unrelated work.

### Example CLAUDE.md for a syncflow Build Project

```markdown
# syncflow Build Project — CLAUDE.md

## Stack
- **Database:** Supabase (PostgreSQL) — project ref: [SUPABASE_PROJECT_REF]
- **Automation:** n8n (self-hosted, accessible via MCP)
- **Task management:** ClickUp (workspace: syncflow)
- **Language:** TypeScript (Node 20)
- **Package manager:** npm

## MCP Servers Available
- `supabase` — read/write access to syncflow-prod. Use for schema inspection, migrations, data queries.
- `n8n` — workflow CRUD. Use to create/update/activate workflows.
- `clickup` — task creation and status updates. Use to mark build milestones.

## Environment Variables (never commit values)
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (full access)
- `N8N_API_KEY` — n8n API key
- `CLICKUP_API_TOKEN` — ClickUp personal token

## Database Conventions
- All table names: `snake_case`, plural (e.g., `amazon_listings`, `ad_campaigns`)
- All IDs: `UUID DEFAULT gen_random_uuid()` — never serial integers
- All timestamps: `TIMESTAMPTZ DEFAULT NOW()` — always with time zone
- Soft deletes: `deleted_at TIMESTAMPTZ` — never `DROP` rows in production
- RLS: enabled on all tables, service role bypasses for n8n
- Migrations: timestamped SQL files in `/migrations/`, never edited after applying

## n8n Conventions
- Workflow names: `[BRAND] — [Function] — [Trigger]` (e.g., "Acme — PPC Sync — Daily 6am")
- All workflows must have an Error Trigger node wired to Slack alert
- Webhook paths: `/webhook/[brand-slug]/[action]`
- Credentials: referenced by name, never hardcoded in nodes

## ClickUp Conventions
- Build completion task: update status to "Complete" in the Build Tracker list
- Each major milestone (schema deployed, workflows active, types generated): add a comment to the task

## Build Verification Sequence
1. Run migration → confirm via `supabase` MCP (list tables, check columns)
2. Generate TypeScript types → write to `src/types/supabase.ts`
3. Create n8n workflows → activate and run once to confirm no errors
4. Update ClickUp task → status "Complete" + comment with what was built

## Common Commands
```bash
npm run build          # Compile TypeScript
npm run typecheck      # Type check only, no emit
npm run test           # Run tests (Vitest)
```

## Notes for Claude Code
- Never use `--dangerously-skip-permissions` without confirming with the build plan
- Always check MCP server connectivity with `/mcp` before starting a build
- If context fills past 70%, run /compact before continuing
```

---

## 5. MCP Server Configuration

### Configuration File Location

**Critical:** Claude Code stores MCP server configurations in `~/.claude.json`, **not** in `settings.json`. This is a common source of confusion.

```
~/.claude.json          — user-scope MCP servers + global settings
./.mcp.json             — project-scope MCP servers (shareable via git)
```

### Adding MCP Servers via CLI (Recommended)

```bash
# Add a server (local scope = only for this project)
claude mcp add supabase npx @supabase/mcp-server-supabase@latest \
  --env SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN

# Add a server (user scope = available in all projects)
claude mcp add supabase npx @supabase/mcp-server-supabase@latest \
  --scope user \
  --env SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN

# Add a server (project scope = stored in .mcp.json, commitable)
claude mcp add supabase npx @supabase/mcp-server-supabase@latest \
  --scope project \
  --env SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN

# List all configured servers
claude mcp list

# Get details for a specific server
claude mcp get supabase

# Remove a server
claude mcp remove supabase
```

### Manual Configuration in `.mcp.json`

For team-shared project configs, commit `.mcp.json` to the repo root:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["@supabase/mcp-server-supabase@latest"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"
      }
    },
    "n8n": {
      "command": "npx",
      "args": ["n8n-mcp"],
      "env": {
        "N8N_HOST": "${N8N_HOST}",
        "N8N_API_KEY": "${N8N_API_KEY}"
      }
    },
    "clickup": {
      "command": "npx",
      "args": ["@joshuarileydev/clickup-mcp-server"],
      "env": {
        "CLICKUP_API_TOKEN": "${CLICKUP_API_TOKEN}"
      }
    },
    "github": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    }
  }
}
```

Environment variable placeholders (`${VAR_NAME}`) are resolved from the shell environment at runtime — secrets never appear in committed files.

### MCP Tool Search (Lazy Loading)

By default, all MCP tools are loaded into context at session start, which can consume thousands of tokens per server. With **MCP Tool Search** (introduced in Claude Code's 2025 updates), tools are loaded on demand:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["@supabase/mcp-server-supabase@latest"],
      "env": { "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}" },
      "toolSearch": true
    }
  }
}
```

With `toolSearch: true`, Claude Code only loads a tool's full schema when it searches for and selects it — reducing MCP-related context usage by up to 95% in sessions that only use a subset of available tools.

### Tool Namespacing

MCP tools are namespaced as `mcp__[server-name]__[tool-name]`. For example:
- `mcp__supabase__execute_sql`
- `mcp__n8n__create_workflow`
- `mcp__clickup__create_task`

When using `--allowedTools` in non-interactive mode, you can allow an entire server with a glob:

```bash
claude -p "Run the migration" \
  --allowedTools "Read,Bash,mcp__supabase__*"
```

### Checking MCP Status in a Session

```
/mcp
```

This shows each configured server, its status (connected / error), and a count of available tools. Always run this at the start of a build session — if a server is down, you want to know before the build plan fails halfway through.

---

## 6. Project Knowledge — What Claude Code Reads Automatically

On session start, Claude Code automatically reads and indexes:

1. **`CLAUDE.md`** (all scopes — user, project, subdirectory)
2. **`.mcp.json`** — registered MCP servers
3. **`.claude/settings.json`** — project-level permissions and tool config

It does **not** automatically read your entire codebase — that would be prohibitively expensive. Instead, Claude Code reads files on demand as it works. It builds a mental model by:

- Reading files you reference explicitly in your prompt
- Reading files it discovers through exploration (e.g., following imports)
- Running shell commands to enumerate directory structures

### Structuring a Project for Good Claude Code Context

```
project-root/
├── CLAUDE.md                  ← loaded at start, every session
├── .mcp.json                  ← MCP server config (shareable)
├── .claude/
│   └── settings.json          ← permissions, tool config
├── migrations/
│   ├── 20260101000000_init.sql
│   └── 20260215000000_add_listings.sql
├── src/
│   ├── types/
│   │   └── supabase.ts        ← generated types (reference frequently)
│   └── index.ts
├── claude-progress.txt        ← build checkpoint file (update during builds)
└── package.json
```

**`claude-progress.txt`** is a syncflow-specific pattern — Claude Code writes build checkpoints here at each major milestone. If a session crashes, the next session reads this file and continues from the last checkpoint rather than starting from scratch.

---

## 7. Permissions Model

### What Claude Code Can Do Without Asking

By default, Claude Code auto-approves:
- Reading any file in the project directory
- Running read-only shell commands (e.g., `ls`, `cat`, `grep`, `npm run typecheck`)
- Calling MCP tools marked as read-only (e.g., `list_tables`, `get_workflow`)

### What Requires Confirmation

Claude Code will pause and ask for confirmation before:
- Writing or editing files
- Running commands that modify state (e.g., `npm install`, database migrations)
- Making network requests not covered by MCP servers
- Destructive operations (`rm`, `DROP`, etc.)
- Writing to sensitive paths (`.env`, shell config files, `.git/`)

### Configuring Allow/Deny Rules

In `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run build)",
      "Bash(npm run typecheck)",
      "Bash(npm run test)",
      "Read(**/*)",
      "mcp__supabase__execute_sql",
      "mcp__supabase__list_tables",
      "mcp__n8n__create_workflow",
      "mcp__clickup__create_task"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Read(.env*)",
      "Read(**/*.key)",
      "mcp__supabase__delete_branch"
    ]
  }
}
```

Permission evaluation order: **deny rules always win**, even over `--dangerously-skip-permissions`.

### `--dangerously-skip-permissions`

This flag bypasses all confirmation prompts. Claude Code will write files, run commands, and modify state without stopping to ask.

```bash
claude -p "$(cat build-plan.txt)" \
  --dangerously-skip-permissions \
  --allowedTools "Read,Edit,Write,Bash,mcp__supabase__*,mcp__n8n__*,mcp__clickup__*"
```

**When it's appropriate:**
- Fully automated syncflow pipeline runs where a human has already reviewed the build plan
- CI/CD environments where the scope of operations is well-defined and tested
- Sandboxed dev environments (not production)

**When it is NOT appropriate:**
- Production database operations — always confirm migrations manually
- First-time builds of a new module type where the build plan hasn't been validated
- Any context where the build plan source is untrusted

**Important:** Even with `--dangerously-skip-permissions`, deny rules in `settings.json` still apply. This is your backstop.

---

## 8. Agentic Execution Patterns

### How Claude Code Plans a Multi-Step Build

When given a complex cc-prompt, Claude Code doesn't execute blindly. It follows an internal plan:

1. **Read CLAUDE.md and orient** — understand the project context, stack, conventions
2. **Inspect current state** — read relevant files, check MCP connectivity, enumerate tables/workflows that already exist
3. **Form a plan** — decompose the task into tool call sequences, identify dependencies between steps
4. **Execute with checkpoints** — complete each step, verify the outcome before proceeding to the next
5. **Report completion** — summarise what was built, what changed, any anomalies

For syncflow builds, the typical tool call sequence looks like:

```
Read(CLAUDE.md)
→ mcp__supabase__list_tables (check what exists)
→ mcp__supabase__execute_sql (run migration)
→ mcp__supabase__list_tables (confirm tables created)
→ mcp__supabase__generate_typescript_types
→ Write(src/types/supabase.ts)
→ Bash(npm run typecheck)
→ mcp__n8n__create_workflow (create workflow JSON)
→ mcp__n8n__activate_workflow
→ mcp__clickup__update_task (mark milestone)
→ Write(claude-progress.txt)
```

### Subagents — Parallel Build Execution

For complex modules, Claude Code can spawn subagents to execute tasks in parallel:

```
/create subagent — run migrations in Supabase and set up n8n workflows in parallel
```

Or from a cc-prompt:

```
Use a subagent to create the n8n error-handling workflow while the main agent
handles the Supabase schema migration. Both must complete before the TypeScript
types are regenerated.
```

Subagents run with independent context windows but can share files. Use them when two parts of a build are truly independent and you want to save wall-clock time.

### Checkpointing for Recovery

Claude Code has no built-in persistence across sessions — when you close a session, the conversation history is gone. For multi-hour builds, implement explicit checkpointing:

**Pattern — `claude-progress.txt`:**

```
[2026-05-06 14:32] STARTED — Module: PPC Sync v2
[2026-05-06 14:34] DONE — Migration applied: 20260506143200_ppc_campaigns.sql
[2026-05-06 14:36] DONE — Tables verified: ppc_campaigns, ppc_ad_groups, ppc_keywords
[2026-05-06 14:38] DONE — TypeScript types generated: src/types/supabase.ts
[2026-05-06 14:41] IN PROGRESS — n8n workflow: PPC Daily Sync
[INTERRUPTED]
```

The recovery prompt for the next session:

```
Read claude-progress.txt. The previous build session was interrupted.
Resume from the last completed checkpoint. Do not re-run completed steps.
```

---

## 9. Working with Supabase MCP Inside Claude Code

### Setup

```bash
# Install the Supabase MCP server
claude mcp add supabase npx @supabase/mcp-server-supabase@latest \
  --scope project \
  --env SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN
```

The `SUPABASE_ACCESS_TOKEN` is your Supabase personal access token (not the project-level service key). It gives the MCP server access to your organisation's projects.

### Available Tool Categories

The Supabase MCP exposes 20+ tools, covering:
- SQL execution (`execute_sql`)
- Schema inspection (`list_tables`, `get_table`)
- Migration management (`apply_migration`, `list_migrations`)
- Type generation (`generate_typescript_types`)
- Branch management (`create_branch`, `list_branches`, `merge_branch`)
- Project configuration (`get_project`, `get_project_url`)
- Logs and debugging (`get_logs`)
- Extensions (`list_extensions`)

### Example Build Session — Schema Migration + Type Generation

**cc-prompt:**
```
Using the Supabase MCP (project ref: syncflow-prod), apply the following migration:

CREATE TABLE amazon_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asin TEXT NOT NULL,
  brand_id UUID REFERENCES brands(id),
  title TEXT,
  bullet_points JSONB,
  price NUMERIC(10,2),
  bsr INTEGER,
  review_count INTEGER,
  review_rating NUMERIC(3,1),
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_amazon_listings_asin ON amazon_listings(asin);
CREATE INDEX idx_amazon_listings_brand_id ON amazon_listings(brand_id);

After applying, verify the table exists, then generate TypeScript types
and write them to src/types/supabase.ts.
```

**What Claude Code does:**
```
mcp__supabase__list_tables                         → confirm amazon_listings doesn't exist yet
mcp__supabase__apply_migration(sql: "CREATE TABLE...") → apply the migration
mcp__supabase__list_tables                         → confirm amazon_listings now exists
mcp__supabase__execute_sql("SELECT column_name...")    → inspect columns
mcp__supabase__generate_typescript_types           → generate types
Write(src/types/supabase.ts, [generated content])  → write to disk
Bash(npm run typecheck)                            → verify no type errors
```

### Querying Data During Builds

```
Using the Supabase MCP, query the brands table and show me all brands with
status = 'active'. I need to seed the new ppc_campaigns table with one
placeholder campaign per active brand.
```

```
mcp__supabase__execute_sql("SELECT id, name FROM brands WHERE status = 'active'")
→ [results]
mcp__supabase__execute_sql("INSERT INTO ppc_campaigns ...")  → seed data
```

### Schema Inspection Before Building

Always start by inspecting current state — never assume:

```
Before building, use the Supabase MCP to:
1. List all tables in the public schema
2. Show columns for the brands table
3. List current migrations

Report what exists before making any changes.
```

---

## 10. Working with n8n MCP Inside Claude Code

### Setup

```bash
# n8n self-hosted
claude mcp add n8n npx n8n-mcp \
  --scope project \
  --env N8N_HOST=https://your-n8n-instance.com \
  --env N8N_API_KEY=$N8N_API_KEY

# Confirm connection
claude mcp get n8n
```

### Available Tool Categories

The n8n MCP exposes tools for:
- Workflow management (`create_workflow`, `update_workflow`, `activate_workflow`, `list_workflows`)
- Workflow execution (`execute_workflow`, `get_execution`)
- Node type reference (`get_node_types`, `search_nodes`)
- Data tables (`create_data_table`, `add_data_table_rows`)
- Validation (`validate_workflow`, `test_workflow`)

### Example Build Session — Creating a Workflow

**cc-prompt:**
```
Using the n8n MCP, create a workflow called "Acme — PPC Daily Sync — 6am Cron".

The workflow should:
1. Trigger: Cron, every day at 6am UTC
2. HTTP Request node: GET https://api.syncflow.com/webhook/ppc-data?brand=acme
   (use Header Auth credential named "syncflow-api")
3. Supabase node: Upsert results into ppc_campaigns table using asin+date as conflict key
4. IF node: check if any rows had errors
5. Slack node (on error): post to #alerts channel "PPC Sync failed for Acme"
6. Error Trigger node: connected to the Slack alert

After creating, validate and activate the workflow. Report the workflow ID.
```

**What Claude Code does:**
```
mcp__n8n__search_nodes("cron")                    → get exact node type for schedule trigger
mcp__n8n__search_nodes("http request")            → confirm HTTP Request node type
mcp__n8n__create_workflow({name: "...", nodes: [...], connections: {...}})
mcp__n8n__validate_workflow(workflowId)           → check for configuration errors
mcp__n8n__activate_workflow(workflowId)           → set active = true
```

### Inspecting Existing Workflows Before Updating

```
Using the n8n MCP, list all workflows containing "Acme" in their name.
For each one, show me its trigger type and whether it's currently active.
```

```
mcp__n8n__search_workflows("Acme")
→ [list of workflows with trigger and status]
```

### Running a Test Execution

```
Using the n8n MCP, execute the workflow with ID [workflow-id] and wait for the result.
Show me the output of each node.
```

```
mcp__n8n__execute_workflow(workflowId)
mcp__n8n__get_execution(executionId)              → poll until complete, show results
```

---

## 11. Working with ClickUp MCP Inside Claude Code

### Setup

```bash
claude mcp add clickup npx @joshuarileydev/clickup-mcp-server \
  --scope project \
  --env CLICKUP_API_TOKEN=$CLICKUP_API_TOKEN
```

### Available Tool Categories

- Task management (`create_task`, `update_task`, `get_task`, `delete_task`)
- Task organisation (`filter_tasks`, `move_task`, `add_task_to_list`)
- Comments and activity (`create_task_comment`, `get_task_comments`)
- Workspace navigation (`get_workspace_hierarchy`, `get_folder`, `get_list`)
- Custom fields (`get_custom_fields`)
- Time tracking (`add_time_entry`, `start_time_tracking`)

### Example Build Session — Marking Build Milestones

**cc-prompt:**
```
Using the ClickUp MCP:
1. Find the task titled "syncflow Build: PPC Sync v2" in the "Active Builds" list
2. Add a comment: "Schema migration applied — tables: ppc_campaigns, ppc_ad_groups, ppc_keywords"
3. Update the "Build Status" custom field to "Schema Complete"
4. When the full build is done, update the status to "Complete"
```

```
mcp__clickup__get_workspace_hierarchy            → find list ID for "Active Builds"
mcp__clickup__filter_tasks({listId, name: "PPC Sync v2"})
mcp__clickup__create_task_comment(taskId, "Schema migration applied...")
mcp__clickup__update_task(taskId, {custom_fields: [{name: "Build Status", value: "Schema Complete"}]})
```

### Creating a Build Tracker Task at Start of Session

```
Using the ClickUp MCP, create a task in the "syncflow Builds" list:
- Name: "Build: [Module Name] — [Date]"
- Status: "In Progress"
- Priority: Normal
- Description: [paste the cc-prompt summary]
- Custom field "Module Type": "PPC Sync"
```

---

## 12. Writing Effective cc-Prompts for syncflow

A **cc-prompt** is the build instruction that syncflow generates and passes to Claude Code. The quality of the cc-prompt is the single biggest determinant of build success. These are not simple one-liners — they are structured technical briefs.

### The Anatomy of a High-Quality cc-Prompt

```markdown
# Build Plan: [Module Name]

## System Context
Stack: Supabase (project: syncflow-prod) + n8n (https://n8n.syncflow.com) + ClickUp (workspace: syncflow)
CLAUDE.md is present — read it before starting.
MCP servers configured: supabase, n8n, clickup

## Pre-Build Checks
Before making any changes:
1. Run /mcp to confirm all three MCP servers are connected
2. List existing Supabase tables — confirm target tables don't already exist
3. Check n8n for existing workflows with similar names — avoid duplicates

## What to Build
[Precise description of the module — schema, workflows, integrations]

## Supabase Schema
[Exact SQL for all tables, indexes, RLS policies — copy-paste ready]

## n8n Workflows
[Workflow names, trigger types, node sequences, credential references]

## File Targets
Files Claude Code must write or modify:
- migrations/20260506000000_[name].sql — the migration SQL
- src/types/supabase.ts — regenerate after migration
- src/integrations/[name].ts — integration helper (optional)

## Verification Steps
After each major step, verify before proceeding:
1. After migration: list tables and confirm schema matches
2. After type generation: run `npm run typecheck` — must pass with 0 errors
3. After workflow creation: validate and run a test execution
4. After all steps: confirm no items remain in the "IN PROGRESS" state in claude-progress.txt

## Success Criteria
The build is complete when:
- [ ] All specified tables exist in Supabase with correct columns and indexes
- [ ] TypeScript types compile with 0 errors
- [ ] n8n workflow is created, valid, and active
- [ ] ClickUp build task is updated to "Complete"
- [ ] claude-progress.txt shows all steps DONE with no INTERRUPTED entries

## Error Handling
If any step fails:
- Write the error to claude-progress.txt with [FAILED] prefix
- Do not proceed to dependent steps
- Output a clear error summary at the end
```

### Principles for cc-Prompt Effectiveness

**Explicit file targets** — Name every file Claude Code should touch. An ambiguous "update the types" turns into a 10-turn exploration; "write to `src/types/supabase.ts`" is one tool call.

**Include exact SQL** — Don't ask Claude Code to infer the schema from a description. Give it the exact `CREATE TABLE` statement. Inference introduces hallucination risk.

**Pre-build checks before writes** — Always start with read operations to validate current state. This catches "table already exists" and "workflow already exists" errors before they cause half-executed builds.

**Verification steps at each milestone** — Tell Claude Code what to check after each action, not just at the end. "After applying the migration, confirm the table exists by listing tables" is much safer than "apply the migration and then do X."

**Success criteria as a checklist** — A list of binary, checkable items. Claude Code can tick these off explicitly and tell you what's complete vs. not.

**Error handling instructions** — Tell Claude Code what to do on failure. Without this, it will attempt workarounds that may cause more problems than the original error.

---

## 13. Cost and Token Discipline

### How Sessions Consume Tokens

Every session has two token streams:
- **Input tokens:** CLAUDE.md + conversation history + file contents read + MCP responses
- **Output tokens:** Claude's responses + thinking tokens (if extended thinking is active)

At current rates for Claude Sonnet (the default and recommended model for builds):
- ~$3 per million input tokens
- ~$15 per million output tokens
- Typical build session: 50k–300k tokens total depending on complexity
- Estimated per-build cost: $0.15 to $5 for well-scoped builds

Extended thinking (Opus or high `--effort`) can multiply output token costs significantly. Use `--effort low` or `--effort medium` for straightforward builds.

### Strategies for Token Efficiency

**Focused prompts with explicit file scope.** Tell Claude Code exactly which files to read. "Read the CLAUDE.md and src/types/supabase.ts, then..." is better than letting it explore the whole project.

**Use `/compact` proactively.** The REPL command `/compact` summarises conversation history when it's getting long, freeing context without losing the thread. Run it at 70–80% context fill; don't wait until 90%+.

**Use `/clear` for unrelated tasks.** When switching from a schema build to debugging an unrelated issue, clear the session. Stale context from the previous task costs tokens on every message.

**Keep CLAUDE.md under 200 lines.** It's loaded every session. Every token in CLAUDE.md costs tokens on every turn. Use rules files with path scoping to load specialised instructions only when relevant.

**Start with Sonnet, escalate to Opus only if needed.** Sonnet handles 80%+ of build tasks perfectly. Switch to Opus only for genuinely complex multi-system refactors or when Sonnet is producing incorrect output after multiple attempts.

**Use `/usage` to track spend.** Check session costs before they spiral. A session that's consumed 500k tokens and isn't finished probably needs `/compact` or a fresh `/clear` + resume with a targeted prompt.

**MCP Tool Search (`toolSearch: true`).** Enabling lazy loading in your MCP config prevents all tools from being loaded into context upfront. In a session that only uses Supabase and ClickUp, you don't need n8n's 40+ tools consuming context.

**`--max-turns` in non-interactive mode.** Setting a turn limit prevents runaway sessions that loop endlessly trying to fix an error:
```bash
claude -p "$(cat build-plan.txt)" --max-turns 50 --dangerously-skip-permissions
```

### Cost Tracking in Non-Interactive Mode

With `--output-format json`, the response includes cost breakdown:

```json
{
  "result": "...",
  "total_cost_usd": 0.47,
  "usage": {
    "input_tokens": 85000,
    "output_tokens": 12000,
    "cache_read_input_tokens": 45000
  }
}
```

Log these per build to track cost by module type over time.

---

## 14. Common Failure Modes and Recovery

### Failure Mode 1: "Rush to Completion" Hallucination

**Symptom:** Claude Code fabricates a successful outcome — claims a migration was applied, writes TypeScript types referencing tables that don't exist, or invents a workflow ID.

**Why it happens:** At high context fill (>70%), precision degrades. Claude Code's chain-of-thought collapses and it starts asserting rather than verifying.

**Prevention:** Include explicit verification steps after every major action. "After applying the migration, call `mcp__supabase__list_tables` and confirm the table is present before proceeding."

**Recovery:**
1. Run `/compact` to free context
2. Start a fresh verification session: "Read `claude-progress.txt`. For each DONE item, verify it's actually complete using the appropriate MCP tool."
3. Delete the `claude-progress.txt` entry for the hallucinated step and re-execute just that step.

### Failure Mode 2: Getting Stuck in a Loop

**Symptom:** Claude Code keeps trying the same failing approach repeatedly, apologising after each failure, and trying again. Common in migrations with constraint errors.

**Why it happens:** Without explicit error handling instructions in the cc-prompt, Claude Code defaults to "try to fix it" rather than "report and stop."

**Prevention:** Include error handling instructions in every cc-prompt: "If any step fails, write the error to `claude-progress.txt` with a [FAILED] prefix and stop. Do not attempt to fix errors automatically."

**Recovery:**
1. Press `Escape` to cancel the current operation
2. Read the error output
3. Fix the underlying issue (e.g., a SQL syntax error in the cc-prompt)
4. Resume with: "Read `claude-progress.txt`. The last step [FAILED]. The corrected SQL is [paste corrected SQL]. Apply it and verify."

### Failure Mode 3: Hallucinated File Paths

**Symptom:** Claude Code edits a file at a path that doesn't exist, writes code referencing imports that don't exist, or claims to have read a file it hasn't.

**Why it happens:** Without explicit file targets in the cc-prompt, Claude Code infers paths based on conventions. It's often right, but when wrong, it's confidently wrong.

**Prevention:** In your cc-prompt, list exact file paths for every file Claude Code should read or write. Never say "update the types file" — say "write to `src/types/supabase.ts`."

**Recovery:** After a build, run:
```bash
# Check that all expected files actually exist
ls -la src/types/supabase.ts migrations/20260506*.sql
# Verify TypeScript compiles
npm run typecheck
```

### Failure Mode 4: MCP Server Down Mid-Build

**Symptom:** A build fails partway through with an MCP connection error. Steps that executed before the failure are done; steps that needed the MCP are not.

**Prevention:** Always run `/mcp` at the start of every build session to confirm all servers are connected before starting.

**Recovery:**
1. Fix the MCP server issue (restart the MCP process, check credentials)
2. Re-run `/mcp` to confirm connection
3. Resume from the last checkpoint in `claude-progress.txt`
4. Recovery prompt: "Read `claude-progress.txt`. The build was interrupted due to MCP connectivity. All steps before [INTERRUPTED] are complete. Resume from that point."

### Failure Mode 5: Context Window Overflow

**Symptom:** Claude Code starts making contradictory edits, "forgets" earlier decisions, or produces increasingly incoherent output on long sessions.

**Prevention:** Run `/compact` at 70–80% context fill. Use `/usage` to monitor context consumption.

**Recovery:**
1. Run `/compact` (preferred) or `/clear` (last resort)
2. If you used `/clear`, resume with: "Read `CLAUDE.md` and `claude-progress.txt`. We're continuing a build. Resume from the last IN PROGRESS step."

### Failure Mode 6: Destructive Command Execution

**Symptom:** Claude Code runs a `DROP TABLE` or `rm` command it shouldn't have.

**Prevention:** Put deny rules in `.claude/settings.json`:
```json
{
  "permissions": {
    "deny": [
      "Bash(rm -rf *)",
      "mcp__supabase__delete_branch"
    ]
  }
}
```
Deny rules override everything, including `--dangerously-skip-permissions`.

**Recovery:** Restore from Supabase's automated backups (available in dashboard under Storage → Backups). For dev environments, use Supabase branches so destructive experiments don't touch the main database.

---

## 15. Verification From Within Claude Code

Never trust Claude Code's own report of success — always verify with tool calls.

### Supabase Verification

```
After completing the build, verify each of the following:

1. List all tables in the public schema — confirm all expected tables are present
2. For the amazon_listings table, run:
   SELECT column_name, data_type FROM information_schema.columns
   WHERE table_name = 'amazon_listings' ORDER BY ordinal_position;
   — confirm all columns match the migration spec
3. Run: SELECT COUNT(*) FROM amazon_listings;
   — confirm table is empty (expected for a fresh migration) or has the seeded rows
4. List migrations — confirm the migration file appears in the applied list
```

### TypeScript Verification

```bash
# Claude Code should run this after writing types
npm run typecheck

# If there are errors, Claude Code should resolve them before marking the step done
# Expected output: "Found 0 errors."
```

### n8n Workflow Verification

```
After creating the workflow:
1. Validate it using mcp__n8n__validate_workflow — expect 0 errors
2. Run a test execution using mcp__n8n__execute_workflow
3. Get the execution result using mcp__n8n__get_execution — confirm status is "success"
4. Check that all nodes executed (no skipped nodes that should have run)
```

### End-to-End Build Report

At the end of every build, Claude Code should produce a summary like:

```
## Build Complete — PPC Sync v2

### Supabase
- [x] Table created: ppc_campaigns (12 columns, 2 indexes)
- [x] Table created: ppc_ad_groups (8 columns, 1 index)
- [x] TypeScript types generated and written to src/types/supabase.ts
- [x] npm run typecheck: PASS (0 errors)

### n8n
- [x] Workflow created: "Acme — PPC Daily Sync — 6am Cron" (ID: abc123)
- [x] Workflow validated: 0 errors
- [x] Test execution: SUCCESS (all 6 nodes completed)
- [x] Workflow activated

### ClickUp
- [x] Task updated: "Build: PPC Sync v2" → Status: Complete
- [x] Comment added with build summary

### Files Changed
- migrations/20260506143200_ppc_sync_v2.sql (NEW)
- src/types/supabase.ts (UPDATED)
```

---

## 16. Version and Update Management

### Checking Your Current Version

```bash
claude --version
```

### Updating Claude Code

```bash
npm update -g @anthropic-ai/claude-code
```

Or to install a specific version:

```bash
npm install -g @anthropic-ai/claude-code@1.x.x
```

### Where to Find Release Notes

- **Official changelog:** `code.claude.com/docs/en/changelog`
- **What's new by week:** `code.claude.com/docs/en/whats-new/`
- **GitHub releases:** `github.com/anthropics/claude-code/releases`

### Breaking Changes to Watch For

**MCP configuration location:** The move from `settings.json` to `~/.claude.json` for MCP configuration tripped up many teams in early 2026. If MCP servers stop loading after an update, check the config file location.

**`--print` vs. `-p`:** Both currently work, but `-p` is the canonical shorthand. Aliases can change.

**Permission scope changes:** `--dangerously-skip-permissions` scope has changed across versions — in some versions it didn't bypass writes to `.claude/`; in current versions it does. Test pipeline behaviour after updates in a staging environment before production.

**CLAUDE.md rules frontmatter:** The `paths` frontmatter for scoped rules was introduced as a newer feature. If you're on an older Claude Code version, these may be silently ignored rather than throwing an error.

**Model names:** When pinning models with `--model`, check that the model string matches the current API model name. Model names (including minor version suffixes) change with new releases.

### Testing After Updates

After any Claude Code update that affects an automated pipeline:
1. Run a test build in your staging Supabase project
2. Confirm MCP servers load and connect
3. Run a simple cc-prompt non-interactively and check the exit code and output
4. Only roll out to production builds once staging passes

---

## 17. Dos and Don'ts

### ✅ DOs

1. **DO read CLAUDE.md at the start of every cc-prompt.** Include "Read CLAUDE.md before starting" as the first instruction. This ensures Claude Code has project context before making any decisions.

2. **DO include exact SQL in migration prompts.** Don't describe what you want — give Claude Code the precise `CREATE TABLE` statement with all columns, types, constraints, and indexes. Inference introduces hallucination.

3. **DO run `/mcp` before starting any build.** Confirm all three MCP servers (supabase, n8n, clickup) are connected before issuing the first destructive command.

4. **DO use `--max-turns` in non-interactive pipeline runs.** Set a reasonable ceiling (e.g., `--max-turns 60`) to prevent infinite loops from billing you into oblivion.

5. **DO write to `claude-progress.txt` at each milestone.** Explicit checkpoints enable session recovery without re-running completed steps.

6. **DO use deny rules for truly destructive operations.** `"Bash(rm -rf *)"` and `"mcp__supabase__delete_branch"` should be in the deny list for all production projects. Deny rules survive `--dangerously-skip-permissions`.

7. **DO verify each step before proceeding to the next.** The build plan should instruct Claude Code to confirm a migration applied successfully before generating types, confirm types compile before creating workflows, and so on.

8. **DO use Supabase branches for experimental builds.** Test new migrations on a branch, verify they're correct, then merge to main. Never test unknown migrations directly on production.

9. **DO use `/compact` at 70–80% context fill.** Don't wait until Claude Code is hallucinating — compact proactively.

10. **DO log the `total_cost_usd` from `--output-format json`.** Tracking per-build costs by module type reveals which module types are expensive and helps optimise cc-prompt efficiency over time.

11. **DO test updated MCP configurations in staging before production.** Any change to `~/.claude.json` or `.mcp.json` can silently break builds — test before deploying.

12. **DO specify `--allowedTools` explicitly in non-interactive mode.** Whitelisting only the tools a build needs prevents accidental calls to tools outside the build scope.

---

### ❌ DON'Ts

1. **DON'T use `--dangerously-skip-permissions` on production Supabase projects without human review of the build plan.** If the cc-prompt has a bug (e.g., wrong table name in a DROP statement), there's no safety net.

2. **DON'T let context fill past 85% without compacting.** At 85%+, hallucinations increase measurably. You'll get confident-sounding wrong answers. `/compact` early, `/compact` often.

3. **DON'T put secrets in CLAUDE.md.** CLAUDE.md is a file — it can be read, committed, and shared. Use environment variable names (e.g., `SUPABASE_SERVICE_ROLE_KEY`) and inject values from your environment.

4. **DON'T assume a build succeeded without verification.** Claude Code will say "I've applied the migration" even if the MCP call failed silently. Always follow up with a verification query.

5. **DON'T run migrations on the main Supabase project without testing on a branch first.** `apply_migration` on main is permanent. Supabase's auto-backups help, but recovery takes time and causes downtime.

6. **DON'T skip error handling instructions in cc-prompts.** Without explicit instructions, Claude Code will attempt to auto-fix errors in ways that can make things worse. "If X fails, stop and report" is always safer than leaving error handling to Claude Code's discretion.

7. **DON'T ignore MCP Tool Search.** Loading all MCP tools upfront for large servers wastes thousands of tokens per session. Enable `toolSearch: true` in MCP config for servers with 20+ tools.

8. **DON'T update Claude Code without testing in staging first.** Breaking changes in MCP config location, permission behaviour, and flag semantics have tripped up automated pipelines before. Every major update needs a staging validation run.

9. **DON'T reuse a stale session for a new unrelated build.** The conversation history from the previous build consumes context even when irrelevant. Use `/clear` and start fresh.

10. **DON'T use Opus as the default model.** It's 5x more expensive than Sonnet and doesn't produce meaningfully better results for well-scoped build tasks. Reserve Opus for genuinely complex multi-system architectural decisions.

11. **DON'T use undescriptive workflow names in n8n.** `"Workflow 47"` tells Claude Code (and humans) nothing. `"Acme — PPC Daily Sync — 6am Cron"` is machine-readable, human-readable, and avoids duplicate creation in future builds.

12. **DON'T let Claude Code pick migration filenames.** Always specify the timestamp format in the cc-prompt: `20260506143200_module_name.sql`. Auto-generated names are inconsistent and break migration ordering.

---

## Resources

- [Claude Code Overview](https://code.claude.com/docs/en/overview)
- [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices)
- [MCP in Claude Code](https://code.claude.com/docs/en/mcp)
- [Claude Code Settings Reference](https://code.claude.com/docs/en/settings)
- [Claude Code Permissions](https://code.claude.com/docs/en/permissions)
- [Permission Modes](https://code.claude.com/docs/en/permission-modes)
- [Headless / Non-Interactive Mode](https://code.claude.com/docs/en/headless)
- [CLI Reference](https://code.claude.com/docs/en/cli-reference)
- [Cost Management](https://code.claude.com/docs/en/costs)
- [Changelog](https://code.claude.com/docs/en/changelog)
- [Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp)
- [n8n MCP Server](https://docs.n8n.io/advanced-ai/mcp/accessing-n8n-mcp-server/)
- [How Claude Code Works](https://code.claude.com/docs/en/how-claude-code-works)
