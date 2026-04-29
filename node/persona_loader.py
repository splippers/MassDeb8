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
    style: str
    system_prompt: str
    constraints: dict[str, Any]
    tone: dict[str, float]


def load_persona(persona_key: str, *, repo_root: Path | None = None) -> Persona:
    root = repo_root or Path(__file__).resolve().parents[1]
    path = root / "personas" / f"{persona_key}.yaml"
    data = yaml.safe_load(path.read_text(encoding="utf-8"))

    return Persona(
        key=persona_key,
        name=str(data.get("name") or persona_key),
        short_name=str(data.get("short_name") or data.get("name") or persona_key),
        style=str(data.get("style") or ""),
        system_prompt=str(data.get("system_prompt") or ""),
        constraints=dict(data.get("constraints") or {}),
        tone=dict(data.get("tone") or {"seriousness": 0.5, "monty_factor": 0.5}),
    )

