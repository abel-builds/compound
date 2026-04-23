---
description: Interactive vault configuration. Use to customize categories, rename, change location.
---

# /vault-setup

The user wants to configure or reconfigure their vault. Do the following:

1. **Detect current state:**
   - Read `vault/schema.md` (if exists). Note existing categories.
   - Read `vault/log.md` (if exists). Show the last 3 entries.
   - Count existing articles in `vault/wiki/**/*.md` (exclude `_*.md`).
   - Check `VAULT_ROOT` env var. Report current vault location.

2. **Present current config** as a short summary (3–5 lines). Example:
   - Location: `./vault/` (or the VAULT_ROOT value)
   - Categories: knowledge, <others>
   - Articles: N
   - Last activity: <last log entry>

3. **Offer changes** as a multiple-choice menu:
   - **(a)** Add a new category (then prompt for name + description).
   - **(b)** Rename an existing category (prompt for old + new name; rename folder + update references in `_master-index.md` + any `[[links]]`).
   - **(c)** Change vault location (explain VAULT_ROOT env var; don't auto-move files unless user explicitly confirms).
   - **(d)** Reset vault (destructive — require triple confirmation + create `vault-backup-YYYY-MM-DD.tar` first).
   - **(e)** Exit.

4. **Execute the chosen action**, then:
   - Append log entry `[ISO] SCHEMA: <what changed>`.
   - Update `vault/schema.md` if categories or flows changed.
   - Run a quick `/vault-lint` to verify consistency.

Do NOT modify anything unless the user picks an option. If config looks healthy, tell the user and exit.

Response format: terse. 1–2 sentences of status, then the menu.
