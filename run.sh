#!/usr/bin/env bash
set -euo pipefail

# ── Penumbra run.sh ──────────────────────────────────────────────────────────
# One-command setup & launch for Penumbra.
# Usage:
#   ./run.sh              Start the server (clean build + start)
#   ./run.sh --dev        Start in dev/watch mode (Vite HMR)
#   ./run.sh --install    Only install dependencies and migrate DB (no start)
#   ./run.sh --help       Show this help
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
RESET='\033[0m'

info()  { printf "${CYAN}▸${RESET} %s\n" "$*"; }
ok()    { printf "${GREEN}✓${RESET} %s\n" "$*"; }
warn()  { printf "${YELLOW}!${RESET} %s\n" "$*"; }
fail()  { printf "${RED}✗${RESET} %s\n" "$*" >&2; exit 1; }

# ── Args ─────────────────────────────────────────────────────────────────────
MODE="start"

for arg in "$@"; do
  case "$arg" in
    --dev)      MODE="dev" ;;
    --install)  MODE="install" ;;
    --help|-h)
      sed -n '4,10p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) fail "Unknown option: $arg" ;;
  esac
done

# ── Shared state ─────────────────────────────────────────────────────────────
PENUMBRA_PORT=${PENUMBRA_PORT:-3000}
PENUMBRA_URL="localhost:${PENUMBRA_PORT}"
GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "-")
SERVER_PID=""
SHUTTING_DOWN=false

# ── Sticky footer ───────────────────────────────────────────────────────────
FOOTER_LINES=1
CURRENT_FOOTER="starting"
STARTUP_PHASE="initializing..."
SHUTDOWN_PHASE="stopping..."

# stty size queries stdin (redirected to /dev/tty), not stdout.
# tput lines uses ioctl on stdout which fails inside $() subshells.
_term_rows() {
  local s
  s=$(stty size </dev/tty 2>/dev/null) || s="24 80"
  echo "${s%% *}"
}

