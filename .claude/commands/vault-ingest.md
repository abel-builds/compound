---
description: Compile pending raw/ files into wiki/. Force the ingest flow even if no SessionStart hook fired.
---

# /vault-ingest [optional-file-pattern]

The user wants to compile raw sources into the wiki NOW (not waiting for the SessionStart hook).

1. **Detect pending files:**
   - If user passed a pattern (e.g., `/vault-ingest clips/2026*`), list files matching that pattern under `vault/raw/`.
   - If no pattern, list all non-archive files under `vault/raw/**/*.md` (and `.txt`, `.html`).
   - Exclude anything under `vault/raw/_archive/`.

2. **If nothing to ingest:** tell the user in 1 line and exit. Do NOT pretend to do work.

3. **For each pending file (or folder-bucket of files):**
   - Read the file(s).
   - Extract: main topic, key insights, data points, decisions.
   - Decide category (read `vault/schema.md` first if not already loaded).
   - Create or update `vault/wiki/<category>/<slug>.md` using `vault/templates/article.md` as format.
   - Add internal links `[[...]]` to related articles if obvious.
   - Update `vault/wiki/<category>/_index.md`.
   - Append `vault/log.md`: `[ISO] INGEST: <source> → <article>.md`.
   - Move source to `vault/raw/_archive/<same-relative-path>/`.

4. **Batch progress reporting:**
   - If there are >3 files, process them silently and show one summary line per file: `✓ <source> → <category>/<article>.md`.
   - At the end, 1-line total: `Ingested N files into <M> articles across <K> categories.`

5. **After all files processed:**
   - The SessionEnd hook will reconcile `_master-index.md` automatically. Do NOT manually edit it.

**Constraints:**
- If a raw file is >10KB, skim the first 2KB + scan for headings before deciding category.
- If a raw file is an obvious duplicate of an existing article, update the existing article instead of creating a new one (log as UPDATE, not INGEST).
- Never ask "should I create a new category?" — apply the rule from `vault/schema.md` (3+ related articles).
