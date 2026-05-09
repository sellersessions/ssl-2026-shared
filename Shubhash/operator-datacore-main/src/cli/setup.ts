#!/usr/bin/env tsx
// ============================================================================
// setup.ts
// Friendly first-run wizard for non-technical operators. Walks them through:
//   1. Confirming Node 20+
//   2. Copying .env.example → .env (if missing)
//   3. Pointing them at SETUP.md / CLAUDE.md / /operator-setup
//
// We deliberately do NOT prompt interactively here. Most attendees will run
// the Claude Code slash command /operator-setup, which gives a far better
// handhold experience inside their IDE. This script is a CLI fallback.
// ============================================================================

import { existsSync, copyFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

function line(s = ''): void {
  console.log(s);
}

async function main(): Promise<void> {
  line(`${C.bold}operator-datacore — first-run setup${C.reset}`);
  line(`${C.dim}A 5-step path from zero to your-data-in-Supabase.${C.reset}\n`);

  // 1. Node version
  const major = parseInt(process.versions.node.split('.')[0]!, 10);
  if (major < 20) {
    line(`${C.yellow}⚠  Node ${process.versions.node} detected. operator-datacore needs Node 20 or higher.${C.reset}`);
    line('   Install from https://nodejs.org/ and re-run.');
    process.exit(1);
  }
  line(`${C.green}✓${C.reset}  Node ${process.versions.node}`);

  // 2. .env
  const envPath = join(ROOT, '.env');
  const examplePath = join(ROOT, '.env.example');
  if (!existsSync(envPath)) {
    if (!existsSync(examplePath)) {
      line(`${C.yellow}⚠  .env.example missing. Re-clone the repo.${C.reset}`);
      process.exit(1);
    }
    copyFileSync(examplePath, envPath);
    line(`${C.green}✓${C.reset}  Created .env from .env.example`);
  } else {
    line(`${C.green}✓${C.reset}  .env already exists`);
  }

  // 3. Quick sanity: is .env still all blank?
  const envContent = readFileSync(envPath, 'utf8');
  const blanks = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SP_API_LWA_CLIENT_ID']
    .filter((k) => new RegExp(`^${k}=\\s*$`, 'm').test(envContent));
  if (blanks.length === 3) {
    line(`${C.yellow}⚠  .env is empty. You need to fill it in.${C.reset}`);
  }

  // 4. Tell them what to do next
  line('');
  line(`${C.bold}NEXT STEPS${C.reset}`);
  line('');
  line(`${C.bold}Option A — guided (recommended):${C.reset}`);
  line('  Open this folder in VS Code, then run the slash command in Claude Code:');
  line(`    ${C.cyan}/operator-setup${C.reset}`);
  line('  Claude will walk you through Supabase, SP-API credentials, migration,');
  line('  and your first backfill, in plain English.');
  line('');
  line(`${C.bold}Option B — written instructions:${C.reset}`);
  line('  Open SETUP.md and follow the steps:');
  line(`    ${C.cyan}code SETUP.md${C.reset}        (or any text editor)`);
  line('');
  line(`${C.bold}Option C — you know what you're doing:${C.reset}`);
  line('  Fill in .env, then:');
  line(`    ${C.cyan}npm run migrate${C.reset}      # apply schemas`);
  line(`    ${C.cyan}npm run smoke${C.reset}        # confirm credentials work`);
  line(`    ${C.cyan}npm run backfill${C.reset}     # last 30 days, all marketplaces`);
  line(`    ${C.cyan}npm run verify${C.reset}       # compare to Seller Central`);
  line('');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
