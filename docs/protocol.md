# Protocol (WebSocket)

All messages are JSON:

```json
{ "type": "<string>", "payload": { } }
```

## Presence

### Node/Chair → Arena: `hello`
- `payload.kind`: `"node"` or `"chair"`
- nodes include: `name`, `persona`, `ollama_model`
- chair includes: `chair_key`

### Arena → client: `welcome`
Returns initial state: topic, ent mode, and your assigned id.

### Arena → Chair: `roster_update`
List of connected debaters.

## Turn flow

### Arena → Node: `turn_assigned`
Includes `turn_id`, `debater_id`, `instruction`, `topic`, and `transcript_tail`.

### Node → Arena: `turn_stream`
Streaming token deltas: `{turn_id, debater_id, delta}`.

### Node → Arena: `turn_end`
Final text for the turn.

### Arena → Node: `turn_forced_end`
Stop generating immediately (interrupt/timeout/redirect).

## Transcript events

### Arena → Chair: `transcript_append`
Canonical append-only transcript events (`speech`, `turn_start`, `turn_forced_end`, `topic`, etc.).

### Arena → Chair: `announce`
Confucius “stage direction” lines and other operator announcements.

## State machine (current MVP)

- `IDLE`: no speakers or chair connected
- `READY`: chair connected, ≥1 node connected
- `RUNNING`: a turn is active (single speaker at a time)
- `PAUSED`: chair paused; no new turns assigned

Turn advancement is currently chair-driven (“Next speaker”), with timeout fallback.

