# Compound — Design Spec

**Fecha:** 2026-04-23
**Estado:** Brainstorming → esperando aprobación del user
**Nombre tentativo:** `compound` (compounding knowledge base). Alternativas: `cc-vault`, `claude-vault`, `ideavault`.

---

## TL;DR

Un plugin de Claude Code que implementa el patrón de knowledge base de Karpathy. Después de `/plugin install compound`, el usuario tiene una wiki auto-mantenida que el LLM alimenta solo: tira fuentes en `raw/`, el LLM compila `wiki/`, los insights de sesión se archivan automáticamente, y el sistema se lint-ea a sí mismo. Markdown puro. Obsidian-ready. Zero-config por defecto.

**Hook de marketing:** *"claude-mem remembers what you did. compound understands what you know."*

---

## Problema

Claude Code pierde contexto entre sesiones. Los existentes:

- **claude-mem** (89K stars) — SQLite de sesión corta, no knowledge compounding, no human-readable.
- **llm-wiki-agent** (2.2K) — doc ingest a wiki, sin schema, sin log, sin Query→Wiki.
- **claude-memory-compiler** (873) — hooks de sesión, sin schema, sin `raw/`, sin log.
- **llm-knowledge-bases** (18) — parecido pero incompleto, no mantenido.

**Nadie tiene**: schema.md + log.md + Query→Wiki automático + captura de sesión + onboarding organizado. Eso es compound.

---

## Usuarios

- Devs de Claude Code que quieren memoria persistente entre sesiones.
- Conocedores de Karpathy / seguidores del thread 2026-04-02 sobre LLM knowledge bases.
- Users de Obsidian que ya tienen un vault y quieren que un LLM lo mantenga.
- Indie hackers que operan múltiples proyectos y necesitan knowledge compounding.

---

## Arquitectura

### Capa 1 — Estructura del vault (filesystem)

Default: **global** en `~/vault/`. Opcional: `--local` para vault por proyecto.

```
~/vault/
├── schema.md              ← Define categorías, flujos, reglas. LLM lee esto.
├── log.md                 ← Append-only. Cada INGEST/UPDATE/QUERY→WIKI/LINT/FIX.
├── CLAUDE.md              ← Reglas para Claude cuando cwd === vault/.
├── raw/                   ← Usuario tira fuentes crudas.
│   └── _archive/          ← Procesadas, preservadas.
├── wiki/                  ← LLM mantiene. Markdown puro.
│   ├── _master-index.md   ← TOC general auto-mantenido.
│   └── <categoria>/
│       ├── _index.md      ← TOC de categoría.
│       └── <articulo>.md
├── output/                ← Reportes y renders (Marp slides, imágenes matplotlib).
└── .obsidian/             ← Auto-generada si el user tiene Obsidian.
```

**Invariantes:**
- `schema.md` es la fuente de verdad sobre categorías/flujos. El LLM lo lee antes de cada operación de wiki.
- `log.md` nunca se borra ni reordena. Append-only.
- `raw/` es escritura del usuario, lectura del LLM. El LLM mueve a `raw/_archive/` post-procesamiento.
- `wiki/` es dominio del LLM. El usuario casi nunca edita directo (Obsidian render-only).
- Nombres: `kebab-case.md`, sin tildes ni ñ.

### Capa 2 — Skills y slash commands

Todo instalado bajo `~/.claude/plugins/compound/`.

**Meta-skill (siempre activa):** `compound.md`
- Describe el sistema al LLM.
- Define flujos Ingest, Query→Wiki, Lint.
- Define formato de log entries.
- Se auto-carga cuando el user está cwd-in o cwd-near un vault.

**Slash commands (explícitos):**
- `/vault` — overview rápido del vault (stats, recientes, raw/ pendientes).
- `/vault-setup` — configuración interactiva opcional (categorías custom, locación).
- `/vault-ingest [file]` — compilar un archivo específico de raw/.
- `/vault-query [pregunta]` — consulta sobre el wiki, archiva insight si vale.
- `/vault-lint` — health check completo (orphans, broken links, stale articles, duplicados).
- `/vault-config` — cambiar categorías, renombrar vault, mover location.

### Capa 3 — Hooks (opcionales)

Configurados en `.claude/settings.json` durante install, **solo si el user acepta**.

**SessionStart hook** (Node.js, <100ms, sin API calls):
- Lee `~/vault/raw/` buscando archivos nuevos (comparando contra `log.md`).
- Lee últimas 3 entradas de `log.md`.
- Inyecta en contexto inicial: "Vault status: N raw files pending. Recent activity: [entries]."
- El LLM decide cuándo actuar.

