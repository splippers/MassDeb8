# massdeb8

A LAN **virtual debating arena** where multiple Ollama-backed LLMs join as **classic philosophers**, speak in turns, and can be **chaired/interrupted live** by the user (as **Confucius**, in a Monty Python-ish style). Slow hardware is a feature: enable **Ent Mode** to make ponderous delivery feel intentional.

## Quick start (local machine)

Prereqs:
- Python 3.10+
- Ollama running on each debater node (default `http://localhost:11434`)

Create a virtualenv:

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

If you prefer `uv`, you can still use it, but `requirements.txt` is the most portable.

Run the Arena server:

```bash
.venv/bin/uvicorn arena.app:app --host 0.0.0.0 --port 8787
```

Open the Chair UI:
- `http://<arena-ip>:8787/`

Run a debater node (on the same machine or any LAN machine):

```bash
.venv/bin/python -m node.node --arena ws://<arena-ip>:8787/ws --name "Nietzsche" --persona nietzsche --ollama-model llama3
```

Run a second node:

```bash
.venv/bin/python -m node.node --arena ws://<arena-ip>:8787/ws --name "Aristotle" --persona aristotle --ollama-model llama3
```

## What’s implemented (MVP)
- WebSocket join + roster
- Chair controls: start, next speaker, interrupt (hard stop), redirect
- Streaming tokens from nodes into a canonical transcript
- Basic “Ent Mode” pacing knobs
- Scripted Confucius interjections on key events
- YAML persona system (`personas/*.yaml`) with seriousness/monty knobs

## Notes
- This is an MVP scaffold designed to be extended with richer rulesets, scoring/jury, and better moderation.
- LAN security is intentionally light for now (single chair key). Add pairing codes/tokens before using on untrusted networks.

## Docs
- `docs/vision.md`
- `docs/architecture.md`
- `docs/protocol.md`
- `docs/ui-spec.md`
- `docs/security.md`
- `docs/personas.md`
- `docs/manifesto.md`

## CursorRef workflow
`CursorRef` is treated as **ephemeral** research input. When it contains `personas/*.yaml` blocks, you can safely
preview changes without overwriting anything:

```bash
.venv/bin/python tools/sync_cursorref_personas.py
```

To actually apply overwrites, use:

```bash
.venv/bin/python tools/sync_cursorref_personas.py --apply
```

## Two-node demo (Socrates vs Karl Schlegel)

```bash
chmod +x scripts/demo_socrates_vs_schlegel.sh
START_ARENA=1 ./scripts/demo_socrates_vs_schlegel.sh
```

Then open the Chair UI and connect using the `chair_key` from `/api/state`.
