# Changelog

## v0.1.0 — 2026-04-23

Initial release.

### Features
- Karpathy-canonical vault structure: `raw/`, `wiki/`, `schema.md`, `log.md`.
- SessionStart hook: detects pending raw files, surfaces them + last 3 log entries.
- SessionEnd hook: validates master-index count, detects stale master, checks log integrity.
- 6 slash commands: `vault-setup`, `vault-ingest`, `vault-query`, `vault-lint`, `vault-status`, `vault-config`.
- Idempotent installer (`install.js`). Safe to re-run.
- Cross-platform setup: `setup.sh` (macOS/Linux) + `setup.ps1` (Windows).
- Query→Wiki flow: conversation insights auto-archive as new articles.
- Organic category emergence: new categories created at 3+ related articles.
- Plugin manifest (`plugin.json`) for Claude Code plugin discovery.
- Bilingual README (EN + ES).

### Docs
- `docs/philosophy.md` — why compiled knowledge beats RAG at small scale.
- `docs/faq.md` — common questions.
- `CLAUDE.md` — in-repo rules Claude follows when working inside a vault.

## v0.2 (planned)

- MCP server for external query access.
- `vault-import` slash command (Notion, Evernote, plain folders).
- `vault-share` slash command (export subset of vault as sharable bundle).
- PreCompact hook for preserving context during Claude's compaction.
- Search CLI for vaults >500 articles.
- Interactive onboarding wizard in `install.js`.

## v0.3 (planned)

- Multi-vault support (work + personal with cross-linking).
- Git-based vault sync helpers.
- Team vaults (conflict resolution, per-user edits).
