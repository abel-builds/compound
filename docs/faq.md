# FAQ

### Does compound require ANTHROPIC_API_KEY?

No. All hooks are pure Node.js. Claude Code itself handles the LLM calls. If you use Claude Max / Claude Pro subscription, compound works identically.

### Does it upload my data anywhere?

No. Everything is local markdown. Only Claude's conversation traffic reaches Anthropic (the same as any Claude Code usage). The hooks never make network calls.

### Can I use an existing Obsidian vault?

Yes. Set `VAULT_ROOT` to your existing vault path. Compound will add `schema.md` and `log.md` if missing and leave your articles alone. The SessionStart hook will instruct Claude to treat the existing structure as the current state of the world.

### How does it compare to claude-mem?

- claude-mem: session memory (what you did in the last N sessions), SQLite-backed, opaque.
- compound: knowledge base (what you know), markdown-backed, fully transparent, grows over time.

They solve different problems. You can run both.

### What happens when the vault grows past 500 articles?

At that point, `_master-index.md` starts to exceed a reasonable context window. You have three options:
1. Split into multiple vaults by domain (work / research / personal).
2. Add a search CLI (v0.2 roadmap).
3. Start using RAG for retrieval while keeping compound for compilation.

### Can I run compound in multiple projects?

Yes. Either:
- Global vault: `VAULT_ROOT=~/vault/` in your shell. Every project sees the same vault.
- Per-project: install compound in each project. Each has its own `vault/`.

### Do the hooks work on Windows?

Yes. The hooks are Node.js and cross-platform. Setup on Windows uses `scripts/setup.ps1` (PowerShell).

### Can I disable the auto-compile behavior?

Yes. Edit `.claude/settings.json` and remove the `SessionStart` hook entry. The slash commands (`/vault-ingest`, etc.) still work manually.

### What if I want my vault to be categorized differently?

Edit `vault/schema.md` and `vault/wiki/_master-index.md`. The LLM reads those first on every ingest. You can override the default `knowledge/` category or pre-create your own categories — just remember the 3+ articles rule for new category emergence.

### Can I contribute?

Yes. The repo is MIT licensed. PRs for bug fixes, cross-platform improvements, and new slash commands are welcome. Discuss large changes in an issue first.

### Where's the roadmap?

See [CHANGELOG.md](../CHANGELOG.md) for shipped features and planned items for v0.2+.
