<div align="center">

# compound

**A self-compounding knowledge base for Claude Code.**
**Inspired by [@karpathy](https://x.com/karpathy/status/2039805659525644595).**

> claude-mem remembers what you did.
> compound understands what you know.

[English](#english) · [Español](#español)

</div>

---

## English

### What is this

`compound` gives Claude Code a brain that grows with every session. You drop sources in `vault/raw/`, Claude compiles them into a structured wiki in `vault/wiki/`, archives insights from conversations as new articles, and logs every mutation to `vault/log.md`.

It's not session memory. It's a knowledge base — markdown files, Obsidian-compatible, fully transparent, LLM-maintained.

### 30-second demo

<p align="center">
  <!-- Replace this placeholder with the actual demo GIF once recorded -->
  <em>Demo GIF coming in v0.1.1. See <code>docs/demo-script.md</code> for how we record it.</em>
</p>

### Why it's different

Every existing memory tool for Claude Code falls into one of two camps:
1. **Session storage** (claude-mem, etc.) — remembers what happened, loses structure.
2. **Wiki compilers** (llm-wiki-agent, etc.) — structured, but no audit log, no automatic archival from conversations, no schema.

`compound` is the only system with all three Karpathy canonical pieces:
- ✅ `schema.md` — declares categories and flows. Claude reads it first.
- ✅ `log.md` — append-only audit. Every ingest, update, query→wiki, lint is recorded.
- ✅ `Query→Wiki` — valuable conversation insights auto-archive as new articles.

Plus: zero-config default, organic category emergence, Obsidian-native, MIT licensed.

### Install

```bash
# In any project directory:
git clone https://github.com/abel-builds/compound.git
cd compound
bash scripts/setup.sh       # macOS/Linux
# or
.\scripts\setup.ps1          # Windows PowerShell
```

Or directly from an existing Claude Code project:
```bash
npx github:abel-builds/compound init        # installs vault in current dir
npx github:abel-builds/compound init --global # installs vault at ~/vault/ (recommended)
```

Requires: Claude Code installed, Node 18+. Obsidian recommended as viewer.

### Your first 5 minutes

1. Drop a source in `vault/raw/` (any `.md` file — an article, a note, a tweet thread).
2. Open the folder in Claude Code and start a session. The `SessionStart` hook surfaces the raw file and instructs Claude to compile it automatically.
3. Ask Claude a question about the topic. It reads your wiki and answers.
4. If the answer is worth remembering, Claude archives it as a new article (Query→Wiki).
5. Run `/vault-status` to see your vault grow.

### Structure

```
compound/
├── CLAUDE.md                  ← rules Claude follows in this project
├── plugin.json                ← Claude Code plugin manifest
├── install.js                 ← idempotent installer
├── .claude/
│   ├── settings.json          ← SessionStart + SessionEnd hooks
│   └── commands/              ← 6 slash commands
├── herramientas/              ← hook scripts (Node.js)
├── vault/
│   ├── schema.md              ← category + flow rules (read first)
│   ├── log.md                 ← append-only activity log
│   ├── raw/                   ← YOU drop sources here
│   ├── wiki/                  ← CLAUDE compiles the knowledge base here
│   │   ├── _master-index.md
│   │   └── knowledge/
│   │       └── welcome.md
│   ├── output/                ← reports, renders
│   └── templates/             ← article + category templates
└── scripts/                   ← setup scripts
```

### Slash commands

| Command | What it does |
|---------|--------------|
| `/vault-status` | Overview: article count, recent activity, pending raw. |
| `/vault-ingest` | Compile pending `raw/` files into the wiki. |
| `/vault-query` | Ask the vault a question; archive the answer if worth it. |
| `/vault-lint` | Health check: orphans, broken links, stale articles, duplicates. |
| `/vault-setup` | Interactive configuration. |
| `/vault-config` | View or change settings. |

### The Karpathy loop

1. **Ingest** — drop source in `raw/`. Claude compiles at next session start.
2. **Compile** — Claude creates/updates articles, adds backlinks, updates indexes, logs the mutation.
3. **Query** — ask anything. Claude reads the wiki and answers.
4. **Archive** — valuable answers become new articles (Query→Wiki).
5. **Lint** — `/vault-lint` detects drift. Runs automatically every ~10 sessions.

The insight: **compile knowledge once at ingest, not every time you query**. Opposite of RAG. At ≤500 articles the LLM handles summaries and indexes directly — no vector DB needed.

### Philosophy

- One article = one topic. TL;DR at the top.
- Dense `[[backlinks]]` between articles.
- Indexes are LLM-maintained. Never hand-edit.
- `raw/` is your inbox. `wiki/` is Claude's brain.
- Every mutation logged. Transparent by design.

See [docs/philosophy.md](docs/philosophy.md) for the full argument.

### Configuration

- `VAULT_ROOT` env var — override the vault location.
- `.compound/config.json` — per-project settings.
- `/vault-config` slash command — interactive.

### FAQ

See [docs/faq.md](docs/faq.md).

Quick answers:
- **Does it work without ANTHROPIC_API_KEY?** Yes, entirely. The hooks don't call the API.
- **Does it send my data anywhere?** No. Everything is local. Only Claude's normal conversation traffic reaches Anthropic.
- **Can I use it with an existing vault?** Yes. Point `VAULT_ROOT` at your current vault and the hooks will adapt.

### Credits

- Concept: [Andrej Karpathy](https://x.com/karpathy/status/2039805659525644595).
- Claude Code: [Anthropic](https://claude.com/claude-code).
- Obsidian Web Clipper: [kepano](https://github.com/kepano/obsidian-web-clipper).

### License

MIT. See [LICENSE](LICENSE).

---

## Español

### Qué es esto

`compound` le da a Claude Code un cerebro que crece con cada sesión. Tirás fuentes en `vault/raw/`, Claude las compila a una wiki estructurada en `vault/wiki/`, archiva insights de las conversaciones como nuevos artículos, y loguea cada cambio en `vault/log.md`.

No es memoria de sesión. Es una base de conocimiento — archivos markdown, compatible con Obsidian, totalmente transparente, mantenida por el LLM.

### Por qué es distinto

Las memorias existentes para Claude Code caen en dos campos:
1. **Session storage** (claude-mem) — recuerda qué pasó, pierde estructura.
2. **Wiki compilers** (llm-wiki-agent) — estructurados pero sin audit log, sin archivado automático de conversaciones, sin schema.

`compound` es el único sistema con las tres piezas canónicas de Karpathy:
- ✅ `schema.md` — declara categorías y flujos. Claude lo lee primero.
- ✅ `log.md` — append-only audit. Cada ingest, update, query→wiki, lint queda registrado.
- ✅ `Query→Wiki` — los insights valiosos de conversación se archivan automáticamente como artículos nuevos.

Más: zero-config por default, categorías que emergen orgánicamente, Obsidian-native, licencia MIT.

### Instalación

```bash
git clone https://github.com/abel-builds/compound.git
cd compound
bash scripts/setup.sh       # macOS/Linux
# o
.\scripts\setup.ps1          # Windows PowerShell
```

Requisitos: Claude Code instalado, Node 18+. Obsidian recomendado como visor.

### Tus primeros 5 minutos

1. Tirá una fuente en `vault/raw/` (cualquier `.md`).
2. Abrí la carpeta en Claude Code. El hook `SessionStart` detecta el archivo y le dice a Claude que lo compile automáticamente.
3. Hacele una pregunta a Claude. Lee tu wiki y responde.
4. Si la respuesta vale la pena, Claude la archiva como artículo nuevo (Query→Wiki).
5. `/vault-status` para ver crecer tu vault.

### Créditos

- Concepto: [Andrej Karpathy](https://x.com/karpathy/status/2039805659525644595).
- Claude Code: [Anthropic](https://claude.com/claude-code).
- Obsidian Web Clipper: [kepano](https://github.com/kepano/obsidian-web-clipper).
