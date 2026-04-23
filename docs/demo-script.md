# Demo GIF script

The current `docs/assets/demo.gif` is generated **programmatically** by `scripts/build-demo-gif.mjs` — no recording needed. Regenerate with:

```bash
npm install --no-save @napi-rs/canvas gif-encoder-2
node scripts/build-demo-gif.mjs
```

Output: `docs/assets/demo.gif`, 800×500, 18 fps, ~0.3 MB, ~10s loop.

The rest of this document describes how to record a REAL terminal-captured version if you prefer to replace the synthetic one (v0.1.1+).

---

Recipe to record the 30-second `README` demo. Target: under 5 MB, 800×500, 15 fps.

## Setup

1. Fresh terminal + fresh `compound/` clone in a clean directory.
2. Use a dark theme, 14pt font, reasonable contrast. Solarized Dark or One Dark work well.
3. Have an example raw source ready: `raw-sample/karpathy-llm-wiki.md` (copy any public Karpathy tweet/thread, ~500 words).
4. Pre-position a terminal window 800×500. Nothing else on screen.

## Recording tools

- macOS / Linux: `asciinema rec` → convert with `agg` (`asciinema/agg`) to GIF.
- Windows: [ScreenToGif](https://www.screentogif.com/).
- Cross-platform: [Kap](https://getkap.co/) (macOS), [peek](https://github.com/phw/peek) (Linux).

## Beat-by-beat (target ~30s)

| Time | Action | Narration (on-screen text / not voice) |
|------|--------|----------------------------------------|
| 0:00 | `git clone … && cd compound` | "Drop-in knowledge base for Claude Code" |
| 0:04 | `bash scripts/setup.sh` | "One command install" |
| 0:08 | `cp ../raw-sample/karpathy-llm-wiki.md vault/raw/` | "Drop a source" |
| 0:12 | `claude` (start Claude Code session) | "Open Claude Code" |
| 0:16 | SessionStart hook fires, Claude auto-compiles silently | Visible: `[vault-autosync: 1 compiled]` |
| 0:20 | `/vault-status` | Shows 2 articles, 1 category |
| 0:24 | Ask: "summarize what you just learned" | Claude reads the new article and answers |
| 0:28 | End on `/vault-status` again showing clean state | "Your knowledge, compounded." |

## Post-production

- Trim dead frames. Keep tight.
- Add a 1-frame title card at the start: "compound — a self-compounding knowledge base for Claude Code".
- Export as GIF. Optimize with `gifsicle -O3`.
- Drop file at `docs/assets/demo.gif`.
- Update README's placeholder `<em>Demo GIF coming in v0.1.1…</em>` with:
  ```html
  <img src="docs/assets/demo.gif" alt="compound 30-second demo" width="800">
  ```

## Why it's a stub for now

v0.1.0 ships the engine; v0.1.1 ships the GIF. The README is explicit about this so users aren't blindsided by a missing image.
