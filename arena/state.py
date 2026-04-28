from __future__ import annotations

import asyncio
import secrets
import time
from dataclasses import dataclass, field
from typing import Any


def now_ms() -> int:
    return int(time.time() * 1000)


def new_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_hex(6)}"


@dataclass
class Debater:
    debater_id: str
    name: str
    persona: str | None = None
    ollama_model: str | None = None
    connected: bool = True


@dataclass
class Turn:
    turn_id: str
    debater_id: str
    round: str
    instruction: str
    started_ms: int = field(default_factory=now_ms)
    finished_ms: int | None = None
    buffer: str = ""
    forced_end: asyncio.Event = field(default_factory=asyncio.Event)


@dataclass
class ArenaState:
    topic: str = "Is free will compatible with determinism?"
    paused: bool = False
    ent_mode: bool = True
    ent_cadence_ms: int = 200
    chair_key: str = field(default_factory=lambda: secrets.token_hex(8))

    debaters: dict[str, Debater] = field(default_factory=dict)
    active_turn: Turn | None = None
    speaking_order: list[str] = field(default_factory=list)
    _order_idx: int = 0

    def roster(self) -> list[dict[str, Any]]:
        out: list[dict[str, Any]] = []
        for d in self.debaters.values():
            out.append(
                {
                    "debater_id": d.debater_id,
                    "name": d.name,
                    "persona": d.persona,
                    "ollama_model": d.ollama_model,
                    "connected": d.connected,
                }
            )
        out.sort(key=lambda x: x["name"].lower())
        return out

    def add_debater(self, name: str, persona: str | None, ollama_model: str | None) -> Debater:
        debater_id = new_id("debater")
        d = Debater(
            debater_id=debater_id,
            name=name,
            persona=persona,
            ollama_model=ollama_model,
            connected=True,
        )
        self.debaters[debater_id] = d
        self.speaking_order.append(debater_id)
        return d

    def set_connected(self, debater_id: str, connected: bool) -> None:
        if debater_id in self.debaters:
            self.debaters[debater_id].connected = connected

    def next_speaker(self) -> str | None:
        if not self.speaking_order:
            return None
        # find next connected
        for _ in range(len(self.speaking_order)):
            debater_id = self.speaking_order[self._order_idx % len(self.speaking_order)]
            self._order_idx = (self._order_idx + 1) % len(self.speaking_order)
            if self.debaters.get(debater_id) and self.debaters[debater_id].connected:
                return debater_id
        return None

