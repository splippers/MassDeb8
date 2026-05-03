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
    chair_set_venue = "chair_set_venue"
    chair_trigger_event = "chair_trigger_event"
    chair_set_spiral = "chair_set_spiral"
    chair_kick = "chair_kick"
    chair_archive_debate = "chair_archive_debate"
    chair_set_speaker_mode = "chair_set_speaker_mode"
    chair_set_auto_advance = "chair_set_auto_advance"
    chair_summon_tim = "chair_summon_tim"
    chair_call_debater = "chair_call_debater"
    chair_confucius_pronounce = "chair_confucius_pronounce"
    # turn flow
    turn_assigned = "turn_assigned"
    turn_stream = "turn_stream"
    debater_activity = "debater_activity"
    session_kick = "session_kick"
    turn_end = "turn_end"
    turn_forced_end = "turn_forced_end"
    # transcript
    transcript_append = "transcript_append"
    transcript_cleared = "transcript_cleared"
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
    venue: str
    spiral: float
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
    venue: str
    spiral: float
    event: dict[str, Any] | None = None
    max_tokens: int = 256
    soft_time_ms: int = 120_000
    activity_ping_ms: int = 750
    debaters: list[DebaterInfo] = Field(default_factory=list)


class TurnStreamPayload(BaseModel):
    turn_id: str
    debater_id: str
    delta: str


class DebaterActivityPayload(BaseModel):
    debater_id: str
    turn_id: str | None = None
    phase: str  # generating|idle
    tick: int = 0
    detail: dict[str, Any] = Field(default_factory=dict)


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


class ChairCallDebaterPayload(BaseModel):
    debater_id: str
    instruction: str | None = None


class ChairKickPayload(BaseModel):
    debater_id: str


class SessionKickPayload(BaseModel):
    reason: str = "kicked"


class ChairSetEntPayload(BaseModel):
    enabled: bool
    cadence_ms: int = 200


class ChairSetTonePayload(BaseModel):
    seriousness: float | None = None
    monty_factor: float | None = None


class ChairSetVenuePayload(BaseModel):
    venue: str


class ChairSetSpiralPayload(BaseModel):
    spiral: float


class ChairTriggerEventPayload(BaseModel):
    kind: str
    label: str


class ChairSpeakerModePayload(BaseModel):
    mode: Literal["cycle", "holy_hand_grenade"]


class ChairAutoAdvancePayload(BaseModel):
    enabled: bool


class ErrorPayload(BaseModel):
    message: str
    detail: dict[str, Any] = Field(default_factory=dict)


def msg(t: MsgType, payload: BaseModel | dict[str, Any] | None = None) -> WireMsg:
    if payload is None:
        return WireMsg(type=t, payload={})
    if isinstance(payload, BaseModel):
        return WireMsg(type=t, payload=payload.model_dump())
    return WireMsg(type=t, payload=payload)
