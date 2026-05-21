#!/usr/bin/env bash
# Launch an OpenAI-backed debater node in the SIC arena.
#
# The API key is read from OPENAI_API_KEY env var, or falls back to API.md
# in the repo root (one line, raw key).
#
# Usage:
#   ARENA_HOST=<arena-ip> ./scripts/launch-openai-node.sh
#
# Env vars:
#   ARENA_HOST     — arena host            (default: 127.0.0.1)
#   ARENA_PORT     — arena WebSocket port  (default: 8787)
#   OPENAI_API_KEY — API key               (default: contents of API.md)
#   OPENAI_MODEL   — model ID              (default: gpt-4o)
#   OPENAI_PERSONA — persona key           (default: leibniz)
#   OPENAI_NAME    — display name          (default: GPT-Leibniz)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -x "$ROOT/.venv/bin/python" ]]; then
  echo "Missing venv. Run: python3 -m venv .venv && uv pip install -r requirements.txt" >&2
  exit 1
fi

ARENA_HOST="${ARENA_HOST:-127.0.0.1}"
ARENA_PORT="${ARENA_PORT:-8787}"
OPENAI_API_KEY="${OPENAI_API_KEY:-$(sed -n '1p' "$ROOT/API.md" 2>/dev/null | tr -d '[:space:]' || true)}"
OPENAI_MODEL="${OPENAI_MODEL:-gpt-4o}"
OPENAI_PERSONA="${OPENAI_PERSONA:-leibniz}"
OPENAI_NAME="${OPENAI_NAME:-GPT-Leibniz}"

if [[ -z "$OPENAI_API_KEY" ]]; then
  echo "[openai] ERROR: no API key found. Set OPENAI_API_KEY or put the key in API.md" >&2
  exit 1
fi

WS_URL="ws://${ARENA_HOST}:${ARENA_PORT}/ws"
echo "[openai] connecting to $WS_URL as $OPENAI_NAME ($OPENAI_PERSONA) using $OPENAI_MODEL"

exec "$ROOT/.venv/bin/python" -m node.node \
  --arena "$WS_URL" \
  --name "$OPENAI_NAME" \
  --persona "$OPENAI_PERSONA" \
  --backend openai \
  --model "$OPENAI_MODEL" \
  --api-key "$OPENAI_API_KEY"
