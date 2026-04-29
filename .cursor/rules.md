MassDeb8 – Cursor rules

General
- Language: Python 3.10+.
- Frameworks: FastAPI + Uvicorn for `arena/`.
- Async: use `asyncio` and WebSockets for all realtime comms.
- Style: type hints everywhere; keep modules small and single-purpose.

Architecture
- Do not mix Arena and Node logic in the same module.
- Arena owns:
  - web server, WebSocket endpoints, debate state, transcript, Confucius logic.
- Node owns:
  - WebSocket client, persona loading, Ollama calls, local pacing.

Messaging
- All WebSocket messages:
  - JSON with `type` and `payload`.
  - Must match the intent documented in `docs/protocol.md`.

Personas
- Personas are YAML files in `personas/`.
- Node must:
  - load persona by key
  - merge persona constraints with CLI flags
  - include persona `system_prompt` in the model prompt

Hybrid tone
- Implement seriousness/monty_factor as numeric knobs.
- Keep jokes mostly in:
  - persona prompts (`personas/*.yaml`)
  - `arena/confucius.py`

Testing (future)
- Add tests for:
  - state transitions
  - node reconnect behavior
  - transcript assembly

Non-goals (for now)
- No external DB; SQLite + in-memory state is fine.
- No auth beyond chair key.
- No cloud dependencies; LAN-only.

