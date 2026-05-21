from __future__ import annotations

import asyncio
import os
from typing import AsyncIterator

import openai


class OpenAIAdapter:
    def __init__(self, api_key: str | None = None, base_url: str | None = None):
        self.client = openai.AsyncOpenAI(
            api_key=api_key or os.environ.get("OPENAI_API_KEY"),
            base_url=base_url or None,
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
        stream = await self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": "Respond now as your persona in one paragraph."},
            ],
            temperature=min(temperature, 2.0),
            max_tokens=num_predict,
            stream=True,
        )
        async for chunk in stream:
            if stop.is_set():
                break
            delta = chunk.choices[0].delta.content or ""
            if delta:
                yield delta
