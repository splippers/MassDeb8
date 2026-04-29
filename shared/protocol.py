from __future__ import annotations

from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field


class ClientKind(str, Enum):
    chair = "chair"
    node = "node"


class MsgType(str, Enum):
    # presence
    hello = "hello"
    welcome = "welcome"
    roster_update = "roster_update"
    # chair commands
    chair_start = "chair_start"
    chair_next = "chair_next"
    chair_interrupt = "chair_interrupt"
    chair_redirect = "chair_redirect"
    chair_pause = "chair_pause"
    chair_resume = "chair_resume"
    chair_set_topic = "chair_set_topic"
    chair_set_ent = "chair_set_ent"
    chair_set_tone = "chair_set_tone"
    # turn flow
    turn_assigned = "turn_assigned"
    turn_stream = "turn_stream"
    turn_end = "turn_end"
    turn_forced_end = "turn_forced_end"
    # transcript
    transcript_append = "transcript_append"
    announce = "announce"
    error = "error"


class WireMsg(BaseModel):
    type: MsgType
    payload: dict[str, Any] = Field(default_factory=dict)


class HelloPayload(BaseModel):
    kind: ClientKind
    node_id: str | None = None
    name: str
    persona: str | None = None
    ollama_model: str | None = None
    capabilities: dict[str, Any] = Field(default_factory=dict)
    chair_key: str | None = None


class DebaterInfo(BaseModel):
    debater_id: str
    name: str
    persona: str | None = None
    ollama_model: str | None = None
    connected: bool


class WelcomePayload(BaseModel):
    your_id: str
    topic: str
    ent_mode: bool
    ent_cadence_ms: int
    tone_override: dict[str, float | None] = Field(default_factory=dict)
    paused: bool
    debaters: list[DebaterInfo]


class RosterUpdatePayload(BaseModel):
    debaters: list[DebaterInfo]


class TurnAssignedPayload(BaseModel):
    turn_id: str
    debater_id: str
    round: str
    instruction: str
    topic: str
    transcript_tail: list[dict[str, Any]] = Field(default_factory=list)
    tone_override: dict[str, float | None] = Field(default_factory=dict)
    max_tokens: int = 256
    soft_time_ms: int = 120_000


class TurnStreamPayload(BaseModel):
    turn_id: str
    debater_id: str
    delta: str


class TurnEndPayload(BaseModel):
    turn_id: str
    debater_id: str
    text: str
    meta: dict[str, Any] = Field(default_factory=dict)


class TranscriptAppendPayload(BaseModel):
    event: dict[str, Any]


class InterruptMode(str, Enum):
    hard_stop = "hard_stop"
    redirect = "redirect"


class ChairInterruptPayload(BaseModel):
    debater_id: str
    mode: InterruptMode = InterruptMode.hard_stop
    reason: str | None = None


class ChairRedirectPayload(BaseModel):
    debater_id: str
    redirect: str
    reason: str | None = None


class ChairSetEntPayload(BaseModel):
    enabled: bool
    cadence_ms: int = 200


class ChairSetTonePayload(BaseModel):
    seriousness: float | None = None
    monty_factor: float | None = None


class ErrorPayload(BaseModel):
    message: str
    detail: dict[str, Any] = Field(default_factory=dict)


def msg(t: MsgType, payload: BaseModel | dict[str, Any] | None = None) -> WireMsg:
    if payload is None:
        return WireMsg(type=t, payload={})
    if isinstance(payload, BaseModel):
        return WireMsg(type=t, payload=payload.model_dump())
    return WireMsg(type=t, payload=payload)
