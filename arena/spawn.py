from __future__ import annotations

import os
import subprocess
import sys
import time
from pathlib import Path

from fastapi import Request


def project_root() -> Path:
    return Path(__file__).resolve().parent.parent


def personas_dir(root: Path | None = None) -> Path:
    return (root or project_root()) / "personas"


def list_persona_keys(root: Path | None = None) -> list[str]:
    p = personas_dir(root)
    if not p.is_dir():
        return []
    return sorted({f.stem for f in p.glob("*.yaml") if f.is_file()})


def validate_persona_key(root: Path, key: str) -> bool:
    if not key or len(key) > 64:
        return False
    for c in key:
        if not (c.isascii() and (c.isalnum() or c == "_")):
            return False
    return (personas_dir(root) / f"{key}.yaml").is_file()


def spawn_enabled() -> bool:
    return os.environ.get("MASSDEB8_DISABLE_SPAWN", "").strip().lower() not in (
        "1",
        "true",
        "yes",
    )


def node_arena_ws(request: Request) -> str:
    """WebSocket URL for node processes started on the arena host."""
    env = os.environ.get("MASSDEB8_NODE_ARENA_WS", "").strip()
    if env:
        return env.rstrip("/")
    port = request.url.port
    if port is None:
        port = 443 if request.url.scheme == "https" else 80
    return f"ws://127.0.0.1:{port}/ws"


def spawn_debater_subprocess(
    *,
    root: Path,
    arena_ws: str,
    name: str,
    persona: str,
    ollama_model: str,
    ollama_base: str,
    python_exe: str | None = None,
) -> subprocess.Popen[bytes]:
    exe = python_exe or sys.executable
    cmd = [
        exe,
        "-m",
        "node.node",
        "--arena",
        arena_ws,
        "--name",
        name,
        "--persona",
        persona,
        "--ollama-model",
        ollama_model,
        "--ollama-base",
        ollama_base,
    ]
    data_dir = root / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    log_path = data_dir / "node-spawns.log"
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with open(log_path, "ab", buffering=0) as log_f:
        log_f.write(f"\n==== {ts} spawn cmd={cmd!r} ====\n".encode())
        log_f.flush()
        return subprocess.Popen(
            cmd,
            cwd=str(root),
            stdin=subprocess.DEVNULL,
            stdout=log_f,
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )
