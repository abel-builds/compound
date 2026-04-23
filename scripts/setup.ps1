# compound — Windows PowerShell setup
# Equivalent of scripts/setup.sh for Windows users.

$ErrorActionPreference = "Stop"

function Say($msg) { Write-Host "[setup] $msg" -ForegroundColor Yellow }
function Ok($msg)  { Write-Host "[ok] $msg" -ForegroundColor Green }
function Bad($msg) { Write-Host "[missing] $msg" -ForegroundColor Red }

Say "Checking dependencies..."

if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Ok "Node found: $nodeVersion"
} else {
    Bad "Node.js not found. Install from https://nodejs.org (v18+)."
    exit 1
}

if (Get-Command claude -ErrorAction SilentlyContinue) {
    try {
        $claudeVersion = (claude --version 2>&1 | Select-Object -First 1)
        Ok "Claude Code found: $claudeVersion"
    } catch {
        Say "Claude Code present but --version failed. Proceeding."
    }
} else {
    Say "Claude Code CLI not detected. Install from https://claude.com/claude-code before using this repo."
}

Say "Seeding vault structure..."

$dirs = @("vault\raw", "vault\wiki\knowledge", "vault\output", "vault\templates")
foreach ($d in $dirs) {
    New-Item -ItemType Directory -Force -Path $d | Out-Null
}

$repoDir = Split-Path $PSScriptRoot -Parent

function Seed-FromRepo($srcRel, $destRel) {
    $src = Join-Path $repoDir $srcRel
    $dest = $destRel
    if ((Test-Path $src) -and -not (Test-Path $dest)) {
        $destDir = Split-Path $dest -Parent
        if ($destDir -and -not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Force -Path $destDir | Out-Null
        }
        Copy-Item $src $dest
        Ok "Seeded $dest"
    }
}

Seed-FromRepo "vault\schema.md"                       "vault\schema.md"
Seed-FromRepo "vault\log.md"                          "vault\log.md"
Seed-FromRepo "vault\wiki\_master-index.md"           "vault\wiki\_master-index.md"
Seed-FromRepo "vault\wiki\knowledge\_index.md"        "vault\wiki\knowledge\_index.md"
Seed-FromRepo "vault\wiki\knowledge\welcome.md"       "vault\wiki\knowledge\welcome.md"
Seed-FromRepo "vault\templates\article.md"            "vault\templates\article.md"
Seed-FromRepo "vault\templates\category-index.md"     "vault\templates\category-index.md"

# .gitkeep for empty folders
New-Item -ItemType File -Force -Path "vault\raw\.gitkeep" | Out-Null
New-Item -ItemType File -Force -Path "vault\output\.gitkeep" | Out-Null

Say "Testing SessionStart hook..."
try {
    node herramientas\vault-session-start.mjs | Out-Null
    Ok "SessionStart hook runs cleanly"
} catch {
    Bad "SessionStart hook failed — check Node version"
}

Say "Testing SessionEnd hook..."
try {
    node herramientas\vault-check.mjs | Out-Null
    Ok "SessionEnd hook runs cleanly"
} catch {
    Bad "SessionEnd hook failed — check Node version"
}

Write-Host ""
Ok "Setup complete."
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Open this folder in Claude Code."
Write-Host "  2. The SessionStart hook will surface any files in vault\raw\."
Write-Host "  3. Drop your first source into vault\raw\ and start a session."
Write-Host "  4. Optional: install Obsidian + Web Clipper for web content."
Write-Host "     https://obsidian.md/clipper"
