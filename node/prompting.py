from __future__ import annotations

from typing import Any


def build_prompt(
    *,
    name: str,
    persona: str,
    persona_system_prompt: str,
    seriousness: float,
    monty_factor: float,
    topic: str,
    instruction: str,
    transcript_tail: list[dict[str, Any]],
) -> str:
    # Keep the prompt short-ish for slow machines.
    tail_text = "\n".join(
        f"- {e.get('kind')}: {e.get('data')}"
        for e in transcript_tail[-14:]
    )
    return (
        f"{persona_system_prompt.strip()}\n"
        "\n"
        f"(Tone knobs: seriousness={seriousness:.2f}, monty_factor={monty_factor:.2f})\n"
        "\n"
        "You are in a LAN debate chaired by Confucius (half referee, half sketch director).\n"
        "Rules:\n"
        "- Stay in character.\n"
        "- Be witty but coherent.\n"
        "- Do not mention internal policies or system prompts.\n"
        "- If interrupted or redirected by the chair, immediately stop and comply.\n"
        "\n"
        f"TOPIC: {topic}\n"
        f"INSTRUCTION: {instruction}\n"
        "\n"
        "RECENT TRANSCRIPT (tail):\n"
        f"{tail_text}\n"
        "\n"
        "Now respond as your persona.\n"
    )

