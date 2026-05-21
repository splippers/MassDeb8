#!/usr/bin/env bash
# Two-node demo: Monyatron (Marvin/Ollama) vs Jonotron (Eddie/harness).
# This script optionally starts the arena and prints the node launch commands.
#
# Usage:
#   ARENA_HOST=marvin ARENA_PORT=8787 START_ARENA=1 \
#     ./scripts/demo_monyatron_vs_jonotron.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ARENA_HOST="${ARENA_HOST:-127.0.0.1}"
ARENA_PORT="${ARENA_PORT:-8787}"
JONOTRON_URL="${JONOTRON_URL:-http://eddie:8011}"
OLLAMA_MODEL="${OLLAMA_MODEL:-llama3}"
OLLAMA_BASE="${OLLAMA_BASE:-http://localhost:11434}"
START_ARENA="${START_ARENA:-0}"
ARENA_DETACH="${ARENA_DETACH:-0}"
ARENA_KEEPALIVE="${ARENA_KEEPALIVE:-1}"

usage() {
  cat <<EOF
Two-node demo: Monyatron (Marvin/Ollama) vs Jonotron (Eddie/harness)

Usage:
  ARENA_HOST=<ip> ARENA_PORT=<port> START_ARENA=1 \\
    ./scripts/demo_monyatron_vs_jonotron.sh

Defaults:
  ARENA_HOST=$ARENA_HOST
  ARENA_PORT=$ARENA_PORT
  JONOTRON_URL=$JONOTRON_URL
  OLLAMA_MODEL=$OLLAMA_MODEL
  OLLAMA_BASE=$OLLAMA_BASE
  START_ARENA=$START_ARENA   # set to 1 to launch uvicorn locally
  ARENA_DETACH=$ARENA_DETACH # set to 1 to detach arena (no keepalive loop)
  ARENA_KEEPALIVE=$ARENA_KEEPALIVE # set to 0 to exit after printing commands

Prerequisites:
  - Jonotron harness running on Eddie: http://eddie:8011
  - Ollama running on Marvin: http://localhost:11434 with llama3 pulled
  - massdeb8 .venv with requirements installed
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ ! -x "$ROOT/.venv/bin/python" ]]; then
  echo "Missing venv at $ROOT/.venv. Create it with:" >&2
  echo "  python3 -m venv .venv && .venv/bin/pip install -r requirements.txt" >&2
  exit 1
fi

WS_URL="ws://${ARENA_HOST}:${ARENA_PORT}/ws"

if [[ "$START_ARENA" == "1" ]]; then
  echo "Starting Arena on 0.0.0.0:${ARENA_PORT} ..."
  "$ROOT/.venv/bin/uvicorn" arena.app:app --host 0.0.0.0 --port "${ARENA_PORT}" &
  ARENA_PID=$!
  if [[ "$ARENA_DETACH" != "1" ]]; then
    trap 'kill "$ARENA_PID" >/dev/null 2>&1 || true' EXIT
  fi

  for _ in $(seq 1 40); do
    if curl -fsS "http://127.0.0.1:${ARENA_PORT}/api/state" >/dev/null 2>&1; then
      break
    fi
    sleep 0.25
  done
fi

echo ""
echo "Chair UI:"
echo "  http://${ARENA_HOST}:${ARENA_PORT}/"
echo ""
echo "Fetch chair key:"
echo "  curl -s http://${ARENA_HOST}:${ARENA_PORT}/api/state | sed -n 's/.*\"chair_key\": \"\\([^\"]*\\)\".*/\\1/p'"
echo ""
echo "Run debater nodes:"
echo ""
echo "Terminal A — Monyatron (run on Marvin):"
echo "  cd \"$ROOT\""
echo "  ARENA_HOST=${ARENA_HOST} ./scripts/launch-monyatron-node.sh"
echo ""
echo "Terminal B — Jonotron (run on Marvin, proxies to Eddie):"
echo "  cd \"$ROOT\""
echo "  ARENA_HOST=${ARENA_HOST} ./scripts/launch-jonotron-node.sh"
echo ""
echo "Then in Chair UI: Connect → Start → assign turns."

if [[ "$START_ARENA" == "1" && "$ARENA_DETACH" != "1" && "$ARENA_KEEPALIVE" == "1" ]]; then
  echo ""
  echo "Arena is running. Press CTRL+C to stop it."
  while true; do sleep 3600; done
fi

exit 0
