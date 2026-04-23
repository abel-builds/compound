# compound

> A Karpathy-style LLM knowledge base, wired into Claude Code. Your LLM owns the wiki.
>
> Un sistema de knowledge base estilo Karpathy, integrado con Claude Code. El LLM es el dueño de la wiki.

Inspired by [Andrej Karpathy's tweet on LLM Knowledge Bases](https://x.com/karpathy/status/2039805659525644595). This repo gives you the scaffold + hooks + conventions to make it work inside [Claude Code](https://claude.com/claude-code).

[English](#english) · [Español](#español)

---

## English

### What this is

A ready-to-run knowledge base that your LLM agent maintains **autonomously**:

- You drop raw sources (articles, tweets, papers, research) into `vault/raw/`.
- Claude Code incrementally compiles them into a structured wiki (`vault/wiki/`) with backlinks, categories, and indexes — all in markdown, viewable in Obsidian.
- Session hooks keep the wiki healthy: detect new raw files at startup, check consistency at shutdown.
- You rarely touch the wiki directly. Claude does.

### Why use it

- **No RAG needed.** As Karpathy notes, at small-to-medium scale (~100–400 articles) the LLM auto-maintains summaries and indexes well enough to answer questions by reading relevant notes directly.
- **Obsidian as frontend.** View the raw sources, the compiled wiki, and derived outputs in one place.
- **Session memory baked in.** The `SessionStart` hook injects what's pending into Claude's context automatically; `SessionEnd` flags debt.

### Quick start

Requires: Claude Code installed, Node 18+, Obsidian (optional but recommended), [Obsidian Web Clipper](https://obsidian.md/clipper) (optional, for capturing web content).

```bash
git clone https://github.com/<user>/compound.git
cd compound
bash scripts/setup.sh
```

Open the folder in Claude Code. The `SessionStart` hook fires; Claude sees the vault state and is ready to work.

### Structure

```
compound/
├── CLAUDE.md             ← Rules Claude follows inside this project
├── .claude/
│   └── settings.json     ← SessionStart + SessionEnd hooks
├── herramientas/         ← Hook scripts (Node.js)
│   ├── vault-session-start.mjs
│   └── vault-check.mjs
├── vault/
│   ├── raw/              ← You drop sources here
│   ├── wiki/             ← Claude builds/maintains this
│   │   └── _master-index.md
│   ├── output/           ← Reports, one-shot query results
│   └── templates/        ← Obsidian templates (optional)
├── docs/                 ← Walkthroughs
└── scripts/              ← Setup + utilities
```

### The Karpathy loop

1. **Ingest**: drop a clip in `vault/raw/`. Use Obsidian Web Clipper for web pages.
2. **Compile**: next Claude Code session, the `SessionStart` hook surfaces it. Claude reads, summarizes, files into a category under `vault/wiki/`, updates indexes and backlinks, archives the raw.
3. **Query**: ask Claude anything. It reads the relevant wiki notes (indexes guide it) and answers.
4. **Output**: Claude writes reports to `vault/output/`, then "files them back" as wiki articles if worth keeping.
5. **Lint**: the `SessionEnd` hook detects drift (stale indexes, uncompiled raw, count mismatches). Next session, Claude catches up.

### Philosophy

- One article = one topic. Short TL;DR at the top so the LLM can Q&A without RAG.
- Dense backlinks between articles (`[[wiki-link]]` style).
- Indexes (`_index.md` per category + `_master-index.md`) are LLM-maintained, never hand-edited.
- `raw/` is your inbox. `wiki/` is the LLM's brain.

---

## Español

### Qué es esto

Una base de conocimiento lista para correr que tu agente LLM mantiene **autónomamente**:

- Vos tirás fuentes crudas (artículos, tweets, papers, investigación) en `vault/raw/`.
- Claude Code las compila incrementalmente a una wiki estructurada (`vault/wiki/`) con backlinks, categorías e índices — todo en markdown, visible en Obsidian.
- Los hooks de sesión mantienen la wiki sana: detectan archivos nuevos al arrancar, chequean consistencia al cerrar.
- Vos rara vez tocás la wiki directamente. Claude sí.

### Por qué usarlo

- **Sin RAG.** Como dice Karpathy, a escala chica-media (~100–400 artículos) el LLM auto-mantiene resúmenes e índices lo suficientemente bien como para responder leyendo directamente las notas relevantes.
- **Obsidian como frontend.** Ves las fuentes crudas, la wiki compilada y los outputs en un solo lugar.
- **Memoria de sesión incluida.** El hook `SessionStart` inyecta lo pendiente al contexto de Claude automáticamente; `SessionEnd` marca deuda.

### Inicio rápido

Requisitos: Claude Code instalado, Node 18+, Obsidian (opcional pero recomendado), [Obsidian Web Clipper](https://obsidian.md/clipper) (opcional, para capturar contenido web).

```bash
git clone https://github.com/<usuario>/compound.git
cd compound
bash scripts/setup.sh
```

Abrí la carpeta en Claude Code. El hook `SessionStart` se dispara; Claude ve el estado del vault y está listo para trabajar.

### El loop Karpathy

1. **Ingesta**: tirás un clip en `vault/raw/`. Usá Obsidian Web Clipper para páginas web.
2. **Compilación**: próxima sesión de Claude Code, el hook `SessionStart` lo expone. Claude lee, resume, archiva en una categoría bajo `vault/wiki/`, actualiza índices y backlinks, mueve el raw a `_archive/`.
3. **Consulta**: le preguntás a Claude cualquier cosa. Lee las notas relevantes (los índices lo guían) y responde.
4. **Output**: Claude escribe reportes en `vault/output/`, y los "archiva de vuelta" como artículos wiki si vale la pena conservarlos.
5. **Linting**: el hook `SessionEnd` detecta desincronización (índices viejos, raw sin compilar, counts mal). Próxima sesión, Claude se pone al día.

### Filosofía

- Un artículo = un tema. TL;DR corto al inicio para que el LLM pueda Q&A sin RAG.
- Backlinks densos entre artículos (estilo `[[link-wiki]]`).
- Los índices (`_index.md` por categoría + `_master-index.md`) los mantiene el LLM, nunca se editan a mano.
- `raw/` es tu inbox. `wiki/` es el cerebro del LLM.

---

## License

MIT. See [LICENSE](LICENSE).

## Credits

- Concept: [Andrej Karpathy](https://x.com/karpathy/status/2039805659525644595).
- Claude Code: [Anthropic](https://claude.com/claude-code).
- Obsidian Web Clipper: [kepano](https://github.com/kepano/obsidian-web-clipper).
