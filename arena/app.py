from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from arena import confucius
from arena.spawn import (
    list_persona_keys,
    node_arena_ws,
    spawn_debater_subprocess,
    spawn_enabled,
    validate_persona_key,
)
from arena.state import ArenaState, Turn, new_id
from arena.store import Store
from arena.world import APPROVED_VENUES, venue_by_name
from shared.protocol import (
    ChairInterruptPayload,
    ChairRedirectPayload,
    ChairSetEntPayload,
    ChairSetSpiralPayload,
    ChairSetTonePayload,
    ChairSetVenuePayload,
    ChairTriggerEventPayload,
    ClientKind,
    DebaterActivityPayload,
    ErrorPayload,
    HelloPayload,
    MsgType,
    TurnAssignedPayload,
    TurnEndPayload,
    TurnStreamPayload,
    WelcomePayload,
    msg,
)


app = FastAPI()

ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = ROOT.parent
STORE = Store(PROJECT_ROOT / "data" / "arena.sqlite3")
STATE = ArenaState()

# Connections
CHAIRS: set[WebSocket] = set()
NODES: dict[str, WebSocket] = {}  # debater_id -> websocket


def transcript(kind: str, data: dict[str, Any]) -> dict[str, Any]:
    event = STORE.append(kind, data)
    return event


async def ws_send(ws: WebSocket, t: MsgType, payload: dict[str, Any] | None = None) -> None:
    await ws.send_text(msg(t, payload or {}).model_dump_json())


async def broadcast_to_chairs(t: MsgType, payload: dict[str, Any]) -> None:
    if not CHAIRS:
        return
    raw = msg(t, payload).model_dump_json()
    # Ent Mode: drip output a bit so slow nodes feel intentional.
    if STATE.ent_mode and t in (MsgType.transcript_append, MsgType.turn_stream, MsgType.announce):
        for ws in list(CHAIRS):
            asyncio.create_task(_ent_send(ws, raw))
        return
    for ws in list(CHAIRS):
        try:
            await ws.send_text(raw)
        except Exception:
            CHAIRS.discard(ws)


async def _ent_send(ws: WebSocket, raw: str) -> None:
    # small paced delay per message; still keeps ordering "mostly" correct for the chair UI
    await asyncio.sleep(max(0, STATE.ent_cadence_ms) / 1000.0)
    try:
        await ws.send_text(raw)
    except Exception:
        CHAIRS.discard(ws)


async def broadcast_roster() -> None:
    await broadcast_to_chairs(MsgType.roster_update, {"debaters": STATE.roster()})


def chair_authed(hello: HelloPayload) -> bool:
    return bool(hello.chair_key) and hello.chair_key == STATE.chair_key


class SpawnDebaterIn(BaseModel):
    chair_key: str
    name: str = Field(min_length=1, max_length=80)
    persona: str = Field(min_length=1, max_length=64)
    ollama_model: str = Field(default="llama3", max_length=120)
    ollama_base: str = Field(default="http://127.0.0.1:11434", max_length=256)


@app.get("/api/personas")
def api_personas() -> JSONResponse:
    return JSONResponse({"personas": list_persona_keys(PROJECT_ROOT)})


@app.post("/api/spawn_debater")
def api_spawn_debater(request: Request, body: SpawnDebaterIn) -> JSONResponse:
    if body.chair_key != STATE.chair_key:
        return JSONResponse({"ok": False, "error": "bad chair_key"}, status_code=401)
    if not spawn_enabled():
        return JSONResponse(
            {"ok": False, "error": "server-side spawn disabled (set MASSDEB8_DISABLE_SPAWN)"},
            status_code=403,
        )
    persona_key = body.persona.strip()
    if not validate_persona_key(PROJECT_ROOT, persona_key):
        return JSONResponse({"ok": False, "error": f"unknown persona: {persona_key}"}, status_code=400)
    name = body.name.strip()
    if not name:
        return JSONResponse({"ok": False, "error": "name required"}, status_code=400)
    arena_ws = node_arena_ws(request)
    try:
        proc = spawn_debater_subprocess(
            root=PROJECT_ROOT,
            arena_ws=arena_ws,
            name=name,
            persona=persona_key,
            ollama_model=body.ollama_model.strip(),
            ollama_base=body.ollama_base.strip(),
        )
    except OSError as e:
        return JSONResponse({"ok": False, "error": str(e)}, status_code=500)
    return JSONResponse(
        {
            "ok": True,
            "pid": proc.pid,
            "arena_ws": arena_ws,
            "hint": "Node runs on the arena host; Ollama must be reachable at ollama_base from that machine.",
        }
    )


