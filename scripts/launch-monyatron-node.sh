#!/usr/bin/env bash
# Launch Monyatron as a massdeb8 debater node.
# Monyatron runs on Marvin, using Marvin's local Ollama (http://localhost:11434).
#
# Usage:
#   ARENA_HOST=<arena-ip> ./scripts/launch-monyatron-node.sh
#
# Env vars:
#   ARENA_HOST   — host running the arena (default: 127.0.0.1)
#   ARENA_PORT   — arena WebSocket port   (default: 8787)
#   OLLAMA_MODEL — model name             (default: llama3)
#   OLLAMA_BASE  — Ollama base URL        (default: http://localhost:11434)
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
OLLAMA_MODEL="${OLLAMA_MODEL:-llama3}"
OLLAMA_BASE="${OLLAMA_BASE:-http://localhost:11434}"

WS_URL="ws://${ARENA_HOST}:${ARENA_PORT}/ws"

echo "[Monyatron] connecting to $WS_URL using ollama ($OLLAMA_MODEL) @ $OLLAMA_BASE"
exec "$ROOT/.venv/bin/python" -m node.node \
  --arena "$WS_URL" \
  --name "Monyatron" \
  --persona monyatron \
  --backend ollama \
  --ollama-model "$OLLAMA_MODEL" \
  --ollama-base "$OLLAMA_BASE"
