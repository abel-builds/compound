#!/usr/bin/env node
/**
 * compound — idempotent installer
 *
 * Can be invoked:
 *   npx compound init            — create vault in current dir
 *   npx compound init --global   — create vault at ~/vault/ and set VAULT_ROOT env
 *   node install.js              — same as `npx compound init`
 *
 * Safe to re-run. Skips existing files. Reports what's already done.
 */

import { mkdir, writeFile, readFile, access, copyFile, readdir } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = __dirname;

const args = process.argv.slice(2);
const isGlobal = args.includes("--global");
const isInit = args.length === 0 || args[0] === "init";

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function copyIfMissing(src, dest) {
  if (await exists(dest)) {
    console.log(`  [skip] ${dest} exists`);
    return false;
  }
  await mkdir(dirname(dest), { recursive: true });
  await copyFile(src, dest);
  console.log(`  [new]  ${dest}`);
  return true;
}

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

async function main() {
  if (!isInit) {
    console.log("compound installer");
    console.log("Usage: node install.js [init] [--global]");
    process.exit(0);
  }

  const target = isGlobal ? join(homedir(), "vault") : join(process.cwd(), "vault");
  console.log(`\ncompound v0.1.0 — initializing vault at: ${target}\n`);

  // 1. Create vault directory skeleton
  console.log("Creating directory structure...");
  await ensureDir(join(target, "raw"));
  await ensureDir(join(target, "wiki", "knowledge"));
  await ensureDir(join(target, "output"));
  await ensureDir(join(target, "templates"));
  console.log("  [ok] vault/{raw,wiki/knowledge,output,templates}");

  // 2. Seed files from templates
  console.log("\nSeeding vault files...");
  const files = [
    ["vault/schema.md", "schema.md"],
    ["vault/log.md", "log.md"],
    ["vault/wiki/_master-index.md", "wiki/_master-index.md"],
    ["vault/wiki/knowledge/_index.md", "wiki/knowledge/_index.md"],
    ["vault/wiki/knowledge/welcome.md", "wiki/knowledge/welcome.md"],
    ["vault/templates/article.md", "templates/article.md"],
    ["vault/templates/category-index.md", "templates/category-index.md"],
  ];

  for (const [src, dest] of files) {
    const from = join(REPO_ROOT, src);
    const to = join(target, dest);
    if (!(await exists(from))) {
      console.log(`  [warn] source missing: ${src}`);
      continue;
    }
    await copyIfMissing(from, to);
  }

  // 3. Set up hooks in user's .claude/settings.json (project-local only for safety)
  const settingsPath = isGlobal
    ? join(homedir(), ".claude", "settings.json")
    : join(process.cwd(), ".claude", "settings.json");

  console.log(`\nConfiguring hooks in ${settingsPath}...`);
  const hookCommand = isGlobal
    ? `node "${join(homedir(), ".claude", "plugins", "compound", "herramientas", "vault-session-start.mjs")}" 2>/dev/null`
    : `node "$CLAUDE_PROJECT_DIR/herramientas/vault-session-start.mjs" 2>/dev/null`;

  const checkCommand = isGlobal
    ? `node "${join(homedir(), ".claude", "plugins", "compound", "herramientas", "vault-check.mjs")}" 2>/dev/null`
    : `node "$CLAUDE_PROJECT_DIR/herramientas/vault-check.mjs" 2>/dev/null`;

  let settings = { hooks: {} };
  if (await exists(settingsPath)) {
    const raw = await readFile(settingsPath, "utf-8");
    try { settings = JSON.parse(raw); } catch { console.log("  [warn] settings.json malformed, backing up and starting fresh"); await writeFile(settingsPath + ".bak", raw); }
  }

  settings.hooks ??= {};
  settings.hooks.SessionStart ??= [];
  settings.hooks.SessionEnd ??= [];

  const alreadyHasStart = settings.hooks.SessionStart.some(h => JSON.stringify(h).includes("vault-session-start"));
  if (!alreadyHasStart) {
    settings.hooks.SessionStart.push({ hooks: [{ type: "command", command: hookCommand, timeout: 15 }] });
    console.log("  [new]  SessionStart hook");
  } else {
    console.log("  [skip] SessionStart hook already configured");
  }

  const alreadyHasEnd = settings.hooks.SessionEnd.some(h => JSON.stringify(h).includes("vault-check"));
  if (!alreadyHasEnd) {
    settings.hooks.SessionEnd.push({ hooks: [{ type: "command", command: checkCommand, timeout: 15 }] });
    console.log("  [new]  SessionEnd hook");
  } else {
    console.log("  [skip] SessionEnd hook already configured");
  }

  await ensureDir(dirname(settingsPath));
  await writeFile(settingsPath, JSON.stringify(settings, null, 2));

  // 4. Summary
  console.log(`\n✓ compound vault ready at ${target}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Drop any .md file into ${join(target, "raw")}.`);
  console.log(`  2. Open this folder in Claude Code.`);
  console.log(`  3. The SessionStart hook will surface the file and compile it.`);
  console.log(`\nTry: /vault-status to see your vault state.`);
  if (isGlobal) {
    console.log(`\nGlobal vault tip: add to your shell profile:`);
    console.log(`  export VAULT_ROOT="${target}"`);
  }
}

main().catch((e) => {
  console.error("compound installer failed:", e.message);
  process.exit(1);
});
