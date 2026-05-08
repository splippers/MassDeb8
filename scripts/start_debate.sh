#!/usr/bin/env bash
# Start a panel of Big-Pickle-powered philosopher debaters on the MassDeb8 arena.
# All nodes share the same persistent `opencode serve` instance (hot server, no cold starts).
#
# Usage: ./scripts/start_debate.sh [arena_url]
#   arena_url defaults to ws://192.168.1.10:8787/ws
#
# Requires: `opencode serve` running as a systemd service (port 4096)
#   systemctl enable --now /mnt/MARVIN-SANDIEGO/Projects/jonotron/deploy/opencode-serve.service
#
# Or manually: opencode serve --hostname 127.0.0.1 --port 4096 &

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV="${ROOT}/.venv"
PYTHON="${VENV}/bin/python"
ARENA="${1:-ws://192.168.1.10:8787/ws}"
OPENCODE_BIN="${OPENCODE_BIN:-opencode}"
OPENCODE_ATTACH="${OPENCODE_ATTACH:-http://127.0.0.1:4096}"

# Whimsical philosopher panel — 6 debaters, cycling personalities through same server
PERSONAS=(
  "nietzsche"
  "socrates"
  "wittgenstein"
  "heraclitus"
  "epicurus"
  "hegel"
)

NAMES=(
  "Nietzsche"
  "Socrates"
  "Wittgenstein"
  "Heraclitus"
  "Epicurus"
  "Hegel"
)

echo "[MassDeb8] Starting Big-Pickle debate panel — ${#PERSONAS[@]} philosophers"
echo "[MassDeb8] Arena: ${ARENA}"
echo "[MassDeb8] Backend: opencode (attach: ${OPENCODE_ATTACH})"
echo ""

PIDS=()
for i in "${!PERSONAS[@]}"; do
  PERSONA="${PERSONAS[$i]}"
  NAME="${NAMES[$i]}"
  echo "  Spawning ${NAME} (${PERSONA})..."
  "${PYTHON}" -m node.node \
    --arena "${ARENA}" \
    --name "${NAME}" \
    --persona "${PERSONA}" \
    --backend opencode \
    --opencode-attach "${OPENCODE_ATTACH}" \
    --opencode-bin "${OPENCODE_BIN}" &
  PIDS+=($!)
  sleep 0.5  # stagger connections so arena doesn't get flooded
done

echo ""
echo "[MassDeb8] All ${#PERSONAS[@]} debaters launched. PIDs: ${PIDS[*]}"
echo "[MassDeb8] Press Ctrl+C to kill all nodes."

trap 'echo "  Shutting down..."; kill "${PIDS[@]}" 2>/dev/null; wait; exit 0' INT TERM

wait
