---
description: One-shot vault overview: article count, recent activity, pending raw files, vault location.
---

# /vault-status

Report vault state concisely. Target: 8–12 lines.

**Gather:**

1. **Location:** current vault root (from `VAULT_ROOT` env var or default `./vault/`).
2. **Articles:** total count (recursive `.md` under `wiki/` excluding `_*.md`).
3. **Categories:** list with per-category count.
4. **Pending raw:** count of files under `raw/` (not `_archive/`).
5. **Last 3 log entries** from `vault/log.md`.
6. **Health flags:** 
   - Master-index stale? (mtime older than newest article)
   - Declared count mismatch?
   - Any raw files >24h old?

**Output format:**

```
compound vault: /path/to/vault

📚 42 articles across 4 categories
   knowledge: 28 | tecnico: 8 | negocios: 4 | personal: 2

📥 Raw pending: 0 files
📅 Last activity: 2026-04-22 (1 day ago)

Recent log:
  [2026-04-22T14:03:12Z] INGEST: clips/foo.md → tecnico/foo.md
  [2026-04-22T10:45:01Z] QUERY→WIKI: cache strategy → tecnico/cache.md
  [2026-04-21T18:22:40Z] UPDATE: negocios/pricing.md

Health: ✅ OK   |   Run /vault-lint for deep check.
```

If any health flag is triggered, replace `✅ OK` with `⚠ <issue>` and suggest the command to fix.

**Constraints:**
- Never modify anything. Read-only command.
- If vault doesn't exist yet, tell the user to run `/vault-setup` or the installer.