**SessionEnd hook** (Node.js + Agent SDK, requiere `ANTHROPIC_API_KEY`):
- Dispatches subprocess que revisa el transcript de la sesión.
- Identifica 0-N insights archivables.
- Los escribe como artículos Query→Wiki.
- Si no hay API key: skip silencioso con nota en settings.

**PreCompact hook** (opcional, future v0.2):
- Guarda contexto importante antes de la compresión de Claude.

### Capa 4 — Install (plugin)

**Vía Claude Code plugin system:**
```bash
/plugin install compound
```

**Fallback si el plugin system no sirve:**
```bash
npx compound-vault init
```

**El installer hace (idempotente):**
1. Detecta si hay vault ya (`~/vault/` o `./vault/`). Si existe: ofrece upgrade/skip/reset.
2. Crea estructura: `raw/`, `wiki/knowledge/`, `output/`, `.obsidian/` (si Obsidian detectado).
3. Copia templates: `schema.md`, `log.md`, `CLAUDE.md` (vault-level), `_master-index.md`, `wiki/knowledge/_index.md`.
4. Escribe seed article: `wiki/knowledge/welcome.md` — mini-tutorial que el user puede leer + el LLM procesa al iniciar.
5. Registra hooks en `.claude/settings.json` (merge, no overwrite). Solo si el user acepta.
6. Print: "✓ Vault created at ~/vault/. Run `/vault-status` to see it. Drop files in ~/vault/raw/ to start."

**Time target:** 15 segundos de setup.

---

## Flujos de datos

### Ingest (manual o auto)

1. User dropea archivo en `~/vault/raw/mi-fuente.pdf` (o .md, .txt, .html).
2. Next session: SessionStart hook avisa "1 raw file pending". O user corre `/vault-ingest`.
3. LLM lee el archivo, extrae conocimiento, decide categoría (lee schema.md).
4. LLM crea/actualiza `wiki/<cat>/articulo.md`. Agrega links internos `[[...]]`.
5. LLM actualiza `wiki/<cat>/_index.md` y `wiki/_master-index.md`.
6. LLM append a `log.md`: `[ISO] INGEST: mi-fuente.pdf → articulo.md`.
7. LLM mueve fuente a `raw/_archive/`.

### Query→Wiki

1. User hace pregunta sustantiva. LLM responde consultando wiki como contexto.
2. LLM aplica criterio: "¿valdría releer esto en 30 días?" Si sí:
3. Archiva la respuesta como artículo nuevo en `wiki/<cat>/`.
4. Log: `[ISO] QUERY→WIKI: respuesta sobre X → articulo.md`.

### Session capture (automática si hay API key)

1. User cierra sesión. SessionEnd hook fires.
2. Subprocess con Agent SDK analiza el transcript.
3. Identifica insights: decisiones tomadas, datos aprendidos, patrones descubiertos.
4. Escribe 0-N artículos Query→Wiki.
5. Log entries correspondientes.

### Lint (manual o periódico)

1. User corre `/vault-lint` (o auto cada 10 sesiones).
2. LLM:
   - Verifica que `_master-index.md` lista todos los artículos reales.
   - Chequea links `[[...]]` no rotos.
   - Detecta artículos >90 días sin update → propone refresh.
   - Detecta artículos duplicados (>80% similarity) → propone merge.
   - Detecta categorías con 1-2 artículos → propone promover a subcategoría.
3. User aprueba fixes propuestos.
4. LLM ejecuta los aprobados. Log: `[ISO] LINT: N auditados, X fixes aplicados`.

### Emergencia de categorías (Karpathy-style)

1. Al iniciar, existe solo `wiki/knowledge/`.
2. LLM procesa artículos. Si detecta 3+ artículos de un tema nuevo → propone categoría nueva.
3. User aprueba. LLM crea carpeta, mueve artículos, actualiza indices.
4. Log: `[ISO] SCHEMA: new category <nombre> created from <articulos>`.

---

## Error handling

