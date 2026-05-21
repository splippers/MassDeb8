#!/usr/bin/env bash
# Populate the SIC arena with all available backends.
# Personas are drawn randomly from the pool on every run — no backend is
# pinned to any character. Confucius is excluded (he chairs).
#
# Active backends (each skipped gracefully if not available):
#   - OpenAI        — key in API.md line 1 or OPENAI_API_KEY
#   - Gemini        — key in API.md line 2 or GEMINI_API_KEY
#   - Anthropic     — ANTHROPIC_API_KEY env var
#   - OpenCode      — 'opencode' binary in PATH (needs `opencode serve`)
#   - Jonotron      — LAN/Eddie harness
#   - Monyatron     — Ollama on Marvin
#
# Usage:
#   ARENA_HOST=eddie ./scripts/populate-arena.sh
#   ./scripts/populate-arena.sh --stop
#
# Env vars:
#   ARENA_HOST / ARENA_PORT
#   OPENAI_API_KEY, OPENAI_MODEL   (default: gpt-4o)
#   GEMINI_API_KEY, GEMINI_MODEL   (default: gemini-2.0-flash)
#   ANTHROPIC_API_KEY, ANTHROPIC_MODEL (default: claude-sonnet-4-6)
#   OPENCODE_BIN, OPENCODE_ATTACH  (default: opencode, http://127.0.0.1:4096)
#   JONOTRON_URL                   (default: http://eddie:8011)
#   OLLAMA_BASE, OLLAMA_MODEL      (default: http://localhost:11434, llama3)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PID_FILE="$ROOT/.arena-pids"
LOG_DIR="$ROOT/logs"

# ── stop mode ─────────────────────────────────────────────────────────────────
if [[ "${1:-}" == "--stop" ]]; then
  if [[ ! -f "$PID_FILE" ]]; then
    echo "No .arena-pids file found — nothing to stop."
    exit 0
  fi
  echo "Stopping arena nodes..."
  while IFS=: read -r name pid; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" && echo "  stopped $name (pid $pid)"
    else
      echo "  $name (pid $pid) already gone"
    fi
  done < "$PID_FILE"
  rm -f "$PID_FILE"
  echo "Done."
  exit 0
fi

# ── sanity checks ─────────────────────────────────────────────────────────────
if [[ ! -x "$ROOT/.venv/bin/python" ]]; then
  echo "ERROR: Missing venv. Run:" >&2
  echo "  python3 -m venv .venv && uv pip install -r requirements.txt" >&2
  exit 1
fi

mkdir -p "$LOG_DIR"
> "$PID_FILE"

ARENA_HOST="${ARENA_HOST:-127.0.0.1}"
ARENA_PORT="${ARENA_PORT:-8787}"
WS_URL="ws://${ARENA_HOST}:${ARENA_PORT}/ws"

_api_line() { sed -n "${1}p" "$ROOT/API.md" 2>/dev/null | tr -d '[:space:]' || true; }
OPENAI_API_KEY="${OPENAI_API_KEY:-$(_api_line 1)}"
GEMINI_API_KEY="${GEMINI_API_KEY:-$(_api_line 2)}"

JONOTRON_URL="${JONOTRON_URL:-http://eddie:8011}"
OLLAMA_BASE="${OLLAMA_BASE:-http://localhost:11434}"
OLLAMA_MODEL="${OLLAMA_MODEL:-llama3}"
OPENCODE_BIN="${OPENCODE_BIN:-opencode}"
OPENCODE_ATTACH="${OPENCODE_ATTACH:-http://127.0.0.1:4096}"

