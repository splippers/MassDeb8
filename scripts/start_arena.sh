#!/usr/bin/env bash
# Start MassDeb8 on a LAN host (e.g. Eddie): Serves the React Chair UI + API + /ws.
# Usage: ./scripts/start_arena.sh
# Optional: MASSDEB8_PORT=8787 SKIP_UI_BUILD=1 ./scripts/start_arena.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PORT="${MASSDEB8_PORT:-8787}"

if [[ -x "${ROOT}/.venv/bin/uvicorn" ]]; then
  UVICORN="${ROOT}/.venv/bin/uvicorn"
elif command -v uvicorn >/dev/null 2>&1; then
  UVICORN="uvicorn"
else
  echo "Need uvicorn (create .venv and pip install -r requirements.txt, or install uvicorn)." >&2
  exit 1
fi

if [[ "${SKIP_UI_BUILD:-0}" != "1" ]] && [[ ! -f "${ROOT}/ui/dist/index.html" ]]; then
  echo "[MassDeb8] Building Chair UI (ui/dist missing)…"
  if ! command -v npm >/dev/null 2>&1; then
    echo "npm not found; install Node.js or set SKIP_UI_BUILD=1 and build ui/ yourself." >&2
    exit 1
  fi
  (cd "${ROOT}/ui" && npm install && npm run build)
fi

echo "[MassDeb8] Arena on 0.0.0.0:${PORT} — open http://<this-host>:${PORT}/"
exec "${UVICORN}" arena.app:app --host 0.0.0.0 --port "${PORT}"
