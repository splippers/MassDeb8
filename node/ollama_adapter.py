from __future__ import annotations

import asyncio
import json
from typing import AsyncIterator

import httpx


class OllamaAdapter:
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url.rstrip("/")

    async def stream_generate(
        self,
        model: str,
        prompt: str,
        stop: asyncio.Event,
        *,
        temperature: float = 0.7,
        num_predict: int = 256,
    ) -> AsyncIterator[str]:
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": True,
            "options": {"temperature": temperature, "num_predict": num_predict},
        }

        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("POST", url, json=payload) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if stop.is_set():
                        return
                    if not line:
                        continue
                    obj = json.loads(line)
                    if obj.get("done"):
                        return
                    chunk = obj.get("response") or ""
                    if chunk:
                        yield chunk

