#!/usr/bin/env node
// SessionEnd hook: vault health check. Detects debt the next session
// should catch up on:
//   1. Files in raw/ older than 24h (not compiled yet).
//   2. _master-index.md count mismatch vs real wiki/ article count.
//   3. _master-index.md older than the most recent article.
//
// If debt is found, prints { systemMessage: "..." } for Claude Code to show.
// Silent (exit 0) if all is clean.

import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const ROOT = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const VAULT = process.env.VAULT_ROOT ?? join(ROOT, "vault");
const NOW = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;

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
  const problems = [];

  // 1. Raw files older than 24h
  const rawFiles = await walk(join(VAULT, "raw"), (n) => n.endsWith(".md") && !n.startsWith("_"));
  const rawStale = [];
  for (const f of rawFiles) {
    const s = await stat(f);
    if (NOW - s.mtimeMs > DAY_MS) {
      rawStale.push(f.replace(VAULT + "/", "").replace(/\\/g, "/"));
    }
  }
  if (rawStale.length > 0) {
    problems.push(`- ${rawStale.length} file(s) in raw/ not compiled >24h:\n    ${rawStale.slice(0, 10).join("\n    ")}${rawStale.length > 10 ? `\n    ... (+${rawStale.length - 10} more)` : ""}`);
  }

  // 2. Declared count vs real
  const wikiFiles = await walk(join(VAULT, "wiki"), (n) => n.endsWith(".md") && !n.startsWith("_"));
  const realCount = wikiFiles.length;

  let masterStat;
  let declaredCount = null;
  let masterMtime = 0;
  try {
    const masterPath = join(VAULT, "wiki/_master-index.md");
    const content = await readFile(masterPath, "utf-8");
    masterStat = await stat(masterPath);
    masterMtime = masterStat.mtimeMs;
    const m = content.match(/Total (?:articulos|articles):\s*\*?\*?\s*(\d+)/i);
    if (m) declaredCount = Number(m[1]);
  } catch {
    problems.push("- _master-index.md missing or unreadable");
  }

  if (declaredCount !== null && declaredCount !== realCount) {
    problems.push(`- _master-index.md declares ${declaredCount} articles but ${realCount} exist in wiki/ (diff: ${realCount - declaredCount})`);
  }

  // 3. Master-index vs newest article
  let newestArticle = 0;
  let newestPath = "";
  for (const f of wikiFiles) {
    const s = await stat(f);
    if (s.mtimeMs > newestArticle) {
      newestArticle = s.mtimeMs;
      newestPath = f;
    }
  }
  if (masterMtime > 0 && newestArticle > 0 && newestArticle > masterMtime + 60 * 1000) {
    const diff = Math.round((newestArticle - masterMtime) / 1000 / 60);
    problems.push(`- _master-index.md is ${diff} min older than newest article (${newestPath.replace(VAULT + "/", "").replace(/\\/g, "/")})`);
  }

  // 4. Log integrity check
  try {
    const logPath = join(VAULT, "log.md");
    const logContent = await readFile(logPath, "utf-8");
    const entries = logContent.split("\n").filter((l) => l.trim().length > 0 && !l.startsWith("#") && !l.startsWith(">"));
    const badEntries = [];
    let lastTimestamp = 0;
    let backwardsJumps = 0;
    for (const [i, line] of entries.entries()) {
      if (!line.startsWith("[")) continue; // skip separators like --- or prose
      const m = line.match(/^\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)\]\s+(INGEST|UPDATE|QUERY→WIKI|LINT|SCHEMA|FIX):/);
      if (!m) {
        badEntries.push(`line ${i + 1}: ${line.slice(0, 80)}`);
        continue;
      }
      const t = Date.parse(m[1]);
      if (!Number.isNaN(t)) {
        if (t + 60 * 60 * 1000 < lastTimestamp) backwardsJumps++;
        lastTimestamp = Math.max(lastTimestamp, t);
      }
    }
    if (badEntries.length > 0) {
      problems.push(`- log.md has ${badEntries.length} malformed entries:\n    ${badEntries.slice(0, 5).join("\n    ")}`);
    }
    if (backwardsJumps > 0) {
      problems.push(`- log.md has ${backwardsJumps} timestamps going backwards >1h (possible corruption)`);
    }
  } catch {
    // log.md optional — skip if missing
  }

  if (problems.length === 0) {
    process.exit(0);
  }

  const msg = [
    "[VAULT] Debt detected — sync before closing:",
    ...problems,
    "",
    "Next session: ask Claude 'sync the vault'.",
  ].join("\n");

  console.log(JSON.stringify({ systemMessage: msg }));
  process.exit(0);
}

main().catch((e) => {
  console.error(JSON.stringify({ systemMessage: `[VAULT] vault-check failed: ${e.message}` }));
  process.exit(0);
});
