#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ARENA_HOST="${ARENA_HOST:-127.0.0.1}"
ARENA_PORT="${ARENA_PORT:-8787}"
OLLAMA_MODEL="${OLLAMA_MODEL:-llama3}"
START_ARENA="${START_ARENA:-0}"
ARENA_DETACH="${ARENA_DETACH:-0}"
ARENA_KEEPALIVE="${ARENA_KEEPALIVE:-1}"

usage() {
  cat <<EOF
Two-node demo: Socrates vs Karl Schlegel

Usage:
  ARENA_HOST=<ip> ARENA_PORT=<port> OLLAMA_MODEL=<model> START_ARENA=1 \\
    ./scripts/demo_socrates_vs_schlegel.sh

Defaults:
  ARENA_HOST=$ARENA_HOST
  ARENA_PORT=$ARENA_PORT
  OLLAMA_MODEL=$OLLAMA_MODEL
  START_ARENA=$START_ARENA   # set to 1 to launch uvicorn locally
  ARENA_DETACH=$ARENA_DETACH # set to 1 to detach arena (no keepalive loop)
  ARENA_KEEPALIVE=$ARENA_KEEPALIVE # set to 0 to exit after printing commands

What this does:
  - Optionally starts the Arena server (if START_ARENA=1)
  - Prints the commands to run two debater nodes on this machine

Notes:
  - Each debater machine needs Ollama running locally at http://localhost:11434
  - Open the Chair UI at http://<arena-ip>:$ARENA_PORT/ and click Connect using /api/state chair_key
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
  if [[ "$ARENA_DETACH" == "1" ]]; then
    # fire-and-forget: do not install a trap that kills the server
    "$ROOT/.venv/bin/uvicorn" arena.app:app --host 0.0.0.0 --port "${ARENA_PORT}" &
  else
    # managed background: kill on exit unless keepalive is enabled
    "$ROOT/.venv/bin/uvicorn" arena.app:app --host 0.0.0.0 --port "${ARENA_PORT}" &
    ARENA_PID=$!
    trap 'kill "$ARENA_PID" >/dev/null 2>&1 || true' EXIT
  fi

  # Quick readiness probe (best-effort)
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
echo "Run debater nodes (same machine example):"
echo ""
echo "Terminal A:"
echo "  cd \"$ROOT\""
echo "  .venv/bin/python -m node.node --arena \"$WS_URL\" --name \"Socrates\" --persona socrates --ollama-model \"$OLLAMA_MODEL\""
echo ""
echo "Terminal B:"
echo "  cd \"$ROOT\""
echo "  .venv/bin/python -m node.node --arena \"$WS_URL\" --name \"Karl Schlegel\" --persona schlegel --ollama-model \"$OLLAMA_MODEL\""
echo ""
echo "Then in Chair UI: Connect → Start → Next speaker (as desired)."

if [[ "$START_ARENA" == "1" && "$ARENA_DETACH" != "1" && "$ARENA_KEEPALIVE" == "1" ]]; then
  echo ""
  echo "Arena is running. Press CTRL+C to stop it."
  # Keep the script alive so the EXIT trap doesn't shut down uvicorn immediately.
  while true; do sleep 3600; done
fi

exit 0
