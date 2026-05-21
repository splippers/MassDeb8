#!/usr/bin/env bash
# Launch an Anthropic-backed debater node in the SIC arena.
#
# Usage:
#   ARENA_HOST=<arena-ip> ./scripts/launch-anthropic-node.sh
#
# Env vars:
#   ARENA_HOST        — arena host            (default: 127.0.0.1)
#   ARENA_PORT        — arena WebSocket port  (default: 8787)
#   ANTHROPIC_API_KEY — API key (required)
#   ANTHROPIC_MODEL   — model ID              (default: claude-sonnet-4-6)
#   ANTHROPIC_PERSONA — persona key           (default: wittgenstein)
#   ANTHROPIC_NAME    — display name          (default: Claude-Wittgenstein)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -x "$ROOT/.venv/bin/python" ]]; then
  echo "Missing venv. Run: python3 -m venv .venv && uv pip install -r requirements.txt" >&2
  exit 1
fi

ARENA_HOST="${ARENA_HOST:-127.0.0.1}"
ARENA_PORT="${ARENA_PORT:-8787}"
ANTHROPIC_MODEL="${ANTHROPIC_MODEL:-claude-sonnet-4-6}"
ANTHROPIC_PERSONA="${ANTHROPIC_PERSONA:-wittgenstein}"
ANTHROPIC_NAME="${ANTHROPIC_NAME:-Claude-Wittgenstein}"

if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
  echo "[anthropic] ERROR: ANTHROPIC_API_KEY is not set." >&2
  exit 1
fi

WS_URL="ws://${ARENA_HOST}:${ARENA_PORT}/ws"
echo "[anthropic] connecting to $WS_URL as $ANTHROPIC_NAME ($ANTHROPIC_PERSONA) using $ANTHROPIC_MODEL"

exec "$ROOT/.venv/bin/python" -m node.node \
  --arena "$WS_URL" \
  --name "$ANTHROPIC_NAME" \
  --persona "$ANTHROPIC_PERSONA" \
  --backend anthropic \
  --model "$ANTHROPIC_MODEL" \
  --api-key "$ANTHROPIC_API_KEY"
