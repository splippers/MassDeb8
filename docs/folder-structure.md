# Folder structure

Current repo layout (MVP):

```text
massdeb8/
  arena/                 # Arena server (FastAPI)
    app.py               # HTTP + WebSocket endpoints
    state.py             # in-memory arena state and turn bookkeeping
    store.py             # SQLite transcript store
    confucius.py         # stage-direction interjections
    static/              # Chair UI
  node/                  # Debater node client (connects over WS)
    node.py
    ollama_adapter.py
    persona_loader.py
    prompting.py
  shared/                # shared message schema/models
    protocol.py
  personas/              # YAML persona configs
  docs/                  # specs and repo intent
  requirements.txt
  README.md
```

Planned future split (optional):
- extract `arena/ws.py`, `arena/models.py`, `arena/transcript.py`, `arena/ent_mode.py` as the code grows.

