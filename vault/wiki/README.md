# wiki/ — The LLM's brain

This folder is maintained by Claude. **Do not edit `_*.md` files manually.**

## Structure

```
wiki/
├── _master-index.md         ← auto-maintained table of contents
└── <category>/
    ├── _index.md            ← auto-maintained per-category index
    └── <article>.md         ← individual articles
```

## Article conventions

- **Filenames:** `kebab-case.md`, no accents.
- **Top of file:** 1–2 sentence TL;DR so the LLM can answer Q&A without re-reading the whole article.
- **Links:** `[[wiki-link]]` Obsidian-style for internal references.
- **Updates:** when an article changes, Claude updates the category `_index.md`. The `_master-index.md` is reconciled by the `SessionEnd` hook.

## Built-in categories

None by default. Categories are created when a topic accumulates 3+ articles. Common examples:

- `negocios/` — business, strategy, market research
- `ai-herramientas/` — AI tools, prompts, skills, agents
- `personal/` — personal notes, ideas, lessons

Create your own as topics emerge.
