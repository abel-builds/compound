# Schema — Vault Structure (Karpathy Pattern)

> Defines categories, flows, and rules. The LLM reads this file to know exactly
> how to maintain the wiki. Update this file when structure changes.

---

## How categories work

Categories emerge organically. A category is created when a topic accumulates 3+ potential articles. Start with one default category (`knowledge/`) and let the system grow.

### Default category

**knowledge/** — general notes, insights, references. Every new article starts here until a clearer category emerges.

### Creating new categories

When processing a raw file (or during a query), if you identify 3+ articles that share a theme and don't fit `knowledge/`, create a new category:

1. Create folder: `vault/wiki/<new-category>/`.
2. Create `_index.md` using template at `vault/templates/category-index.md`.
3. Move the 3+ articles into the new folder.
4. Update `vault/wiki/_master-index.md` reference (the SessionEnd hook also auto-reconciles).
5. Log entry: `[ISO-timestamp] SCHEMA: new category <name> created from <article-list>`.

Examples of good categories (create on demand):
- `negocios/` — business, strategy, market research
- `ai-herramientas/` — AI tools, prompts, skills
- `tecnico/` — engineering notes, bugs, decisions
- `personal/` — personal notes, lessons

Do NOT pre-create empty categories. Let them emerge.

---

## Flows

### Ingest flow (raw/ → wiki/)

Triggered by: files present in `vault/raw/` at SessionStart, OR user runs `/vault-ingest`.

1. Read each new file in `vault/raw/` (non-archive subfolders).
2. Extract insights, data, key decisions. Identify the topic.
3. Decide category:
   - Does an existing category fit? → use it.
   - Does the topic fit `knowledge/`? → use it.
   - Should a new category emerge (3+ related articles exist)? → create it per rules above.
4. Create or update `vault/wiki/<category>/<article-slug>.md`.
   - Prefer updating an existing article over creating a duplicate.
   - Always include a 1–2 sentence TL;DR at the top.
5. Add internal links `[[other-article]]` to related articles.
6. Update `vault/wiki/<category>/_index.md`.
7. Append entry to `vault/log.md`: `[ISO-timestamp] INGEST: <source-file> → <article>.md`.
8. Move the raw source to `vault/raw/_archive/<bucket>/`.

### Query→Wiki flow (valuable answer → new article)

Triggered when: a user query produces a substantive answer (original research, reusable insight, synthesis across sources).

Criterion: "Would this be worth re-reading in 30 days?" If yes:

1. Write the answer as an article in the appropriate category (same rules as Ingest).
2. Include a short TL;DR and a "Source query" section with the original question.
3. Add internal links.
4. Update category `_index.md`.
5. Append log entry: `[ISO-timestamp] QUERY→WIKI: <brief topic> → <article>.md`.

If the criterion is "no", answer normally without archiving. Don't pollute the wiki with conversational chatter.

### Lint flow (health check)

Triggered by: `/vault-lint`, OR automatically every ~10 sessions (track last lint in log.md).

1. Read `vault/wiki/_master-index.md`. Compare declared article count vs real count (recursive `.md` files under `wiki/` excluding `_*.md`).
2. Check every internal link `[[...]]` resolves to an existing article.
3. Find orphan articles (no inbound links from any other wiki article).
4. Find stale articles (mtime >90 days, no recent edit).
5. Find near-duplicates (>80% content similarity by heuristic: shared 4-grams).
6. Find categories with 1–2 articles (candidates for merge into `knowledge/`).
7. Report findings. Propose fixes. Wait for user approval.
8. On approval, execute fixes. Append log entry: `[ISO-timestamp] LINT: <N> audited, <X> issues, <Y> fixed`.

### Category emergence flow

See "Creating new categories" above. Always triggered by Ingest when pattern detected, never proactively by the user.

---

## Log entry types

Every mutation of the vault MUST append one line to `vault/log.md`:

```
[2026-04-23T14:00:00Z] TYPE: concise description
```

Valid types:
- `INGEST` — raw file compiled into wiki
- `UPDATE` — existing article edited
- `QUERY→WIKI` — conversation insight archived
- `LINT` — health check executed
- `SCHEMA` — category created/renamed/merged
- `FIX` — corrected an error in a previous entry/article

Rules:
- Append-only. Never delete or reorder entries.
- One line per event (multi-line descriptions allowed with 2-space indent for continuation).
- ISO-8601 UTC timestamps (`YYYY-MM-DDTHH:MM:SSZ`).

---

## File naming

- All filenames: `kebab-case.md`.
- No accents, no ñ, no special characters, no spaces.
- Templates named generically: `article.md`, `category-index.md`.
- Indexes prefixed with underscore: `_index.md`, `_master-index.md` (excluded from content scans).

## File formats

Every wiki article should have:

```markdown
# Title

**TL;DR:** 1–2 sentences so the LLM can Q&A without re-reading.

**Date:** YYYY-MM-DD
**Tags:** tag1, tag2 (optional)

Content...

## Related
- [[article-1]]
- [[article-2]]
```

## What does NOT go in the wiki

- Source code (belongs in repos).
- Active debug logs (ephemeral).
- Credentials, secrets, tokens (keep in `personal/` if needed, git-ignore).
- Data that changes daily (use `vault/output/` for ephemeral reports).
- Information derivable from git log or grep.
