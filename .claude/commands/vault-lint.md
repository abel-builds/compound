---
description: Full health check of the vault. Detects orphans, broken links, stale articles, duplicates, and index mismatches.
---

# /vault-lint

The user wants a comprehensive integrity check.

**Steps:**

1. **Count check:**
   - Real count: recursive `*.md` files under `vault/wiki/` excluding `_*.md`.
   - Declared count: parse `Total articles: N` from `vault/wiki/_master-index.md`.
   - If mismatch: report `Declared N, real M, diff D`.

2. **Broken wikilinks:**
   - For every `[[link]]` in every wiki article, verify the target exists as a file or section.
   - Report each broken link with the source article and the broken target.

3. **Orphan articles:**
   - For each article, count inbound links from other articles.
   - Articles with 0 inbound links (except seed articles like `welcome.md`) → report as orphans.
   - Exception: articles explicitly marked with tag `tag: standalone` are not orphans.

4. **Stale articles:**
   - Articles with `mtime` > 90 days old AND referenced by fewer than 2 other articles.
   - Report with the article path + age in days.

5. **Duplicate candidates:**
   - For each pair of articles, compute 4-gram similarity (proxy for content overlap).
   - Report pairs with >70% shared 4-grams as merge candidates.

6. **Under-populated categories:**
   - Categories with <3 articles → candidates for merge into `knowledge/`.

7. **Log integrity:**
   - Parse `vault/log.md`. Check every entry follows `[ISO] TYPE: description` format.
   - Check timestamps are monotonic (no backwards jumps >1h).

8. **Present findings:**

   ```
   LINT REPORT (vault: /path/to/vault)
   
   ✅ Article count: 42 (match)
   ⚠ Broken links: 3
     - knowledge/foo.md → [[missing-article]]
     - ...
   ⚠ Orphans: 2
     - tecnico/forgotten-note.md
     - ...
   ⚠ Stale (>90d): 1
   ⚠ Duplicate candidates: 0
   ⚠ Under-populated: 1 (personal: 2 articles)
   ⚠ Log issues: 0
   
   Propose fixes? [y/N]
   ```

9. **On approval**, apply fixes one category at a time. Update `vault/log.md`: `[ISO] LINT: <total> audited, <issues> issues, <fixed> fixed`.

**Constraints:**
- Never auto-delete articles. Orphans and stale articles are FLAGGED only. User decides.
- Merges require explicit confirmation per pair.
- If `vault/log.md` has integrity issues, DO NOT auto-fix. Ask the user to inspect manually (the log is a source of truth — never rewrite it silently).
