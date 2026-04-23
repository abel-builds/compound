#!/usr/bin/env node
// SessionStart hook: detects pending raw/ files and injects an imperative
// instruction into Claude's context so it compiles AUTOMATICALLY, without
// asking, without showing messages to the user. Silent if raw/ is empty.
//
// Uses CLAUDE_PROJECT_DIR (set by Claude Code) to locate the vault.

import { readdir } from "node:fs/promises";
import { join } from "node:path";

const ROOT = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const VAULT = process.env.VAULT_ROOT ?? join(ROOT, "vault");

async function walk(dir, filter) {
  const out = [];
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.isDirectory() && e.name.startsWith("_")) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full, filter)));
    else if (e.isFile() && filter(e.name)) out.push(full);
  }
  return out;
}

async function main() {
  const rawFiles = await walk(join(VAULT, "raw"), (n) => n.endsWith(".md") && !n.startsWith("_"));

  if (rawFiles.length === 0) {
    process.exit(0);
  }

  const vaultNorm = VAULT.replace(/\\/g, "/");
  const buckets = new Map();
  for (const f of rawFiles) {
    const fNorm = f.replace(/\\/g, "/");
    const rel = fNorm.startsWith(vaultNorm + "/") ? fNorm.slice(vaultNorm.length + 1) : fNorm;
    const parts = rel.split("/");
    const key = parts.length > 2 ? parts[1] : "__loose__";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(rel);
  }

  const bucketSummary = Array.from(buckets.entries())
    .map(([k, files]) => `  - ${k === "__loose__" ? "(loose files)" : k}: ${files.length} file(s)`)
    .join("\n");

  const instruction = `VAULT AUTO-SYNC (mandatory, silent action, BEFORE responding to the user's message):

There are ${rawFiles.length} file(s) in vault/raw/ not yet compiled to the wiki:
${bucketSummary}

Execute NOW, without asking, without announcing it in chat:
1. Read the raw files. Extract insights, data, decisions.
2. Create/update articles in vault/wiki/<category>/. If the topic doesn't fit existing categories and warrants one (3+ potential articles), create a new category with its own _index.md.
3. Move each compiled raw folder to vault/raw/_archive/<name>/. Convention: _archive preserves history but doesn't count as debt.
4. Update the _index.md of each modified category with the new articles.
5. DO NOT manually edit _master-index.md — the SessionEnd hook auto-reconciles counts and timestamps.
6. After compiling, continue with the user's query normally. Do NOT report the process except for a single trailing line like "[vault-autosync: X compiled]" if any meaningful actions occurred.

If you hit a decision that requires business judgment (scope change for an existing article, questionable new category, etc.), make the best default call and keep going — don't block the user asking for clarification.`;

  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: instruction,
    },
  }));
  process.exit(0);
}

main().catch(() => process.exit(0));
