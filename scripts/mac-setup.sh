#!/usr/bin/env bash
#
# One-shot bootstrap for developing quantum-guides on a Mac.
#
# Usage (from any Terminal window):
#
#   curl -fsSL https://raw.githubusercontent.com/qu4ntum88/quantum-guides/main/scripts/mac-setup.sh | bash
#
# ...or, if you have already cloned the repo:
#
#   bash scripts/mac-setup.sh
#
# Installs (skipping anything already present): Xcode Command Line Tools,
# Homebrew, Node 22 LTS, GitHub CLI. Then clones the repo, runs npm install,
# and stubs out .env.local from .env.example.
#
# It does NOT put any secrets on disk — you fill in .env.local yourself at the
# end (see docs/MAC-SETUP.md).
#
# Safe to re-run: every step checks before it acts.

set -euo pipefail

REPO="qu4ntum88/quantum-guides"
TARGET_DIR="${1:-${QGG_DIR:-$HOME/Developer/quantum-guides}}"
MIN_NODE_MAJOR=20
MIN_NODE_MINOR=9

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
info() { printf '  \033[2m%s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$1"; }
die()  { printf '\n\033[31m✗ %s\033[0m\n' "$1" >&2; exit 1; }

confirm() {
  # Reading from /dev/tty so this still works under `curl … | bash`.
  local reply
  printf '  %s [y/N] ' "$1"
  read -r reply < /dev/tty || reply=""
  [[ "$reply" =~ ^[Yy]$ ]]
}

[[ "$(uname -s)" == "Darwin" ]] || die "This script is for macOS. On Linux/Windows, install Node 20+ and git yourself, then run: npm install"

bold "quantum-guides — Mac setup"
echo

# ---------------------------------------------------------------- Xcode CLT --
bold "1. Xcode Command Line Tools (git, compilers)"
if xcode-select -p >/dev/null 2>&1; then
  ok "already installed"
else
  info "opening the Apple installer dialog…"
  xcode-select --install || true
  echo
  warn "Finish the install in the popup window, then re-run this script."
  exit 0
fi
echo

# ----------------------------------------------------------------- Homebrew --
bold "2. Homebrew"
if command -v brew >/dev/null 2>&1; then
  ok "already installed ($(brew --version | head -1))"
else
  # Load it if it is installed but not yet on PATH (fresh shell, no profile).
  for candidate in /opt/homebrew/bin/brew /usr/local/bin/brew; do
    if [[ -x "$candidate" ]]; then
      eval "$("$candidate" shellenv)"
      ok "found at $candidate"
      break
    fi
  done
fi

if ! command -v brew >/dev/null 2>&1; then
  warn "Homebrew is not installed. It is the standard macOS package manager."
  info "Installer: https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh"
  if confirm "Run the official Homebrew installer now?"; then
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    for candidate in /opt/homebrew/bin/brew /usr/local/bin/brew; do
      [[ -x "$candidate" ]] && eval "$("$candidate" shellenv)" && break
    done
  else
    die "Homebrew declined. Install Node 20+ and the GitHub CLI another way, then re-run."
  fi
fi
command -v brew >/dev/null 2>&1 || die "Homebrew still not on PATH — open a new Terminal tab and re-run."
echo

# --------------------------------------------------------------------- Node --
bold "3. Node.js (need >= ${MIN_NODE_MAJOR}.${MIN_NODE_MINOR} for Next.js 16)"
node_ok() {
  command -v node >/dev/null 2>&1 || return 1
  local v major minor
  v="$(node -v)"; v="${v#v}"
  major="${v%%.*}"
  minor="${v#*.}"; minor="${minor%%.*}"
  (( major > MIN_NODE_MAJOR )) && return 0
  (( major == MIN_NODE_MAJOR && minor >= MIN_NODE_MINOR )) && return 0
  return 1
}

if node_ok; then
  ok "$(node -v) is new enough"
else
  if command -v node >/dev/null 2>&1; then
    warn "$(node -v) is too old — installing Node 22 LTS alongside it"
  else
    info "installing Node 22 LTS…"
  fi
  brew install node@22

  # node@22 is keg-only, so Homebrew does not symlink it into the main prefix.
  NODE_PREFIX="$(brew --prefix node@22)"
  export PATH="$NODE_PREFIX/bin:$PATH"

  # Persist it for future shells.
  case "${SHELL:-}" in
    */zsh) PROFILE="$HOME/.zprofile" ;;
    */bash) PROFILE="$HOME/.bash_profile" ;;
    *) PROFILE="" ;;
  esac
  if [[ -n "$PROFILE" ]]; then
    LINE="export PATH=\"$NODE_PREFIX/bin:\$PATH\""
    if ! grep -qF "$NODE_PREFIX/bin" "$PROFILE" 2>/dev/null; then
      printf '\n# Node 22 (quantum-guides)\n%s\n' "$LINE" >> "$PROFILE"
      ok "added Node 22 to PATH in $PROFILE"
    fi
  else
    warn "Unknown shell — add this to your shell profile yourself:"
    info "export PATH=\"$NODE_PREFIX/bin:\$PATH\""
  fi
  node_ok || die "Node still too old after install — open a new Terminal tab and re-run."
  ok "$(node -v) / npm $(npm -v)"
