#!/usr/bin/env node
// Smoke tests for install.js idempotency. Run with: node tests/install.test.mjs

import { mkdir, writeFile, rm, readFile, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const TEST_DIR = join(tmpdir(), `compound-install-test-${Date.now()}`);

let failures = 0;

function expect(name, cond, detail = "") {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
    failures++;
  }
}

function runInstaller() {
  const result = spawnSync("node", [join(REPO_ROOT, "install.js"), "init"], {
    cwd: TEST_DIR,
    encoding: "utf-8",
  });
  return { stdout: result.stdout ?? "", stderr: result.stderr ?? "", code: result.status };
}

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function main() {
  await mkdir(TEST_DIR, { recursive: true });

  console.log("Test: fresh install creates expected structure");
  {
    const { stdout, code } = runInstaller();
    expect("exit code 0", code === 0);
    expect("creates vault/schema.md", await exists(join(TEST_DIR, "vault", "schema.md")));
    expect("creates vault/log.md", await exists(join(TEST_DIR, "vault", "log.md")));
    expect("creates vault/wiki/_master-index.md", await exists(join(TEST_DIR, "vault", "wiki", "_master-index.md")));
    expect("creates vault/wiki/knowledge/welcome.md", await exists(join(TEST_DIR, "vault", "wiki", "knowledge", "welcome.md")));
    expect("creates vault/templates/article.md", await exists(join(TEST_DIR, "vault", "templates", "article.md")));
    expect("creates vault/raw/ dir", await exists(join(TEST_DIR, "vault", "raw")));
    expect("creates vault/output/ dir", await exists(join(TEST_DIR, "vault", "output")));
    expect("configures .claude/settings.json", await exists(join(TEST_DIR, ".claude", "settings.json")));
    expect("reports success", stdout.includes("compound vault ready"));
  }

  console.log("\nTest: second run is idempotent");
  {
    const firstSettings = await readFile(join(TEST_DIR, ".claude", "settings.json"), "utf-8");
    const { stdout, code } = runInstaller();
    expect("exit code 0", code === 0);
    expect("reports at least one [skip]", stdout.includes("[skip]"));
    const secondSettings = await readFile(join(TEST_DIR, ".claude", "settings.json"), "utf-8");
    expect("settings.json unchanged", firstSettings === secondSettings);
  }

  console.log("\nTest: preserves existing user settings");
  {
    const settingsPath = join(TEST_DIR, ".claude", "settings.json");
    const userConfig = JSON.parse(await readFile(settingsPath, "utf-8"));
    userConfig.theme = "dark";
    userConfig.hooks.SessionStart.push({ hooks: [{ type: "command", command: "echo user-hook" }] });
    await writeFile(settingsPath, JSON.stringify(userConfig, null, 2));

    const { code } = runInstaller();
    expect("exit code 0", code === 0);

    const after = JSON.parse(await readFile(settingsPath, "utf-8"));
    expect("preserves user theme", after.theme === "dark");
    expect("preserves user SessionStart hook", after.hooks.SessionStart.some(h => JSON.stringify(h).includes("user-hook")));
    expect("still has compound SessionStart hook", after.hooks.SessionStart.some(h => JSON.stringify(h).includes("vault-session-start")));
  }

  console.log("\nTearing down...");
  await rm(TEST_DIR, { recursive: true, force: true });

  console.log(`\n${failures === 0 ? "✓ All install tests passed" : `✗ ${failures} failure(s)`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Test suite error:", e);
  process.exit(1);
});
