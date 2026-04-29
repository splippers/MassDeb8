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
  - include persona `system_prompt` in the model prompt

Persona Generation Rules for MassDeb8
- Use the persona template in `docs/personas.md` for every philosopher.
- Base each persona on historically grounded summaries of their works.
- Avoid quoting copyrighted texts; summarise instead.
- Exaggerate stylistic traits slightly for comedic effect.
- Maintain philosophical consistency at all times.
- Honour the seriousness and monty_factor tone knobs.
- Ensure each persona reacts differently to:
  - absurdity
  - interruptions
  - Confucius interjections
  - Ent Mode pacing
- Never break character unless explicitly instructed by the Arena.

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