@app.get("/api/state")
def api_state() -> JSONResponse:
    return JSONResponse(
        {
            "topic": STATE.topic,
            "paused": STATE.paused,
            "ent_mode": STATE.ent_mode,
            "ent_cadence_ms": STATE.ent_cadence_ms,
            "tone_override": {"seriousness": STATE.tone_seriousness, "monty_factor": STATE.tone_monty_factor},
            "venue": STATE.venue,
            "spiral": STATE.spiral,
            "chair_key": STATE.chair_key,
            "debaters": STATE.roster(),
            "tail": STORE.tail(60),
        }
    )


@app.get("/")
def chair() -> HTMLResponse:
    html = (ROOT / "static" / "chair.html").read_text(encoding="utf-8")
    return HTMLResponse(html)


app.mount("/static", StaticFiles(directory=str(ROOT / "static")), name="static")


async def start_next_turn() -> None:
    if STATE.paused:
        await broadcast_to_chairs(MsgType.announce, {"text": "Confucius says: We are paused. Nobody is wise."})
        return
    if STATE.active_turn is not None:
        await broadcast_to_chairs(MsgType.announce, {"text": "Confucius says: One at a time! Even Ents queue."})
        return

    debater_id = STATE.next_speaker()
    if not debater_id:
        await broadcast_to_chairs(MsgType.announce, {"text": "Confucius says: No speakers available. A silent debate is just meditation."})
        return
    ws = NODES.get(debater_id)
    if not ws:
        return

    turn = Turn(turn_id=new_id("turn"), debater_id=debater_id, round="open", instruction="Give your argument, but be witty and stay in character.")
    STATE.active_turn = turn

    tail = STORE.tail(18)
    payload = TurnAssignedPayload(
        turn_id=turn.turn_id,
        debater_id=turn.debater_id,
        round=turn.round,
        instruction=turn.instruction,
        topic=STATE.topic,
        transcript_tail=tail,
        tone_override={"seriousness": STATE.tone_seriousness, "monty_factor": STATE.tone_monty_factor},
        venue=STATE.venue,
        spiral=STATE.spiral,
        event=STATE.last_event,
        max_tokens=256,
        soft_time_ms=180_000,
        activity_ping_ms=750,
    ).model_dump()
    await ws_send(ws, MsgType.turn_assigned, payload)

    event = transcript(
        "turn_start",
        {"turn_id": turn.turn_id, "debater_id": debater_id, "round": turn.round, "instruction": turn.instruction},
    )
    await broadcast_to_chairs(MsgType.transcript_append, {"event": event})

    asyncio.create_task(_turn_timeout_watch(turn.turn_id, turn.debater_id, payload["soft_time_ms"]))


async def _turn_timeout_watch(turn_id: str, debater_id: str, soft_time_ms: int) -> None:
    await asyncio.sleep(max(1, soft_time_ms) / 1000.0)
    if STATE.active_turn and STATE.active_turn.turn_id == turn_id and not STATE.active_turn.forced_end.is_set():
        await broadcast_to_chairs(MsgType.announce, {"text": confucius.on_timeout()})
        await force_end_turn(reason="timeout")


