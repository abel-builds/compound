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

# Seed vault files from repo templates if missing
seed_from_repo() {
  local src="$1"
  local dest="$2"
  if [ ! -f "$dest" ] && [ -f "$src" ]; then
    mkdir -p "$(dirname "$dest")"
    cp "$src" "$dest"
    ok "Seeded $dest"
  fi
}

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

seed_from_repo "$REPO_DIR/vault/schema.md" "vault/schema.md"
seed_from_repo "$REPO_DIR/vault/log.md" "vault/log.md"
seed_from_repo "$REPO_DIR/vault/wiki/_master-index.md" "vault/wiki/_master-index.md"
seed_from_repo "$REPO_DIR/vault/wiki/knowledge/_index.md" "vault/wiki/knowledge/_index.md"
seed_from_repo "$REPO_DIR/vault/wiki/knowledge/welcome.md" "vault/wiki/knowledge/welcome.md"
seed_from_repo "$REPO_DIR/vault/templates/article.md" "vault/templates/article.md"
seed_from_repo "$REPO_DIR/vault/templates/category-index.md" "vault/templates/category-index.md"

# Seed .gitkeep files so empty folders survive git
touch vault/raw/.gitkeep vault/output/.gitkeep

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