fi
echo

# --------------------------------------------------------------- GitHub CLI --
bold "4. GitHub CLI (handles git auth, no tokens to manage)"
if command -v gh >/dev/null 2>&1; then
  ok "already installed"
else
  info "installing gh…"
  brew install gh
fi

if gh auth status >/dev/null 2>&1; then
  ok "already signed in to GitHub"
else
  warn "Not signed in. A browser window will open — choose GitHub.com, then HTTPS."
  gh auth login < /dev/tty
fi
gh auth setup-git >/dev/null 2>&1 || true
echo

# ------------------------------------------------------------------ The repo --
bold "5. Repository"
if [[ -d "$TARGET_DIR/.git" ]]; then
  ok "already cloned at $TARGET_DIR"
  info "fetching latest main…"
  git -C "$TARGET_DIR" fetch origin main --quiet || warn "fetch failed — check your network"
else
  mkdir -p "$(dirname "$TARGET_DIR")"
  info "cloning into $TARGET_DIR…"
  gh repo clone "$REPO" "$TARGET_DIR"
fi
cd "$TARGET_DIR"
echo

# ------------------------------------------------------------- Dependencies --
bold "6. Dependencies"
info "running npm install (this takes a minute)…"
npm install
ok "installed"
echo

# --------------------------------------------------------------- Env stubbing --
bold "7. Environment file"
if [[ -f .env.local ]]; then
  ok ".env.local already exists — leaving it alone"
elif [[ -f .env.example ]]; then
  cp .env.example .env.local
  ok "created .env.local from .env.example"
  warn "It is a template — the site will not fully run until you fill in real values."
else
  warn "No .env.example found; create .env.local by hand (see docs/MAC-SETUP.md)."
fi
echo

# -------------------------------------------------------------------- Done ---
bold "Done."
cat <<EOF

  Repo:  $TARGET_DIR
  Node:  $(node -v)

  Next steps:

    1. Fill in $TARGET_DIR/.env.local with the real keys.
       Fastest route — pull them straight from Vercel:

         cd "$TARGET_DIR"
         npx vercel login
         npx vercel link          # pick the quantum-guides project
         npx vercel env pull .env.local

       (env pull only downloads variables; it does not deploy anything.)

       Or copy .env.local off your PC and move it across privately —
       AirDrop or a password manager, never email or chat.

    2. Start the dev server:

         cd "$TARGET_DIR"
         npm run dev              # http://localhost:3000

  Full notes: docs/MAC-SETUP.md

EOF
