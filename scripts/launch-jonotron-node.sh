#!/usr/bin/env bash
# Launch Jonotron as a massdeb8 debater node.
# Jonotron runs on Eddie; this script connects the node to the arena and routes
# generation requests through Eddie's Jonotron harness (http://eddie:8011).
#
# Usage:
#   ARENA_HOST=<arena-ip> ./scripts/launch-jonotron-node.sh
#
# Env vars:
#   ARENA_HOST    — host running the arena   (default: 127.0.0.1)
#   ARENA_PORT    — arena WebSocket port     (default: 8787)
#   JONOTRON_URL  — Jonotron harness base URL (default: http://eddie:8011)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -x "$ROOT/.venv/bin/python" ]]; then
  echo "Missing venv at $ROOT/.venv. Create it with:" >&2
  echo "  python3 -m venv .venv && .venv/bin/pip install -r requirements.txt" >&2
  exit 1
fi

ARENA_HOST="${ARENA_HOST:-127.0.0.1}"
ARENA_PORT="${ARENA_PORT:-8787}"
JONOTRON_URL="${JONOTRON_URL:-http://eddie:8011}"

WS_URL="ws://${ARENA_HOST}:${ARENA_PORT}/ws"

echo "[Jonotron] connecting to $WS_URL using jonotron harness @ $JONOTRON_URL"
exec "$ROOT/.venv/bin/python" -m node.node \
  --arena "$WS_URL" \
  --name "Jonotron" \
  --persona jonotron \
  --backend jonotron \
  --jonotron-url "$JONOTRON_URL"
