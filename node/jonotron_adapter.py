from __future__ import annotations

import asyncio
from typing import AsyncIterator

import httpx


class JonotronAdapter:
    """Calls Jonotron's /api/llm/simple on Eddie and word-streams the reply.

    Jonotron's endpoint is synchronous, so we fake streaming by yielding
    word by word with a small delay — the arena sees a live stream rather
    than a sudden wall of text.
    """

    def __init__(self, base_url: str = "http://eddie:8011"):
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
        url = f"{self.base_url}/api/llm/simple"
        payload = {"message": prompt}

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            reply: str = resp.json().get("reply") or ""

        words = reply.split(" ")
        for i, word in enumerate(words):
            if stop.is_set():
                return
            chunk = word if i == 0 else " " + word
            yield chunk
            await asyncio.sleep(0.04)
