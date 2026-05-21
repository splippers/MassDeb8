from __future__ import annotations

import asyncio
import os
from typing import AsyncIterator

import anthropic


class AnthropicAdapter:
    def __init__(self, api_key: str | None = None):
        self.client = anthropic.AsyncAnthropic(
            api_key=api_key or os.environ.get("ANTHROPIC_API_KEY"),
        )

    async def stream_generate(
        self,
        model: str,
        prompt: str,
        stop: asyncio.Event,
        *,
        temperature: float = 0.7,
        num_predict: int = 256,
    ) -> AsyncIterator[str]:
        # Anthropic caps temperature at 1.0
        async with self.client.messages.stream(
            model=model,
            system=prompt,
            messages=[{"role": "user", "content": "Respond now as your persona in one paragraph."}],
            temperature=min(temperature, 1.0),
            max_tokens=num_predict,
        ) as stream:
            async for delta in stream.text_stream:
                if stop.is_set():
                    return
                if delta:
                    yield delta
