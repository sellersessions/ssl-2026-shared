#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# not a square - The Operator's Brain Installer
#
# Companion deliverable for Seller Sessions Live 2026:
#   "Architecting the Amazon Operator's Stack"
#
# What this does:
#   1. Checks prerequisites (Homebrew, Git, GitHub CLI, Obsidian)
#   2. Creates YOUR copy of the template as a private GitHub repo
#   3. Clones it to ~/Documents/<your-vault-name>/
#   4. Generates a per-device API key for Local REST API
#   5. (Optional) Wires up Claude Code MCP integration
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/ShubhashSharma/brain-template/main/setup.sh | bash
#   - or -
#   ./setup.sh
#
# macOS only. Will warn and exit on Linux/Windows.
# ---------------------------------------------------------------------------

set -euo pipefail

# Colours (no emoji per house style)
BOLD="\033[1m"
DIM="\033[2m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
CYAN="\033[36m"
RESET="\033[0m"

say()    { printf "${CYAN}>${RESET} %s\n" "$*"; }
ok()     { printf "${GREEN}OK${RESET}  %s\n" "$*"; }
warn()   { printf "${YELLOW}!!${RESET}  %s\n" "$*"; }
fail()   { printf "${RED}xx${RESET}  %s\n" "$*"; exit 1; }
header() { printf "\n${BOLD}== %s ==${RESET}\n" "$*"; }

# ---------------------------------------------------------------------------
# 0. Sanity
# ---------------------------------------------------------------------------
header "Pre-flight"

if [[ "$(uname)" != "Darwin" ]]; then
  fail "This installer is macOS-only. (Linux/Windows users: see the manual setup guide.)"
fi

ok "macOS detected"

# Ask user for the GitHub template owner (defaults to not-a-square)
TEMPLATE_OWNER_DEFAULT="ShubhashSharma"
TEMPLATE_REPO_DEFAULT="brain-template"

read -r -p "GitHub template owner [${TEMPLATE_OWNER_DEFAULT}]: " TEMPLATE_OWNER
TEMPLATE_OWNER="${TEMPLATE_OWNER:-$TEMPLATE_OWNER_DEFAULT}"

read -r -p "GitHub template repo [${TEMPLATE_REPO_DEFAULT}]: " TEMPLATE_REPO
TEMPLATE_REPO="${TEMPLATE_REPO:-$TEMPLATE_REPO_DEFAULT}"

read -r -p "Name for YOUR new vault folder [my-operator-brain]: " VAULT_NAME
VAULT_NAME="${VAULT_NAME:-my-operator-brain}"

VAULT_PATH="$HOME/Documents/$VAULT_NAME"

# ---------------------------------------------------------------------------
# 1. Homebrew
# ---------------------------------------------------------------------------
header "Step 1 — Homebrew"

if ! command -v brew >/dev/null 2>&1; then
  warn "Homebrew not found. Installing..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
  ok "Homebrew installed: $(brew --version | head -1)"
fi

# ---------------------------------------------------------------------------
# 2. Git, GitHub CLI, jq
# ---------------------------------------------------------------------------
header "Step 2 — CLI tools"

for tool in git gh jq; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    say "Installing $tool..."
    brew install "$tool"
  else
    ok "$tool installed"
  fi
done

# ---------------------------------------------------------------------------
# 3. Obsidian
# ---------------------------------------------------------------------------
header "Step 3 — Obsidian"

if [[ ! -d "/Applications/Obsidian.app" ]]; then
  say "Installing Obsidian..."
  brew install --cask obsidian
else
  ok "Obsidian installed"
fi

# ---------------------------------------------------------------------------
# 4. GitHub auth
# ---------------------------------------------------------------------------
header "Step 4 — GitHub authentication"

if ! gh auth status >/dev/null 2>&1; then
  say "Logging in to GitHub..."
  gh auth login
else
  ok "Already logged in as $(gh api user --jq .login)"
fi

GH_USER=$(gh api user --jq .login)

# ---------------------------------------------------------------------------
# 5. Create vault from template
# ---------------------------------------------------------------------------
header "Step 5 — Create your vault from the template"

