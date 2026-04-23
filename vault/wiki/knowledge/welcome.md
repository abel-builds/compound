# Welcome to your compound vault

**TL;DR:** This is the seed article. Your vault is now live. Drop sources in `vault/raw/`, ask Claude anything, and this wiki will grow automatically.

**Date:** 2026-04-23
**Tags:** onboarding, compound

## What just happened

You installed `compound`, a Karpathy-style knowledge base for Claude Code. The vault is structured so that Claude can maintain it autonomously:

- `vault/raw/` — drop sources here (articles, tweets, PDFs, notes).
- `vault/wiki/` — Claude compiles those sources into structured articles with backlinks.
- `vault/log.md` — every change is logged chronologically.
- `vault/schema.md` — Claude reads this to know how to organize things.

## Your next steps

1. **Drop a source.** Put any `.md`, `.txt`, or text file into `vault/raw/`. Example: paste an article you want to remember.
2. **Start a Claude Code session.** The `SessionStart` hook will detect the raw file and instruct Claude to compile it into the wiki automatically.
3. **Ask a question.** Once the wiki has content, ask Claude anything related. It will read the relevant wiki articles and answer. If the answer is substantive, Claude will archive it via the Query→Wiki flow.
4. **Lint periodically.** Run `/vault-lint` every 10–20 sessions to catch drift (stale indexes, broken links, orphans).

## The Karpathy loop

`raw/` (your inbox) → `wiki/` (Claude's brain) → Q&A (conversations) → `output/` (reports) → back to `wiki/` (compounding).

The insight: **compile knowledge once at ingest, not every time you query**. This is the opposite of RAG. At small-to-medium scale (≤500 articles) the LLM can maintain summaries and indexes well enough to answer questions by reading directly.

## Customizing

- Change the vault location with the `VAULT_ROOT` environment variable.
- Define your own categories when topics emerge (see `vault/schema.md`).
- Use Obsidian as the frontend to browse the wiki with backlinks and graph view.

## Archive this article

Once you've read it, you can delete `vault/wiki/knowledge/welcome.md` — it's just the seed. Or leave it as a reference. Either is fine.

## Related

- [[../../schema]] — vault rules (categories, flows, logging)
- [Karpathy's original thread](https://x.com/karpathy/status/2039805659525644595)
