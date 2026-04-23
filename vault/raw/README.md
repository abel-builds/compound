# raw/ — Your inbox

Drop raw sources here: articles, tweets, papers, notes, anything you want Claude to process.

## How to drop sources

- **Manual:** paste `.md` files or folders.
- **Web content:** use [Obsidian Web Clipper](https://obsidian.md/clipper) configured to save into `vault/raw/clips/`.
- **Bulk research:** save folders like `raw/research-2026-04-17/` with multiple files.

## What happens next

On the next Claude Code session:
1. The `SessionStart` hook detects files here.
2. Claude reads them, extracts insights, and compiles them into `vault/wiki/<category>/`.
3. Compiled raw items move to `vault/raw/_archive/<name>/` (preserved but out of the pending bucket).

## Rules

- **Files starting with `_`** (like `_archive/`) are excluded from the "pending" scan. Don't prefix your own files with `_`.
- Use folders to group related sources (e.g., `raw/topic-X/file1.md`, `raw/topic-X/file2.md`).
- This folder can contain subfolders nested arbitrarily.