| Escenario | Comportamiento |
|-----------|---------------|
| Vault ya existe al install | Prompt: upgrade / skip / reset |
| `ANTHROPIC_API_KEY` no seteado | SessionEnd hook skip silencioso + nota en README |
| Conflicto de hooks en settings.json | Merge: agregar los nuestros sin tocar los del user |
| `log.md` corrompido | Error + pedir inspección manual (nunca auto-fix sobre audit) |
| Permisos de filesystem bloqueados | Error claro + sugerencia de path alternativo |
| Plugin system de Claude Code no disponible | Fallback: `npx compound-vault init` |
| Windows path issues (`\` vs `/`) | Normalizar todo a `/` en templates |
| UTF-16 BOM de PowerShell | Forzar UTF-8 en todos los writes |

---

## Testing strategy

**Unit (skill + commands):**
- Cada skill actúa correctamente en aislamiento.
- Cada slash command produce el output esperado.

**Integration:**
- Fresh install → vault se crea correcto.
- Drop raw/ file → ingest flow completo.
- Query → Query→Wiki archival funciona.
- Lint → detecta issues sembrados.

**E2E (VM fresca):**
- Windows 10/11, macOS 14/15, Ubuntu 22/24.
- Install, usar 10 minutos con 3 archivos raw/ + 3 queries, verificar vault sano.
- SLA: install <30s, primera ingest <60s.

**Lint tests:**
- Artículo huérfano (no referenciado) → detectado.
- Link roto → detectado.
- Artículo duplicado sembrado → detectado.
- Artículo stale sembrado → detectado.

---

## Naming y branding

**Propuesta primaria:** `compound`

- Corto (8 chars).
- Claim claro: "compounding knowledge" (efecto compuesto Buffett/Naval).
- No pisa a Karpathy.
- npm/GitHub disponibilidad: verificar antes de commit final.

**Tagline:** *"A self-compounding knowledge base for Claude Code. Inspired by @karpathy."*

**Repo:** `github.com/<user>/compound`

**Slash commands:** `/vault`, `/vault-*` (no `/compound-*` para mantener UX natural del vault como concepto).

---

## Fuera de scope (YAGNI v0.1)

- MCP server (v0.2).
- Knowledge graph visualization custom (Obsidian ya tiene).
- Synthetic data + finetuning (Karpathy's future, out of our scope).
- Cloud sync (user's choice: git, Dropbox, iCloud).
- i18n de docs (EN + ES only).
- Import desde Notion/Evernote/etc (v0.2 si hay demand).
- Multi-user / team vaults (v0.3).

---

## Entregables V0.1 (qué se publica en el primer commit)

- `compound/` repo root con LICENSE (MIT), README.md, plugin.json.
- `compound/skills/compound.md` — meta-skill.
- `compound/commands/vault-{setup,ingest,query,lint,status,config}.md` — 6 slash commands.
- `compound/hooks/session-start.js` + `session-end.js`.
- `compound/templates/` — schema.md, log.md, vault-CLAUDE.md, _master-index.md, category-index.md, welcome.md.
- `compound/install.js` — instalador Node.js idempotente (fallback del plugin system).
- `compound/tests/` — tests E2E + integration.
- `README.md` — hook + 20-second demo GIF + install + how-it-works + FAQ.

**Success criteria del V0.1:**
- Fresh install en Windows/macOS/Linux completa en <30s sin errores.
- Primer ingest de un PDF funciona end-to-end.
- Query→Wiki archiva correctamente al menos 1 insight en un dogfood run de 20 minutos.
- Lint detecta issues sembrados en test fixtures.
- README tiene GIF demo funcional.

---

## Roadmap post-V0.1

- **V0.2:** MCP server opcional, `vault-import` (Notion/Evernote), PreCompact hook, `/vault-share` (export para compartir).
- **V0.3:** multi-vault (uno por proyecto + uno global con cross-linking), team vaults, vault-sync via git.
- **V0.4:** synthetic data + LoRA finetuning (si Anthropic abre finetuning para Opus/Sonnet).

---

## Decisiones pendientes (antes de writing-plans)

1. **Nombre final** (`compound` vs alternativa).
2. **Vault global por default** (`~/vault/`) vs **project-local** (`./vault/`) — spec sugiere global, confirmar.
3. **¿Quién mantiene el repo?** cuenta GitHub personal o cuenta nueva para el tool.
4. **Cuenta X para el lanzamiento** — mismo username que GitHub o distinto.
5. **Licencia**: MIT confirmado o preferencia distinta (Apache 2.0, BSD-3).

---

## Referencias

- Karpathy thread original: https://x.com/karpathy/status/2039805659525644595 (2026-04-02).
- Karpathy gist (citado por user): https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
- claude-mem (competidor principal): https://github.com/thedotmack/claude-mem
- Nuestro vault existente: `C:/Users/diper/Desktop/Claude/vault/` (referencia implementación).
- Investigación de competidores: ver transcripción de research agents 2026-04-23.
