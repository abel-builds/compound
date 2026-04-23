#!/usr/bin/env node
// Smoke tests for vault hooks. Run with: node tests/hooks.test.mjs
// Exits 0 on success, 1 on failure.

import { mkdir, writeFile, rm, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const TEST_VAULT = join(tmpdir(), `compound-test-${Date.now()}`);

let failures = 0;

function expect(name, cond, detail = "") {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
    failures++;
  }
}

async function setupVault() {
  await mkdir(join(TEST_VAULT, "vault", "raw"), { recursive: true });
  await mkdir(join(TEST_VAULT, "vault", "wiki", "knowledge"), { recursive: true });
  await writeFile(join(TEST_VAULT, "vault", "wiki", "_master-index.md"),
    "# Wiki — Master Index\n\n**Total articles:** 1\n**Total categories:** 1\n");
  await writeFile(join(TEST_VAULT, "vault", "wiki", "knowledge", "seed.md"), "# seed\n\nTL;DR\n");
  await writeFile(join(TEST_VAULT, "vault", "log.md"),
    "# Log\n\n[2026-04-23T00:00:00Z] SCHEMA: initialized\n");
}

async function teardown() {
  await rm(TEST_VAULT, { recursive: true, force: true });
}

function runHook(script, env = {}) {
  const result = spawnSync("node", [join(REPO_ROOT, "herramientas", script)], {
    env: { ...process.env, CLAUDE_PROJECT_DIR: TEST_VAULT, ...env },
    encoding: "utf-8",
  });
  return { stdout: result.stdout ?? "", stderr: result.stderr ?? "", code: result.status };
}

async function main() {
  console.log("Setting up test vault at", TEST_VAULT);
  await setupVault();

  console.log("\nTest: SessionStart hook — empty raw/, with log entries");
  {
    const { stdout, code } = runHook("vault-session-start.mjs");
    expect("exit code 0", code === 0);
    // With log entries present, expect JSON output
    const hasJson = stdout.includes("hookSpecificOutput");
    expect("surfaces recent log entries when log.md has content", hasJson, "expected additionalContext");
  }

  console.log("\nTest: SessionStart hook — raw file present");
  {
    await writeFile(join(TEST_VAULT, "vault", "raw", "test-ingest.md"), "# Test source\n");
    const { stdout, code } = runHook("vault-session-start.mjs");
    expect("exit code 0", code === 0);
    expect("mentions raw file count", stdout.includes("1 file(s)"));
    expect("emits ingestion instruction", stdout.includes("INGEST") || stdout.includes("compile them"));
  }

  console.log("\nTest: SessionEnd hook — clean vault");
  {
    // Master-index was written before raw file, so no drift
    const { code } = runHook("vault-check.mjs");
    expect("exit code 0 even with problems", code === 0);
    // Stdout may or may not be empty depending on stale raw; we only care no crash
  }

  console.log("\nTest: SessionEnd hook — count mismatch");
  {
    await writeFile(join(TEST_VAULT, "vault", "wiki", "knowledge", "extra.md"), "# extra\n");
    const { stdout, code } = runHook("vault-check.mjs");
    expect("exit code 0 even with problems", code === 0);
    expect("reports count mismatch", stdout.includes("declares") && stdout.includes("exist"));
  }

  console.log("\nTest: SessionEnd hook — log.md corruption detection");
  {
    await writeFile(join(TEST_VAULT, "vault", "log.md"),
      "# Log\n\n[malformed entry with brackets but no valid format]\n[2026-04-23T00:00:00Z] INGEST: ok\n");
    const { stdout, code } = runHook("vault-check.mjs");
    expect("exit code 0", code === 0);
    expect("detects malformed log entry", stdout.includes("malformed"));
  }

  console.log("\nTearing down...");
  await teardown();

  console.log(`\n${failures === 0 ? "✓ All hook tests passed" : `✗ ${failures} failure(s)`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Test suite error:", e);
  process.exit(1);
});
