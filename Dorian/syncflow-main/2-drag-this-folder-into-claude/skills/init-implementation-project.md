# `init-implementation-project`

> Creates the standard `~/syncflow-projects/<brand-slug>/` filesystem layout on the delegate's machine. Tier 2 only *(requires filesystem MCP)*. Idempotent — safe to call multiple times. Read alongside `reference/implementation-phase.md` Principle 2.

**When**
- Called internally by `start-implementation` on the *first* implementation kickoff for a brand
- User says: *"set up my syncflow folder"* / *"init the implementation project"* / *"create the brand folder"*
- During a fresh delegate's onboarding to syncflow, AFTER tier-2 (filesystem MCP) is wired AND a brand has been captured

**Inputs**
- in-context `brain` *(needs `brand` and `brand_display`)*
- *(optional)* `<root-path>` — override the default `~/syncflow-projects/`. Rare.

**Tools**
- Filesystem MCP — to mkdir + write
- in-context brain check — confirm brand is captured before initialising

**Outputs**
- `~/syncflow-projects/<brand-slug>/` directory tree on disk:
  ```
  ~/syncflow-projects/<brand-slug>/
  ├── README.md
  ├── brain.json (initial dump from current in-context brain)
  ├── modules/             (empty — populated by start-implementation per module)
  └── _shared/
      ├── credentials/     (gitignored placeholder)
      ├── notes/
      └── looms/
  ```
- A `.gitignore` at the brand root excluding `_shared/credentials/`, `*.bak.*`, `.DS_Store`
- A confirmation message in chat: *"Created ~/syncflow-projects/<brand>/. Ready for module kickoffs."*

---

## Why this skill exists

Without a defined filesystem layout, the delegate's project files scatter — migrations on Desktop, n8n exports in Downloads, brain mirrors in three places. Sim's pre-SSL feedback flagged exactly this risk: *"the project becoming too messy."*

The standard layout is opinionated *(see `implementation-phase.md` Principle 2)*. This skill makes it real — one shell-equivalent of mkdir to set up the whole tree. Idempotent: the second call sees existing directories and doesn't overwrite, just confirms.

---

## Behaviour

### 1. Validate prerequisites

- Filesystem MCP must be available. If not, halt with: *"This skill needs filesystem MCP enabled (tier 2). The standard layout works just as well as a manual convention — see `reference/implementation-phase.md` Principle 2 for the structure to create yourself."*
- Brain must have `brand` and `brand_display` populated. If not, halt: *"Brand isn't captured yet. Run `onboard-delegate` first."*

### 2. Determine root path

Default: `~/syncflow-projects/<brand-slug>/` where `<brand-slug>` is `brain.brand`.