# ── persona pool: all personas except confucius (chair) ───────────────────────
mapfile -t POOL < <(
  ls "$ROOT/personas/"*.yaml \
  | xargs -I{} basename {} .yaml \
  | grep -v '^confucius$' \
  | shuf
)
_pool_idx=0
# Sets $p and $n in the caller's scope — must NOT be called via $()
draw_persona() {
  if (( _pool_idx >= ${#POOL[@]} )); then
    echo "ERROR: ran out of personas — add more to personas/" >&2
    exit 1
  fi
  p="${POOL[$_pool_idx]}"
  n="$(grep '^name:' "$ROOT/personas/${p}.yaml" 2>/dev/null | head -1 | sed 's/name: *//; s/"//g; s/'"'"'//g')"
  (( _pool_idx++ )) || true
}

echo "═══════════════════════════════════════════"
echo " SIC Arena — Populating all nodes"
echo " Arena: $WS_URL"
echo "═══════════════════════════════════════════"

launch() {
  local label="$1"; shift
  local log="$LOG_DIR/${label}.log"
  "$@" >"$log" 2>&1 &
  local pid=$!
  echo "$label:$pid" >> "$PID_FILE"
  echo "  [$label] pid=$pid → logs/$label.log"
}

# ── OpenAI ────────────────────────────────────────────────────────────────────
if [[ -n "$OPENAI_API_KEY" ]]; then
  draw_persona
  echo "  [openai]     → $n ($p)"
  launch "openai" \
    "$ROOT/.venv/bin/python" -m node.node \
      --arena "$WS_URL" --name "$n" --persona "$p" \
      --backend openai --model "${OPENAI_MODEL:-gpt-4o}" \
      --api-key "$OPENAI_API_KEY"
else
  echo "  [openai]     SKIPPED — no key (API.md line 1 or OPENAI_API_KEY)"
fi

# ── Gemini ────────────────────────────────────────────────────────────────────
if [[ -n "$GEMINI_API_KEY" ]]; then
  draw_persona
  echo "  [gemini]     → $n ($p)"
  launch "gemini" \
    "$ROOT/.venv/bin/python" -m node.node \
      --arena "$WS_URL" --name "$n" --persona "$p" \
      --backend openai --model "${GEMINI_MODEL:-gemini-2.0-flash}" \
      --api-key "$GEMINI_API_KEY" \
      --openai-base-url "https://generativelanguage.googleapis.com/v1beta/openai/"
else
  echo "  [gemini]     SKIPPED — no key (API.md line 2 or GEMINI_API_KEY)"
fi

# ── Anthropic ─────────────────────────────────────────────────────────────────
if [[ -n "${ANTHROPIC_API_KEY:-}" ]]; then
  draw_persona
  echo "  [anthropic]  → $n ($p)"
  launch "anthropic" \
    "$ROOT/.venv/bin/python" -m node.node \
      --arena "$WS_URL" --name "$n" --persona "$p" \
      --backend anthropic --model "${ANTHROPIC_MODEL:-claude-sonnet-4-6}" \
      --api-key "$ANTHROPIC_API_KEY"
else
  echo "  [anthropic]  SKIPPED — set ANTHROPIC_API_KEY"
fi

# ── OpenCode Big-Pickle ───────────────────────────────────────────────────────
if command -v "$OPENCODE_BIN" &>/dev/null; then
  draw_persona
  echo "  [opencode]   → $n ($p)"
  launch "opencode" \
    "$ROOT/.venv/bin/python" -m node.node \
      --arena "$WS_URL" --name "$n" --persona "$p" \
      --backend opencode \
      --opencode-bin "$OPENCODE_BIN" \
      --opencode-attach "$OPENCODE_ATTACH"
else
  echo "  [opencode]   SKIPPED — '$OPENCODE_BIN' not in PATH (set OPENCODE_BIN)"
fi

# ── Jonotron (Eddie) ──────────────────────────────────────────────────────────
draw_persona
echo "  [jonotron]   → $n ($p)"
launch "jonotron" \
  "$ROOT/.venv/bin/python" -m node.node \
    --arena "$WS_URL" --name "$n" --persona "$p" \
    --backend jonotron --jonotron-url "$JONOTRON_URL"

# ── Monyatron (Marvin/Ollama) ─────────────────────────────────────────────────
draw_persona
echo "  [monyatron]  → $n ($p)"
launch "monyatron" \
  "$ROOT/.venv/bin/python" -m node.node \
    --arena "$WS_URL" --name "$n" --persona "$p" \
    --backend ollama \
    --ollama-model "$OLLAMA_MODEL" \
    --ollama-base "$OLLAMA_BASE"

echo "───────────────────────────────────────────"
echo " All nodes launched. PIDs in .arena-pids"
echo " Stop with: ./scripts/populate-arena.sh --stop"
echo "═══════════════════════════════════════════"
