# Triumvirate chamber (from `CursorRef`)

The brief at the repo root [`CursorRef`](../CursorRef) describes **TriumvirateChamber**: Colin / Curt / Marsha personas, VAR-style rulings, structured debate rounds, and **Unity C# assets** under `Assets/MassDeb8/Triumvirate/` for the **BoreDoom** stack.

## Applied to *this* repository (Python + React MassDeb8)

| CursorRef asks for | Status here |
| --- | --- |
| `TriumvirateChamber.cs`, Unity prefab, XR hooks | **Out of scope** — different runtime (FastAPI + Vite). |
| `TriumvirateDecision RunDebate(topic, context)` API | **Not implemented.** Could be a future Python package (e.g. `arena/triumvirate/`) that mirrors the decision shape in JSON. |
| Ingest `CursorRef.md` / build logs as context | **Partial:** [`tools/sync_cursorref_personas.py`](../tools/sync_cursorref_personas.py) syncs **persona YAML blocks** from the ephemeral `CursorRef` file into `personas/*.yaml`. Full “ingest CursorRef.md as debate context” is not wired. |
| Colin / Curt / Marsha behaviour | Use **personas** + debate rules in [`node/prompting.py`](../node/prompting.py); no dedicated Triumvirate round engine. |

## Recommendations processed

1. **Treat Triumvirate as a separate product layer** if you need parity with the brief: either add a **Unity/BoreDoom** project that hosts the C# module, or add a **Python `triumvirate` module** with the same `TriumvirateDecision` JSON schema and a thin CLI/API.
2. **Keep using `sync_cursorref_personas.py`** when `CursorRef` contains persona blocks you want merged into this repo’s YAML.
3. **Marsha-style adjudication** could be approximated later with a dedicated persona + chair-only triggers; that would be new protocol surface area.

This doc records scope so the CursorRef file is not mistaken for implemented Python/React features.
