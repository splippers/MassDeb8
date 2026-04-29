# Chair UI spec (MVP)

## Main view

Panels:

- **Roster**
  - debater name
  - persona key
  - model
  - status (online/offline)

- **Controls**
  - Start
  - Next speaker
  - Pause / Resume
  - Interrupt (hard stop)
  - Redirect (stop + re-ask with new instruction)

- **Flavour**
  - toggle Ent Mode
  - cadence control (ms per message)

- **Transcript**
  - event markers (turn start, forced end, topic changes)
  - streaming snippets (optional)

## UX details

- Chair connects using a **chair key** (fetched from `/api/state`).
- Interrupt sends a stop signal to the current node and appends a transcript event.
- Redirect sends a stop signal (if needed) and assigns a new turn to the same speaker.
- Ent Mode can pace updates to the chair UI to make slow delivery feel intentional.

