# Philosophy — Why compound works

Andrej Karpathy posted on 2026-04-02 about using LLMs as personal knowledge base maintainers. The insight that makes this work:

> Compile knowledge once at ingest, not every time you query.

This is the opposite of RAG. RAG re-searches your corpus on every query. A compiled wiki means the LLM already knows the structure: article titles, summaries, backlinks, indexes. When you ask, it reads the relevant handful of articles — usually 3–8 — and answers. No vector DB. No embeddings. No chunking.

## When this works

- ≤500 articles per vault. Beyond that, the `_master-index.md` exceeds the context window and you need a search CLI.
- Domains where structure matters. Code debugging, research notes, decision logs, business strategy.
- Single-user vaults. Multi-user needs conflict resolution we don't handle yet.

## When this doesn't work

- You have 50K+ documents. Use RAG.
- You need real-time updates from external sources. Use a crawler + RAG.
- You need fuzzy retrieval (finding "that thing I half-remember"). Embeddings still win.

## The three canonical pieces

### schema.md — declared structure

Every Karpathy-style vault has a schema. It tells the LLM:
- What categories exist.
- When to create a new one (3+ related articles).
- How the ingest flow works.
- What log types are valid.
- How files are named.

Without `schema.md`, the LLM has to infer structure every session. With it, structure is load-bearing.

### log.md — append-only audit

Every mutation to the wiki appends one line to `log.md`:
```
[2026-04-23T14:00:00Z] INGEST: clips/foo.md → tecnico/foo.md
```

Why it matters:
- You can always see what changed and when.
- The LLM reads recent entries at SessionStart for context.
- Lint can validate that declared actions actually happened.
- If something breaks, you have a clean audit trail.

### Query→Wiki — conversations become knowledge

The typical knowledge base is write-once, read-many. Karpathy's pattern adds a feedback loop: **valuable conversations become new articles automatically**.

The criterion: "Would I want to re-read this in 30 days?" If yes, the LLM archives the answer as a new article with backlinks to every cited source. Over months, the vault compounds — hence the name.

## Why most tools miss this

Looking at the ecosystem as of 2026-04:

| Tool | schema.md | log.md | Query→Wiki | Stars |
|------|:---------:|:------:|:----------:|------:|
| **compound** | ✅ | ✅ | ✅ | — |
| claude-mem | ❌ (SQLite) | ❌ | ❌ | 89K |
| llm-wiki-agent | ❌ | ❌ | ❌ | 2.2K |
| claude-memory-compiler | ❌ | ❌ | ❌ | 873 |
| llm-wiki | ❌ | ❌ | ❌ | 149 |
| llm-knowledge-bases | ❌ | ❌ | ❌ | 18 |

Most tools are ingest pipelines. They compile raw sources into a wiki and stop there. The wiki becomes a graveyard of imports without a self-maintenance loop.

## Further reading

- [Karpathy's original thread](https://x.com/karpathy/status/2039805659525644595) (2026-04-02)
- [Karpathy's LLM knowledge bases gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