if [[ -d "$VAULT_PATH" ]]; then
  warn "Folder already exists at $VAULT_PATH"
  read -r -p "Skip this step and use the existing folder? [Y/n] " skip_create
  skip_create="${skip_create:-Y}"
  if [[ "$skip_create" =~ ^[Yy]$ ]]; then
    say "Skipping — using existing folder"
  else
    fail "Aborting. Remove the folder or pick a different name."
  fi
else
  say "Creating ${GH_USER}/${VAULT_NAME} (private) from ${TEMPLATE_OWNER}/${TEMPLATE_REPO}..."
  gh repo create "$VAULT_NAME" \
    --template "${TEMPLATE_OWNER}/${TEMPLATE_REPO}" \
    --private \
    --clone \
    --description "My operator's brain - not a square template"

  # gh clones into cwd; move to ~/Documents
  if [[ -d "./$VAULT_NAME" && ! -d "$VAULT_PATH" ]]; then
    mv "./$VAULT_NAME" "$VAULT_PATH"
  fi
  ok "Vault created at $VAULT_PATH"
fi

# ---------------------------------------------------------------------------
# 6. Generate API key for Local REST API plugin
# ---------------------------------------------------------------------------
header "Step 6 — API key for Claude Code (optional but recommended)"

API_KEY=$(openssl rand -hex 32)
API_KEY_FILE="$VAULT_PATH/.api-key.local"

# Write to a local-only file (gitignored)
echo "$API_KEY" > "$API_KEY_FILE"
ok "Generated 64-char API key (saved to $API_KEY_FILE)"
say "   Copy this when Obsidian asks:"
printf "   ${BOLD}%s${RESET}\n" "$API_KEY"

# ---------------------------------------------------------------------------
# 7. Claude Code MCP integration (optional)
# ---------------------------------------------------------------------------
header "Step 7 — Claude Code MCP integration"

read -r -p "Do you use Claude Code? [y/N] " use_cc
use_cc="${use_cc:-N}"

if [[ "$use_cc" =~ ^[Yy]$ ]]; then
  if ! command -v uvx >/dev/null 2>&1; then
    say "Installing uv (needed for mcp-obsidian)..."
    brew install uv
  fi

  CLAUDE_CONFIG="$HOME/.claude.json"
  if [[ ! -f "$CLAUDE_CONFIG" ]]; then
    echo '{}' > "$CLAUDE_CONFIG"
  fi

  # Use jq to inject the obsidian MCP server config
  TMP=$(mktemp)
  jq --arg key "$API_KEY" '
    .mcpServers //= {} |
    .mcpServers.obsidian = {
      "command": "uvx",
      "args": ["--from", "mcp-obsidian", "mcp-obsidian"],
      "env": {
        "OBSIDIAN_API_KEY": $key,
        "OBSIDIAN_HOST": "127.0.0.1",
        "OBSIDIAN_PORT": "27124"
      }
    }
  ' "$CLAUDE_CONFIG" > "$TMP" && mv "$TMP" "$CLAUDE_CONFIG"

  ok "Claude Code MCP server configured"
  warn "Restart Claude Code for it to pick up the new server"
else
  say "Skipping Claude Code setup. You can run this script again later."
fi

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
header "Setup complete"

cat <<EOF

Your brain lives at:
  ${BOLD}$VAULT_PATH${RESET}

Your GitHub repo:
  ${BOLD}https://github.com/${GH_USER}/${VAULT_NAME}${RESET}

${BOLD}Next steps (manual, 3 minutes):${RESET}

  1. Open Obsidian
  2. Click 'Open another vault' -> 'Open folder as vault' -> select $VAULT_PATH
  3. Trust the author when prompted, enable plugins
  4. Settings -> Community plugins:
     - Install: Obsidian Git, Templater, Dataview, Local REST API
     - Enable all four
  5. Settings -> Local REST API -> paste this API key:
     ${BOLD}$API_KEY${RESET}
     (also saved at $API_KEY_FILE)
  6. Settings -> Templater -> Template folder location -> _templates
  7. Open README.md in the vault, then wiki/skus/EXAMPLE-acme-baby-shampoo-001.md

${BOLD}First page to fill in:${RESET}
  Copy _templates/sku.md into wiki/skus/, name it after one of your top SKUs,
  fill in the frontmatter. Just one. Not all of them.

${BOLD}Then run Claude Code in the vault root:${RESET}
  /sku-audit {YOUR_ASIN}

Welcome to your operator brain.

EOF
