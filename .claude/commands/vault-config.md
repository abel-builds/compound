---
description: View or change vault configuration (location, default category, hook behavior). Non-destructive by default.
---

# /vault-config [key] [value]

The user wants to read or update config.

**Config keys:**

- `location` — vault root. Default: `./vault/`. Override with `VAULT_ROOT` env var.
- `default_category` — category for new ingest when none fits. Default: `knowledge`.
- `session_end_hook` — `enabled` (default) or `disabled`. Controls whether `vault-check.mjs` runs at SessionEnd.
- `lint_interval` — sessions between automatic lints. Default: `10`.

**Behavior:**

1. **No args** (`/vault-config`): print the current config as a table. Read from `.compound/config.json` if exists, else defaults.

2. **Key only** (`/vault-config location`): print that key's current value + where it came from (default / config file / env var).

3. **Key + value** (`/vault-config location ~/vault/`):
   - Validate the value.
   - For `location`: don't auto-move existing vault. Print: `Set. Existing vault at old location won't be moved. To migrate: mv <old> <new>.`
   - For `session_end_hook`: enable/disable by editing `.claude/settings.json` (preserve existing hooks).
   - Write to `.compound/config.json` (create if missing).
   - Append `vault/log.md`: `[ISO] SCHEMA: config <key>=<value>`.

**Config file format** (`.compound/config.json`):

```json
{
  "location": "./vault/",
  "default_category": "knowledge",
  "session_end_hook": "enabled",
  "lint_interval": 10
}
```

**Constraints:**
- Never modify files outside `.compound/`, `.claude/settings.json`, and `vault/log.md`.
- Validate values: paths exist (or are creatable), enums match, integers are positive.
- For destructive config changes (e.g., switching location), require confirmation.