_render_bar() {
  local cols s
  s=$(stty size </dev/tty 2>/dev/null) || s="24 80"
  cols=${s##* }

  local right_keys=" ⏎  rebuild · c  copy URL · o  open in browser · ^C  quit "
  local right_retry=" ⏎ Enter  retry · ^C  quit "
  local right_quit=" ^C  quit "
  local rpos

  case "$1" in
    starting)
      rpos=$((cols - ${#right_quit} + 1))
      printf '\033[1;30;46m\033[K\033[1G'
      printf ' ⟳ Starting · %s · %s' "$GIT_BRANCH" "$STARTUP_PHASE"
      printf '\033[%dG\033[7m ^C \033[27m quit \033[0m' "$rpos"
      ;;
    running)
      rpos=$((cols - ${#right_keys} + 1))
      printf '\033[1;30;42m\033[K\033[1G'
      printf ' ✓ Running · %s · %s · PID %s' "$PENUMBRA_URL" "$GIT_BRANCH" "${SERVER_PID:-?}"
      printf '\033[%dG\033[7m ⏎ \033[27m rebuild · \033[7m c \033[27m copy URL · \033[7m o \033[27m open in browser · \033[7m ^C \033[27m quit \033[0m' "$rpos"
      ;;
    reloading)
      printf '\033[1;30;43m ⟳  Reloading · %s · pulling, installing, building... \033[K\033[0m' "$GIT_BRANCH"
      ;;
    crashed)
      rpos=$((cols - ${#right_keys} + 1))
      printf '\033[1;97;41m\033[K\033[1G'
      printf ' ✗ Server crashed · %s · PID %s' "$PENUMBRA_URL" "${SERVER_PID:-?}"
      printf '\033[%dG\033[7m ⏎ \033[27m rebuild · \033[7m c \033[27m copy URL · \033[7m o \033[27m open in browser · \033[7m ^C \033[27m quit \033[0m' "$rpos"
      ;;
    build_failed)
      rpos=$((cols - ${#right_retry} + 1))
      printf '\033[1;97;41m\033[K\033[1G'
      printf ' ✗ Build failed'
      printf '\033[%dG\033[7m ⏎ Enter \033[27m retry · \033[7m ^C \033[27m quit \033[0m' "$rpos"
      ;;
    shutting_down)
      printf '\033[1;97;45m ⏻  Shutting down · %s \033[K\033[0m' "${SHUTDOWN_PHASE:-stopping...}"
      ;;
  esac
}

activate_footer() {
  local state="${1:-running}" rows
  CURRENT_FOOTER="$state"
  rows=$(_term_rows)
  printf '\033[r\033[2J\033[H'
  printf '\033[1;%dr' "$((rows - FOOTER_LINES))"
  printf '\033[%d;1H\033[2K' "$rows"
  _render_bar "$state"
  printf '\033[1;1H'
}

resume_footer() {
  local state="${1:-running}" rows
  CURRENT_FOOTER="$state"
  rows=$(_term_rows)
  printf '\033[1;%dr' "$((rows - FOOTER_LINES))"
  printf '\033[%d;1H\033[2K' "$rows"
  _render_bar "$state"
  printf '\033[%d;1H' "$((rows - FOOTER_LINES))"
}

redraw_footer() {
  local state="${1:-$CURRENT_FOOTER}" rows
  CURRENT_FOOTER="$state"
  rows=$(_term_rows)
  printf '\0337'
  printf '\033[%d;1H\033[2K' "$rows"
  _render_bar "$state"
  printf '\0338'
}

deactivate_footer() {
  printf '\033[r'
}

# ── Phase animation ──────────────────────────────────────────────────────
ANIM_PID=""

start_phase_animation() {
  local label="$1" phase="$2"
  stop_phase_animation
  local color
  case "$label" in
    Starting) color='\033[1;30;46m' ;;
    Reloading) color='\033[1;30;43m' ;;
    *) color='\033[1;30;43m' ;;
  esac
  (
    local i=0
    local frames=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
    while true; do
      local rows
      rows=$(_term_rows)
      printf '\0337\033[%d;1H\033[2K' "$rows"
      printf "${color} %s  %s · %s · %s \033[K\033[0m" \
        "${frames[$((i % 10))]}" "$label" "$GIT_BRANCH" "$phase"
      printf '\0338'
      sleep 0.12
      ((i++))
    done
  ) &
  ANIM_PID=$!
}

stop_phase_animation() {
  if [[ -n "${ANIM_PID:-}" ]] && kill -0 "$ANIM_PID" 2>/dev/null; then
    kill "$ANIM_PID" 2>/dev/null
    wait "$ANIM_PID" 2>/dev/null || true
  fi
  ANIM_PID=""
}

reset_scroll_region() {
  printf '\033[r'
  local rows
  rows=$(_term_rows)
  printf '\033[%d;1H\n' "$rows"
}

# ── Transient footer flash ──────────────────────────────────────────────────
flash_footer() {
  local msg="$1" rows
  rows=$(_term_rows)
  printf '\0337'
  printf '\033[%d;1H\033[2K' "$rows"
  printf '\033[1;30;46m %s \033[K\033[0m' "$msg"
  printf '\0338'
  sleep 0.9
  redraw_footer "$CURRENT_FOOTER"
}

copy_url() {
  local url="http://${PENUMBRA_URL}"
  if command -v pbcopy &>/dev/null; then
    printf '%s' "$url" | pbcopy
    flash_footer "📋 Copied $url to clipboard"
  elif command -v wl-copy &>/dev/null; then
    printf '%s' "$url" | wl-copy
    flash_footer "📋 Copied $url to clipboard"
  elif command -v xclip &>/dev/null; then
    printf '%s' "$url" | xclip -selection clipboard
    flash_footer "📋 Copied $url to clipboard"
  else
    flash_footer "✗ No clipboard tool (install pbcopy / xclip / wl-copy)"
  fi
}

open_url() {
  local url="http://${PENUMBRA_URL}"
  if command -v open &>/dev/null; then
    open "$url" 2>/dev/null
    flash_footer "🌐 Opening $url"
  elif command -v xdg-open &>/dev/null; then
    xdg-open "$url" &>/dev/null &
    flash_footer "🌐 Opening $url"
  else
    flash_footer "✗ No browser launcher (install xdg-open)"
  fi
}

update_startup_phase() {
  STARTUP_PHASE="$1"
  if [[ "${FOOTER_ACTIVE:-false}" == true ]]; then
    redraw_footer "starting"
  fi
}

# ── Pull latest ──────────────────────────────────────────────────────────────
pull_latest() {
  if ! git rev-parse --is-inside-work-tree &>/dev/null; then
    return
  fi
  if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
    warn "Worktree has uncommitted changes, skipping git pull/rebase"
    return
  fi
  local branch
  branch=$(git branch --show-current)
  if [[ "$branch" == "main" || "$branch" == "master" ]]; then
    git pull origin "$branch" --ff-only 2>/dev/null || true
  else
    git fetch origin master 2>/dev/null || git fetch origin main 2>/dev/null || true
    git rebase origin/master 2>/dev/null || git rebase origin/main 2>/dev/null || {
      warn "Rebase failed, aborting..."
      git rebase --abort 2>/dev/null || true
    }
  fi
}

# ── Prerequisites ────────────────────────────────────────────────────────────
check_command() {
  if ! command -v "$1" &>/dev/null; then
    fail "$1 is not installed. $2"
  fi
}

# ── Install dependencies ─────────────────────────────────────────────────────
install_deps() {
  if [[ ! -d "node_modules" ]] || [[ "pnpm-lock.yaml" -nt "node_modules/.pnpm/lock.yaml" ]]; then
    info "Installing dependencies..."
    pnpm install --frozen-lockfile 2>/dev/null || pnpm install
    ok "Dependencies installed"
  else
    ok "Dependencies up to date"
  fi
}

# ── Database migration ───────────────────────────────────────────────────────
migrate_db() {
  info "Applying database migrations..."
  pnpm exec drizzle-kit migrate >/dev/null
  ok "Database migrated"
}

# ── Activate footer for startup ─────────────────────────────────────────────
FOOTER_ACTIVE=false
if [[ "$MODE" != "install" && "$MODE" != "dev" ]]; then
  activate_footer "starting"
  FOOTER_ACTIVE=true
fi

# ── Pull latest ──────────────────────────────────────────────────────────────
update_startup_phase "pulling latest..."
pull_latest
GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "-")

# ── Check prerequisites ─────────────────────────────────────────────────────
update_startup_phase "checking prerequisites..."

check_command "node" "Install Node.js >= 20: https://nodejs.org"

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [[ "$NODE_VERSION" -lt 20 ]]; then
  fail "Node.js >= 20 required (found v$(node -v | sed 's/v//'))"
fi
ok "Node.js $(node -v)"

check_command "pnpm" "Install pnpm: corepack enable && corepack prepare pnpm@latest --activate"
ok "pnpm $(pnpm -v)"

check_command "git" "Install git: https://git-scm.com"
ok "git $(git --version | awk '{print $3}')"

# ── Install dependencies ─────────────────────────────────────────────────────
update_startup_phase "installing dependencies..."
install_deps

# ── DB migrate ───────────────────────────────────────────────────────────────
update_startup_phase "migrating database..."
migrate_db

if [[ "$MODE" == "install" ]]; then
  ok "Install complete"
  exit 0
fi

# ── Dev mode: hand off to Vite HMR ───────────────────────────────────────────
if [[ "$MODE" == "dev" ]]; then
  info "Starting in dev mode (Vite HMR)..."
  export PORT="$PENUMBRA_PORT"
  exec pnpm dev
fi

# ── Build ────────────────────────────────────────────────────────────────────
update_startup_phase "building..."
info "Cleaning previous build..."
rm -rf .output .tanstack
info "Building..."
pnpm build
ok "Build complete"

# ── Server lifecycle ─────────────────────────────────────────────────────────
cleanup() {
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill -9 -- -"$SERVER_PID" 2>/dev/null || kill -9 "$SERVER_PID" 2>/dev/null
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  SERVER_PID=""
}

on_exit() {
  SHUTTING_DOWN=true
  stop_phase_animation

  SHUTDOWN_PHASE="stopping..."
  redraw_footer "shutting_down"

  if [[ -n "${MONITOR_PID:-}" ]] && kill -0 "$MONITOR_PID" 2>/dev/null; then
    SHUTDOWN_PHASE="stopping crash monitor..."
    redraw_footer "shutting_down"
    kill "$MONITOR_PID" 2>/dev/null; wait "$MONITOR_PID" 2>/dev/null || true
  fi

  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    SHUTDOWN_PHASE="stopping server (PID ${SERVER_PID})..."
    redraw_footer "shutting_down"
  fi
  cleanup

  reset_scroll_region
}

trap on_exit EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

start_server() {
  info "Starting Penumbra server..."
  echo ""
  export PORT="$PENUMBRA_PORT"
  if command -v setsid &>/dev/null; then
    setsid node .output/server/index.mjs &
  else
    # macOS fallback: use perl to create a new session
    perl -e 'use POSIX "setsid"; setsid(); exec @ARGV' \
      node .output/server/index.mjs &
  fi
  SERVER_PID=$!
}

update_startup_phase "starting server..."

activate_footer "running"
start_server
redraw_footer "running"

# ── Server crash monitor ─────────────────────────────────────────────────────
monitor_server() {
  while true; do
    sleep 2
    if [[ "$SHUTTING_DOWN" == true ]]; then
      return
    fi
    if [[ -n "${SERVER_PID:-}" ]] && ! kill -0 "$SERVER_PID" 2>/dev/null; then
      wait "$SERVER_PID" 2>/dev/null
      local exit_code=$?
      local crash_log="${HOME}/.penumbra/crash.log"
      mkdir -p "${HOME}/.penumbra"
      printf '[%s] Server (PID %s) exited with code %s\n' \
        "$(date '+%Y-%m-%d %H:%M:%S')" "$SERVER_PID" "$exit_code" >> "$crash_log"
      warn "Server crashed (exit code $exit_code) — see $crash_log"
      redraw_footer "crashed"
      SERVER_PID=""
      return
    fi
  done
}

monitor_server &
MONITOR_PID=$!

# ── Reload loop ──────────────────────────────────────────────────────────────
while true; do
  IFS= read -r -s -n 1 key </dev/tty || break

  if [[ "$SHUTTING_DOWN" == true ]]; then
    break
  fi

  case "$key" in
    "")
      ;;
    c|C)
      copy_url
      continue
      ;;
    o|O)
      open_url
      continue
      ;;
    *)
      continue
      ;;
  esac

  start_phase_animation "Reloading" "stopping server..."

  kill "$MONITOR_PID" 2>/dev/null; wait "$MONITOR_PID" 2>/dev/null || true
  cleanup

  start_phase_animation "Reloading" "pulling..."
  pull_latest
  GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "-")

  start_phase_animation "Reloading" "installing..."
  install_deps

  start_phase_animation "Reloading" "migrating database..."
  migrate_db

  start_phase_animation "Reloading" "building..."
  info "Cleaning previous build..."
  rm -rf .output .tanstack
  info "Building..."
  if pnpm build; then
    ok "Build complete"
  else
    stop_phase_animation
    resume_footer "build_failed"
    monitor_server &
    MONITOR_PID=$!
    continue
  fi

  stop_phase_animation
  activate_footer "running"
  start_server
  redraw_footer "running"

  monitor_server &
  MONITOR_PID=$!
done
