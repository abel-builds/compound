#!/usr/bin/env bash
# compound — setup script
# Verifies dependencies, seeds the vault, and confirms readiness.

set -e

YELLOW="\033[1;33m"
GREEN="\033[1;32m"
RED="\033[1;31m"
NC="\033[0m"

say() { printf "${YELLOW}[setup]${NC} %s\n" "$1"; }
ok()  { printf "${GREEN}[ok]${NC} %s\n" "$1"; }
bad() { printf "${RED}[missing]${NC} %s\n" "$1"; }

say "Checking dependencies..."

if command -v node >/dev/null 2>&1; then
  NODE_V=$(node --version)
  ok "Node found: $NODE_V"
else
  bad "Node.js not found. Install from https://nodejs.org (v18+)."
  exit 1
fi

if command -v claude >/dev/null 2>&1; then
  ok "Claude Code found: $(claude --version 2>&1 | head -1)"
else
  say "Claude Code CLI not detected. Install from https://claude.com/claude-code before using this repo."
fi

say "Seeding vault structure..."

mkdir -p vault/raw vault/wiki vault/output vault/templates

# Seed master index if missing
if [ ! -f vault/wiki/_master-index.md ]; then
  cat > vault/wiki/_master-index.md <<'EOF'
# Wiki — Master Index

**Last updated:** (auto-maintained by the LLM)
**Total articles:** 0
**Total categories:** 0

> This file is maintained automatically. Do not edit manually.

---

## Categories

(Empty — categories are created when the first article in a topic is compiled.)

## Recent articles

(Empty.)

## Active projects

(None.)
EOF
  ok "Seeded vault/wiki/_master-index.md"
fi

# Seed .gitkeep files so empty folders survive git
touch vault/raw/.gitkeep vault/wiki/.gitkeep vault/output/.gitkeep vault/templates/.gitkeep

# Make hook scripts executable
chmod +x herramientas/*.mjs 2>/dev/null || true

say "Testing SessionStart hook..."
if node herramientas/vault-session-start.mjs >/dev/null 2>&1; then
  ok "SessionStart hook runs cleanly"
else
  bad "SessionStart hook failed — check Node version"
fi

say "Testing SessionEnd hook..."
if node herramientas/vault-check.mjs >/dev/null 2>&1; then
  ok "SessionEnd hook runs cleanly"
else
  bad "SessionEnd hook failed — check Node version"
fi

echo
ok "Setup complete."
echo
echo "Next steps:"
echo "  1. Open this folder in Claude Code."
echo "  2. The SessionStart hook will surface any files in vault/raw/."
echo "  3. Drop your first source (article, tweet, note) into vault/raw/ and start a session."
echo "  4. Optional: install Obsidian + Web Clipper to speed up ingesting web content."
echo "     https://obsidian.md/clipper"
