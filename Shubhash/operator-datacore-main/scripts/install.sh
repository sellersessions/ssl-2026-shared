#!/usr/bin/env bash
# operator-datacore — installer for macOS / Linux
# Usage:  bash scripts/install.sh

set -e

C_BLUE='\033[0;34m'
C_GREEN='\033[0;32m'
C_YELLOW='\033[0;33m'
C_RED='\033[0;31m'
C_RESET='\033[0m'

step() { echo ""; echo -e "${C_BLUE}==>${C_RESET}  $1"; }
ok()   { echo -e "${C_GREEN}OK${C_RESET}    $1"; }
warn() { echo -e "${C_YELLOW}WARN${C_RESET}  $1"; }
fail() { echo -e "${C_RED}FAIL${C_RESET}  $1"; exit 1; }

echo "operator-datacore installer"
echo "==========================="

# 1. Node 20+
step "Checking Node.js"
if ! command -v node >/dev/null 2>&1; then
  fail "node is not installed. Get Node 20+ from https://nodejs.org/."
fi
NODE_VER="$(node -v | sed 's/^v//')"
NODE_MAJOR="${NODE_VER%%.*}"
if [ "${NODE_MAJOR}" -lt 20 ]; then
  fail "Node ${NODE_VER} detected. Need 20 or higher. Get it from https://nodejs.org/."
fi
ok "Node ${NODE_VER}"

# 2. npm
step "Checking npm"
if ! command -v npm >/dev/null 2>&1; then
  fail "npm is not installed. It usually comes with Node."
fi
ok "npm $(npm -v)"

# 3. iCloud "node_modules 2" pre-clean (mac)
if [[ "$(uname)" == "Darwin" ]] && pwd | grep -qi "Mobile Documents"; then
  step "iCloud Drive detected — pre-cleaning duplicate symlinks"
  find . -maxdepth 2 -name "* 2*" -not -path "./node_modules/*" -delete 2>/dev/null || true
  ok "Cleaned"
fi

# 4. Install
step "Installing dependencies (this takes 30-60s)"
npm install
ok "Dependencies installed"

# 5. .env
step "Setting up .env"
if [ -f .env ]; then
  warn ".env already exists — leaving it alone"
else
  cp .env.example .env
  ok "Created .env from template"
fi

# 6. Done
echo ""
echo -e "${C_GREEN}Installed.${C_RESET}"
echo ""
echo "Next steps:"
echo "  1. Open this folder in VS Code:    code ."
echo "  2. In Claude Code, run:            /operator-setup"
echo "  3. Or follow SETUP.md by hand."
echo ""
