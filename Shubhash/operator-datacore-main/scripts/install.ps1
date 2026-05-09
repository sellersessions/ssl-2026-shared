# operator-datacore — installer for Windows PowerShell
# Usage:  pwsh scripts/install.ps1

$ErrorActionPreference = 'Stop'

function Step($msg) { Write-Host ""; Write-Host "==> $msg" -ForegroundColor Blue }
function Ok($msg)   { Write-Host "OK    $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "WARN  $msg" -ForegroundColor Yellow }
function Fail($msg) { Write-Host "FAIL  $msg" -ForegroundColor Red; exit 1 }

Write-Host "operator-datacore installer"
Write-Host "==========================="

# 1. Node
Step "Checking Node.js"
$nodeVer = (node -v).TrimStart('v')
if (-not $nodeVer) { Fail "node is not installed. Get Node 20+ from https://nodejs.org/." }
$nodeMajor = [int]($nodeVer.Split('.')[0])
if ($nodeMajor -lt 20) { Fail "Node $nodeVer detected. Need 20 or higher." }
Ok "Node $nodeVer"

# 2. npm
Step "Checking npm"
$npmVer = (npm -v)
if (-not $npmVer) { Fail "npm is not installed." }
Ok "npm $npmVer"

# 3. Install
Step "Installing dependencies (30-60s)"
npm install
Ok "Dependencies installed"

# 4. .env
Step "Setting up .env"
if (Test-Path .env) {
  Warn ".env already exists - leaving it alone"
} else {
  Copy-Item .env.example .env
  Ok "Created .env from template"
}

# 5. Done
Write-Host ""
Write-Host "Installed." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Open this folder in VS Code:    code ."
Write-Host "  2. In Claude Code, run:            /operator-setup"
Write-Host "  3. Or follow SETUP.md by hand."
Write-Host ""