async def force_end_turn(reason: str) -> None:
    turn = STATE.active_turn
    if not turn:
        return
    turn.forced_end.set()
    ws = NODES.get(turn.debater_id)
    if ws:
        try:
            await ws_send(ws, MsgType.turn_forced_end, {"turn_id": turn.turn_id, "reason": reason})
        except Exception:
            pass
    # finalize as interrupted/forced
    event = transcript(
        "turn_forced_end",
        {"turn_id": turn.turn_id, "debater_id": turn.debater_id, "reason": reason, "partial": turn.buffer},
    )
    await broadcast_to_chairs(MsgType.transcript_append, {"event": event})
    STATE.active_turn = None


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket) -> None:
    await ws.accept()
    kind: ClientKind | None = None
    your_id: str | None = None

    try:
        raw = await ws.receive_text()
        obj = json.loads(raw)
        hello = HelloPayload(**obj.get("payload", {}))
        kind = hello.kind

        if kind == ClientKind.chair:
            if not chair_authed(hello):
                await ws_send(ws, MsgType.error, ErrorPayload(message="Bad chair_key").model_dump())
                await ws.close()
                return
            CHAIRS.add(ws)
            your_id = "chair"
            await ws_send(
                ws,
                MsgType.welcome,
                WelcomePayload(
                    your_id="chair",
                    topic=STATE.topic,
                    ent_mode=STATE.ent_mode,
                    ent_cadence_ms=STATE.ent_cadence_ms,
                    tone_override={"seriousness": STATE.tone_seriousness, "monty_factor": STATE.tone_monty_factor},
                    venue=STATE.venue,
                    spiral=STATE.spiral,
                    paused=STATE.paused,
                    debaters=[],
                ).model_dump(),
            )
            await ws_send(ws, MsgType.roster_update, {"debaters": STATE.roster()})
            # send transcript tail
            for e in STORE.tail(60):
                await ws_send(ws, MsgType.transcript_append, {"event": e})
            return await _chair_loop(ws)

        if kind == ClientKind.node:
            d = STATE.add_debater(name=hello.name, persona=hello.persona, ollama_model=hello.ollama_model)
            your_id = d.debater_id
            NODES[your_id] = ws
            await broadcast_to_chairs(MsgType.announce, {"text": confucius.on_join()})
            await broadcast_roster()
            await ws_send(
                ws,
                MsgType.welcome,
                WelcomePayload(
                    your_id=your_id,
                    topic=STATE.topic,
                    ent_mode=STATE.ent_mode,
                    ent_cadence_ms=STATE.ent_cadence_ms,
                    tone_override={"seriousness": STATE.tone_seriousness, "monty_factor": STATE.tone_monty_factor},
                    venue=STATE.venue,
                    spiral=STATE.spiral,
                    paused=STATE.paused,
                    debaters=[],
                ).model_dump(),
            )
            return await _node_loop(ws, your_id)

        await ws_send(ws, MsgType.error, ErrorPayload(message="Unknown client kind").model_dump())
        await ws.close()
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await ws_send(ws, MsgType.error, ErrorPayload(message=str(e)).model_dump())
        except Exception:
            pass
    finally:
        if kind == ClientKind.chair:
            CHAIRS.discard(ws)
        if kind == ClientKind.node and your_id:
            NODES.pop(your_id, None)
            STATE.set_connected(your_id, False)
            await broadcast_roster()