If the delegate has a non-standard preference *(rare — most don't)*, accept an override but warn: *"Heads up: the standard layout assumes `~/syncflow-projects/`. Other skills (`start-implementation`, `restore-brain-from-knowledge`) look there by default. If you put it elsewhere, you'll need to tell me each session."*

### 3. Idempotency check

- If `~/syncflow-projects/<brand-slug>/` already exists, this is a re-init. Don't overwrite.
- Read existing `brain.json` *(if present)*. Compare to in-context brain. If they differ:
  - In-context brain is newer → offer to update disk: *"Disk brain.json is from 2026-04-12 (3 weeks old). Current brain has more facts. Refresh disk?"*
  - Disk brain.json is newer → potential drift. Surface: *"Disk brain.json is newer than in-context. Did another session update it? Maybe run `restore-brain-from-knowledge` first to reconcile."*
  - They match → no action.
- If the directory tree is incomplete *(some subfolders missing)*, fill the gaps without touching what exists.

### 4. Create the structure

Use filesystem MCP to:

```
mkdir -p ~/syncflow-projects/<brand-slug>/modules/
mkdir -p ~/syncflow-projects/<brand-slug>/_shared/credentials/
mkdir -p ~/syncflow-projects/<brand-slug>/_shared/notes/
mkdir -p ~/syncflow-projects/<brand-slug>/_shared/looms/
```

### 5. Write the brand-root files

**`README.md`** — human-readable index. Template:

```markdown
# {{brand_display}} · syncflow implementation project

This folder is your syncflow Connected Systems implementation workspace for
**{{brand_display}}**. It mirrors *(part of)* the brain that lives in your Cowork
project, and is where the modules from the roadmap actually get built.

## Layout

```
brain.json              → mirror of Cowork's brain (read-only — use update-module-status)
modules/                → one folder per module from the roadmap
  0N-<slug>/
    CLAUDE.md           → per-module Claude Code instructions
    build-plan.md       → 5-phase plan
    verification-plan.md
    status.json         → current phase + completion (your CC writes to this)
    README.md
    implementation/     → your code
    n8n/                → exported flow JSONs
    supabase/           → migrations
    clickup/            → config dumps
_shared/
  credentials/          → gitignored
  notes/                → your own running notes
  looms/                → screen recordings
```

## How to start a module

In Cowork: type `start Module 0N`. syncflow will write the deliverables into
`modules/0N-<slug>/`.

Then on this machine:
```
cd ~/syncflow-projects/{{brand_slug}}/modules/0N-<slug>
claude
```

Your Claude Code reads the per-module CLAUDE.md, knows what it's building, and
starts on Phase 1.

## Not sure where you are?

Type `status` in your Cowork session — syncflow will give you a portfolio view
across all modules.

## Reference

- Architecture: parent project's `reference/implementation-phase.md`
- Anti-patterns: parent project's `reference/implementation-anti-patterns.md`
- Brand brain: `./brain.json`

---
Generated by syncflow · {{generated_at}}
```

**`brain.json`** — mirror of the in-context brain *(via `emit-brain-artifact` disk-mirror path)*.

**`.gitignore`** — exclude credentials, backup files, OS metadata:

```
# syncflow implementation project · gitignore

# Credentials and secrets
_shared/credentials/
.env
.env.local
*.pem
*.key

# Backup files (from start-implementation refresh paths)
*.bak.*

# OS metadata
.DS_Store
Thumbs.db

# Editor metadata
.vscode/
.idea/
*.swp
```

**`_shared/credentials/README.md`** — placeholder reminder:

```markdown
# Credentials · {{brand_display}}

This folder is gitignored. Store secrets here in `.env` files referenced by
modules.

Recommended structure:
- `.env`              → main brand-wide credentials
- `.env.staging`      → staging variants if applicable
- `vault-keys/`       → if using Supabase Vault tokens

Never commit. Never push. Rotate on a schedule.
```

### 6. Confirmation message

Compact. Don't over-explain:

```
~/syncflow-projects/{{brand_slug}}/ created.
  ├── README.md
  ├── brain.json     (mirrored)
  ├── modules/       (empty — populated when you start modules)
  └── _shared/
      ├── credentials/  (gitignored)
      ├── notes/
      └── looms/

Ready for module kickoffs. Want to start the first one? "start Module 02".
```

---

## Edge cases

- **Brand slug collision** *(delegate has another brand in the same parent folder with the same slug)*: rare for single-Cowork-project per brand, but possible. Surface: *"~/syncflow-projects/ideal-direct/ already exists from a different brand session. Move it aside or pick a distinct slug."*

- **Delegate doesn't have `~/`** *(weird Windows path or non-standard home)*: filesystem MCP handles this; just pass the resolved absolute path.

- **Disk full / permissions**: surface clearly. *"Couldn't create ~/syncflow-projects/<brand>/ (permission denied OR disk full). Check ~/ permissions or pick a different root."*

- **Rerunning init partway through implementation** *(modules already exist)*: don't touch existing module folders. Just fill any missing brand-root files *(README.md, .gitignore, _shared subfolders)*. Confirm: *"Existing structure intact; filled in missing brand-root files."*

---

## Don't

- **Don't write to `modules/`.** That's `start-implementation`'s job.
- **Don't put credentials anywhere except `_shared/credentials/`.** Per-module credentials = mess.
- **Don't auto-create a Git repo or push to GitHub.** That's the delegate's call. README.md mentions `.gitignore` is in place; they `git init` themselves if they want.
- **Don't promise sync.** This skill creates the layout once. Disk-to-Cowork sync happens via `emit-brain-artifact` *(brain mirror)* + per-module `status.json` reads in `restore-brain-from-knowledge`.
- **Don't skip the .gitignore.** Even if the delegate doesn't use Git today, future-them might. Better defaults from day 1.

---

## Why this skill is small but matters

Most of the implementation phase's anti-mess strategy lives in this skill running once: a clean folder structure, gitignored secrets, a README that explains the layout. Without it, every delegate invents their own layout and we lose the consistency that makes everything else work.

Run early. Run idempotently. Stay out of the way thereafter.
