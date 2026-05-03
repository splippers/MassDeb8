from __future__ import annotations

import argparse
import asyncio
import json
import secrets
import time

import websockets

from node.ollama_adapter import OllamaAdapter
from node.persona_loader import load_persona
from node.prompting import build_prompt
from shared.protocol import (
    ClientKind,
    DebaterActivityPayload,
    HelloPayload,
    MsgType,
    TurnAssignedPayload,
    TurnEndPayload,
    TurnStreamPayload,
    msg,
)


async def run_node(
    *,
    arena_ws: str,
    name: str,
    persona: str,
    ollama_model: str,
    ollama_base: str,
) -> None:
    node_id = f"node_{secrets.token_hex(6)}"
    adapter = OllamaAdapter(base_url=ollama_base)
    persona_cfg = load_persona(persona)

    async with websockets.connect(arena_ws, ping_interval=20, ping_timeout=20, max_size=2**22) as ws:
        await ws.send(
            msg(
                MsgType.hello,
                HelloPayload(
                    kind=ClientKind.node,
                    node_id=node_id,
                    name=name,
                    persona=persona,
                    ollama_model=ollama_model,
                    capabilities={"streaming": True},
                ),
            ).model_dump_json()
        )

        stop_event = asyncio.Event()
        current_turn: str | None = None
        your_id: str | None = None
        gen_ping_task: asyncio.Task[None] | None = None
        idle_tick = 0
        idle_interval_s = 3.0

        async def send_activity(
            *,
            turn_id: str | None,
            phase: str,
            tick: int,
            detail: dict[str, object],
        ) -> None:
            if not your_id:
                return
            try:
                await ws.send(
                    msg(
                        MsgType.debater_activity,
                        DebaterActivityPayload(
                            debater_id=your_id,
                            turn_id=turn_id,
                            phase=phase,
                            tick=tick,
                            detail=detail,
                        ),
                    ).model_dump_json()
                )
            except Exception:
                pass

        async def idle_ping_loop() -> None:
            nonlocal idle_tick
            while True:
                await asyncio.sleep(idle_interval_s)
                if not your_id or current_turn is not None:
                    continue
                idle_tick += 1
                await send_activity(
                    turn_id=None,
                    phase="idle",
                    tick=idle_tick,
                    detail={"ts_ms": int(time.time() * 1000), "persona": persona, "ollama_model": ollama_model},
                )

        idle_task = asyncio.create_task(idle_ping_loop())

        try:

            async for raw in ws:
                m = json.loads(raw)
                try:
                    t = MsgType(m.get("type"))
                except Exception:
                    t = None
                payload = m.get("payload") or {}

                if t == MsgType.welcome:
                    your_id = payload.get("your_id")
                    print(f"[node] connected as {your_id} ({name}/{persona}) using {ollama_model} @ {ollama_base}")

                elif t == MsgType.turn_assigned:
                    p = TurnAssignedPayload(**payload)
                    if your_id and p.debater_id != your_id:
                        continue

                    # Cancel any prior turn generation
                    stop_event.set()
                    stop_event = asyncio.Event()
                    current_turn = p.turn_id
                    if gen_ping_task:
                        gen_ping_task.cancel()
                        try:
                            await gen_ping_task
                        except asyncio.CancelledError:
                            pass
                        gen_ping_task = None

                    override_ser = (p.tone_override or {}).get("seriousness")
                    override_monty = (p.tone_override or {}).get("monty_factor")
                    seriousness = float(override_ser) if override_ser is not None else float(persona_cfg.tone.get("seriousness", 0.5))
                    monty_factor = float(override_monty) if override_monty is not None else float(persona_cfg.tone.get("monty_factor", 0.5))

                    persona_quick_facts = (
                        f"Persona: {persona_cfg.name} ({persona_cfg.era}; {persona_cfg.school}).\n"
                        f"Voice: {persona_cfg.style.get('voice','')}\n"
                        f"Debate tendencies: strengths={persona_cfg.debate_behavior.get('strengths', [])}, weaknesses={persona_cfg.debate_behavior.get('weaknesses', [])}\n"
                    )

                    peer_names = [d.name for d in p.debaters if d.debater_id != p.debater_id]

                    prompt = build_prompt(
                        name=name,
                        persona=persona,
                        persona_system_prompt=persona_cfg.system_prompt or f"You are {persona_cfg.name}.",
                        persona_quick_facts=persona_quick_facts,
                        seriousness=seriousness,
                        monty_factor=monty_factor,
                        venue=p.venue,
                        spiral=float(p.spiral),
                        event=p.event,
                        topic=p.topic,
                        instruction=p.instruction,
                        transcript_tail=p.transcript_tail,
                        peer_names=peer_names,
                    )

                    print(f"[node] turn_assigned {p.turn_id} round={p.round} (max_tokens={p.max_tokens})")
                    text_parts: list[str] = []
                    gen_tick = 0
                    gen_started = time.monotonic()
                    ping_interval_s = max(0.2, float(p.activity_ping_ms) / 1000.0)

                    async def gen_ping_loop() -> None:
                        nonlocal gen_tick
                        while True:
                            await asyncio.sleep(ping_interval_s)
                            if stop_event.is_set():
                                break
                            gen_tick += 1
                            chars_out = sum(len(x) for x in text_parts)
                            await send_activity(
                                turn_id=p.turn_id,
                                phase="generating",
                                tick=gen_tick,
                                detail={
                                    "ts_ms": int(time.time() * 1000),
                                    "chars_out": chars_out,
                                    "elapsed_s": round(time.monotonic() - gen_started, 2),
                                    "ollama_model": ollama_model,
                                },
                            )

                    gen_ping_task = asyncio.create_task(gen_ping_loop())

                    try:
                        # Simple mapping: more Monty => more temperature; more seriousness => less.
                        # Spiral increases volatility slightly; still bounded.
                        temperature = max(
                            0.2,
                            min(1.3, 0.55 + (monty_factor * 0.55) - (seriousness * 0.25) + (float(p.spiral) * 0.25)),
                        )
                        async for delta in adapter.stream_generate(
                            model=ollama_model,
                            prompt=prompt,
                            stop=stop_event,
                            temperature=temperature,
                            num_predict=int(p.max_tokens),
                        ):
                            if stop_event.is_set():
                                break
                            text_parts.append(delta)
                            await ws.send(
                                msg(
                                    MsgType.turn_stream,
                                    TurnStreamPayload(turn_id=p.turn_id, debater_id=p.debater_id, delta=delta),
                                ).model_dump_json()
                            )
                    except Exception as e:
                        print(f"[node] generation error: {e}")
                    finally:
                        if gen_ping_task:
                            gen_ping_task.cancel()
                            try:
                                await gen_ping_task
                            except asyncio.CancelledError:
                                pass
                            gen_ping_task = None

                    if stop_event.is_set():
                        print("[node] generation stopped (interrupt/timeout).")
                        continue

                    final_text = "".join(text_parts).strip()
                    await ws.send(
                        msg(
                            MsgType.turn_end,
                            TurnEndPayload(
                                turn_id=p.turn_id,
                                debater_id=p.debater_id,
                                text=final_text,
                                meta={"persona": persona, "ollama_model": ollama_model},
                            ),
                        ).model_dump_json()
                    )
                    current_turn = None

                elif t == MsgType.turn_forced_end:
                    # Cooperative cancel: stop forwarding immediately
                    reason = payload.get("reason") or "forced"
                    turn_id = payload.get("turn_id")
                    if current_turn and turn_id == current_turn:
                        print(f"[node] forced_end: {reason}")
                        stop_event.set()

                elif t == MsgType.session_kick:
                    stop_event.set()
                    print("[node] removed from session by chair")
                    break

                elif t == MsgType.error:
                    print(f"[node] error: {payload.get('message')}")
        finally:
            idle_task.cancel()
            try:
                await idle_task
            except asyncio.CancelledError:
                pass
            if gen_ping_task:
                gen_ping_task.cancel()
                try:
                    await gen_ping_task
                except asyncio.CancelledError:
                    pass


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--arena", required=True, help="Arena websocket URL, e.g. ws://192.168.1.10:8787/ws")
    ap.add_argument("--name", required=True, help="Display name, e.g. Nietzsche")
    ap.add_argument("--persona", required=True, help="Persona key, e.g. nietzsche")
    ap.add_argument("--ollama-model", required=True, help="Ollama model name, e.g. llama3")
    ap.add_argument("--ollama-base", default="http://localhost:11434", help="Ollama base URL")
    args = ap.parse_args()

    asyncio.run(
        run_node(
            arena_ws=args.arena,
            name=args.name,
            persona=args.persona,
            ollama_model=args.ollama_model,
            ollama_base=args.ollama_base,
        )
    )


if __name__ == "__main__":
    main()