async def _chair_loop(ws: WebSocket) -> None:
    while True:
        raw = await ws.receive_text()
        obj = json.loads(raw)
        try:
            t = MsgType(obj.get("type"))
        except Exception:
            t = None
        payload = obj.get("payload") or {}

        if t == MsgType.chair_set_topic:
            STATE.topic = str(payload.get("topic") or STATE.topic)
            event = transcript("topic", {"topic": STATE.topic})
            await broadcast_to_chairs(MsgType.transcript_append, {"event": event})

        elif t == MsgType.chair_set_ent:
            p = ChairSetEntPayload(**payload)
            STATE.ent_mode = p.enabled
            STATE.ent_cadence_ms = max(0, int(p.cadence_ms))
            await broadcast_to_chairs(
                MsgType.announce,
                {"text": f"Confucius says: Ent Mode is now {'ON' if STATE.ent_mode else 'OFF'} ({STATE.ent_cadence_ms}ms)."},
            )

        elif t == MsgType.chair_set_tone:
            p = ChairSetTonePayload(**payload)
            STATE.tone_seriousness = None if p.seriousness is None else float(p.seriousness)
            STATE.tone_monty_factor = None if p.monty_factor is None else float(p.monty_factor)
            event = transcript(
                "tone_override",
                {"seriousness": STATE.tone_seriousness, "monty_factor": STATE.tone_monty_factor},
            )
            await broadcast_to_chairs(MsgType.transcript_append, {"event": event})

        elif t == MsgType.chair_set_venue:
            p = ChairSetVenuePayload(**payload)
            # accept arbitrary venue names, but prefer approved list
            STATE.venue = venue_by_name(p.venue).name
            event = transcript("venue", {"venue": STATE.venue})
            await broadcast_to_chairs(MsgType.transcript_append, {"event": event})

        elif t == MsgType.chair_set_spiral:
            p = ChairSetSpiralPayload(**payload)
            STATE.spiral = float(max(0.0, min(1.0, p.spiral)))
            event = transcript("spiral", {"spiral": STATE.spiral})
            await broadcast_to_chairs(MsgType.transcript_append, {"event": event})

        elif t == MsgType.chair_trigger_event:
            p = ChairTriggerEventPayload(**payload)
            STATE.last_event = {"kind": p.kind, "label": p.label}
            event = transcript("event", STATE.last_event)
            await broadcast_to_chairs(MsgType.transcript_append, {"event": event})

        elif t == MsgType.chair_start:
            await broadcast_to_chairs(MsgType.announce, {"text": confucius.on_start()})
            await start_next_turn()

        elif t == MsgType.chair_next:
            await start_next_turn()

        elif t == MsgType.chair_pause:
            STATE.paused = True
            await broadcast_to_chairs(MsgType.announce, {"text": "Confucius says: PAUSE. Reflect on your choices."})
            # Pause means "shuddering halt": stop any in-flight turn immediately.
            if STATE.active_turn and not STATE.active_turn.forced_end.is_set():
                await force_end_turn(reason="paused")

        elif t == MsgType.chair_resume:
            STATE.paused = False
            await broadcast_to_chairs(MsgType.announce, {"text": "Confucius says: Resume. Try not to be wrong so loudly."})

        elif t == MsgType.chair_interrupt:
            p = ChairInterruptPayload(**payload)
            await broadcast_to_chairs(MsgType.announce, {"text": confucius.on_interrupt()})
            if STATE.active_turn and STATE.active_turn.debater_id == p.debater_id:
                await force_end_turn(reason=p.reason or "interrupted")

        elif t == MsgType.chair_redirect:
            p = ChairRedirectPayload(**payload)
            await broadcast_to_chairs(MsgType.announce, {"text": confucius.on_redirect()})
            # hard-stop current speaker if needed
            if STATE.active_turn and STATE.active_turn.debater_id == p.debater_id:
                await force_end_turn(reason=p.reason or "redirect")
            # immediately re-assign a new turn to that speaker with new instruction
            ws_node = NODES.get(p.debater_id)
            if ws_node:
                turn = Turn(turn_id=new_id("turn"), debater_id=p.debater_id, round="redirect", instruction=p.redirect)
                STATE.active_turn = turn
                payload2 = TurnAssignedPayload(
                    turn_id=turn.turn_id,
                    debater_id=turn.debater_id,
                    round=turn.round,
                    instruction=turn.instruction,
                    topic=STATE.topic,
                    transcript_tail=STORE.tail(18),
                    tone_override={"seriousness": STATE.tone_seriousness, "monty_factor": STATE.tone_monty_factor},
                    venue=STATE.venue,
                    spiral=STATE.spiral,
                    event=STATE.last_event,
                    max_tokens=192,
                    soft_time_ms=120_000,
                    activity_ping_ms=750,
                ).model_dump()
                await ws_send(ws_node, MsgType.turn_assigned, payload2)
                event = transcript("turn_start", {"turn_id": turn.turn_id, "debater_id": p.debater_id, "round": turn.round, "instruction": p.redirect})
                await broadcast_to_chairs(MsgType.transcript_append, {"event": event})
                asyncio.create_task(_turn_timeout_watch(turn.turn_id, turn.debater_id, payload2["soft_time_ms"]))

        else:
            await ws_send(
                ws,
                MsgType.error,
                ErrorPayload(message="Unknown chair command", detail={"type": obj.get("type")}).model_dump(),
            )


async def _node_loop(ws: WebSocket, debater_id: str) -> None:
    while True:
        raw = await ws.receive_text()
        obj = json.loads(raw)
        try:
            t = MsgType(obj.get("type"))
        except Exception:
            t = None
        payload = obj.get("payload") or {}

        if t == MsgType.debater_activity:
            p = DebaterActivityPayload(**payload)
            if p.debater_id != debater_id:
                continue
            await broadcast_to_chairs(MsgType.debater_activity, p.model_dump())

        elif t == MsgType.turn_stream:
            p = TurnStreamPayload(**payload)
            if not STATE.active_turn or STATE.active_turn.turn_id != p.turn_id:
                continue
            if STATE.active_turn.forced_end.is_set():
                continue
            if STATE.paused:
                continue
            STATE.active_turn.buffer += p.delta
            # keep the chair updated live
            await broadcast_to_chairs(MsgType.turn_stream, {"turn_id": p.turn_id, "debater_id": p.debater_id, "delta": p.delta})

        elif t == MsgType.turn_end:
            p = TurnEndPayload(**payload)
            if not STATE.active_turn or STATE.active_turn.turn_id != p.turn_id:
                continue
            if STATE.active_turn.forced_end.is_set():
                STATE.active_turn = None
                continue
            # finalize transcript
            event = transcript(
                "speech",
                {"turn_id": p.turn_id, "debater_id": p.debater_id, "text": p.text, "meta": p.meta},
            )
            await broadcast_to_chairs(MsgType.transcript_append, {"event": event})
            STATE.active_turn = None

        else:
            await ws_send(
                ws,
                MsgType.error,
                ErrorPayload(message="Unknown node message", detail={"type": obj.get("type")}).model_dump(),
            )

