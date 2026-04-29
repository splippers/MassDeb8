from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


@dataclass(frozen=True)
class Persona:
    key: str
    name: str
    short_name: str
    era: str
    school: str
    style: dict[str, Any]
    philosophy: dict[str, Any]
    debate_behavior: dict[str, Any]
    system_prompt: str
    tone: dict[str, float]


def load_persona(persona_key: str, *, repo_root: Path | None = None) -> Persona:
    root = repo_root or Path(__file__).resolve().parents[1]
    path = root / "personas" / f"{persona_key}.yaml"
    data = yaml.safe_load(path.read_text(encoding="utf-8"))

    return Persona(
        key=persona_key,
        name=str(data.get("name") or persona_key),
        short_name=str(data.get("short_name") or data.get("name") or persona_key),
        era=str(data.get("era") or ""),
        school=str(data.get("school") or ""),
        style=dict(data.get("style") or {}),
        philosophy=dict(data.get("philosophy") or {}),
        debate_behavior=dict(data.get("debate_behavior") or {}),
        system_prompt=str(data.get("system_prompt") or ""),
        tone=dict(data.get("tone") or {"seriousness": 0.5, "monty_factor": 0.5}),
    )

