from __future__ import annotations

from typing import Any


def build_prompt(
    *,
    name: str,
    persona: str,
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
        f"You are {name}, roleplaying the philosopher persona '{persona}'.\n"
        "You are in a comedic LAN debate chaired by Confucius, with Monty Python energy.\n"
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

