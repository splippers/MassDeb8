# Architecture

## Components

### Arena server (`arena/`)
- **Roster**: track connected debater nodes.
- **Debate state**: idle → running → paused.
- **Turn engine**: who speaks next, how long, when to interrupt/redirect.
- **Transcript**: canonical log of utterances + events.
- **Chair API/UI**: HTTP + WebSocket endpoints.

### Debater node (`node/`)
- **Connect**: register with Arena via WebSocket.
- **Persona**: load persona config (Nietzsche, Aristotle, etc.).
- **Generate**: call local Ollama, stream tokens back.
- **Obey**: start/stop/interrupt commands from Arena.

### Chair UI (`arena/static/`)
- **Control**: start, next speaker, interrupt, redirect, Ent Mode.
- **Monitor**: live transcript and roster.

### Ollama (per-node)
- Local to each node (default `http://localhost:11434`).

## Data flow (simplified)

1. Node → Arena: `hello` register name, persona, capabilities.
2. Chair → Arena: start/next/interrupt/redirect.
3. Arena → Node: `turn_assigned` with prompt/context.
4. Node → Arena: token stream and `turn_end`.
5. Arena → Chair UI: live transcript + state via WebSocket.

