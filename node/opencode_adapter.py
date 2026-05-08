from __future__ import annotations

import asyncio
import json
import logging
from typing import AsyncIterator

logger = logging.getLogger(__name__)


class OpenCodeAdapter:
    """Streaming adapter for OpenCode Big-Pickle via persistent `opencode serve`."""

    def __init__(
        self,
        attach_url: str = "http://127.0.0.1:4096",
        opencode_bin: str = "opencode",
        model: str = "opencode/big-pickle",
    ):
        self.attach_url = attach_url.rstrip("/")
        self.opencode_bin = opencode_bin
        self.model = model

    async def stream_generate(
        self,
        model: str,  # kept for interface compat; uses self.model internally
        prompt: str,
        stop: asyncio.Event,
        *,
        temperature: float = 0.7,
        num_predict: int = 256,
    ) -> AsyncIterator[str]:
        cmd = [
            self.opencode_bin,
            "run",
            "--attach", self.attach_url,
            "--format", "json",
            "-m", self.model,
            "--dangerously-skip-permissions",
            prompt,
        ]

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        stderr_lines: list[str] = []

        async def drain_stderr() -> None:
            while True:
                line = await proc.stderr.readline()
                if not line:
                    break
                decoded = line.decode("utf-8", errors="replace").rstrip()
                if decoded:
                    stderr_lines.append(decoded)

        stderr_task = asyncio.create_task(drain_stderr())

        try:
            while True:
                line = await asyncio.wait_for(
                    proc.stdout.readline(),
                    timeout=120,
                )
                if not line:
                    break
                if stop.is_set():
                    proc.kill()
                    return
                raw = line.decode("utf-8", errors="replace").strip()
                if not raw:
                    continue
                try:
                    event = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                if event.get("type") == "text":
                    chunk = event.get("part", {}).get("text", "")
                    if chunk:
                        yield chunk
                elif event.get("type") == "step_finish":
                    break
        except asyncio.TimeoutError:
            logger.warning("opencode stream timed out after 120s")
            proc.kill()
        except asyncio.CancelledError:
            proc.kill()
            raise
        finally:
            stderr_task.cancel()
            try:
                await stderr_task
            except asyncio.CancelledError:
                pass
            try:
                await asyncio.wait_for(proc.wait(), timeout=5)
            except asyncio.TimeoutError:
                pass
