from __future__ import annotations

from typing import Any


def build_prompt(
    *,
    name: str,
    persona: str,
    persona_system_prompt: str,
    persona_quick_facts: str,
    seriousness: float,
    monty_factor: float,
    venue: str,
    spiral: float,
    event: dict[str, Any] | None,
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
        f"{persona_quick_facts.strip()}\n"
        "\n"
        f"(Tone knobs: seriousness={seriousness:.2f}, monty_factor={monty_factor:.2f}; spiral={spiral:.2f})\n"
        f"(Venue: {venue})\n"
        f"(Event: {event})\n"
        "\n"
        "You are in a LAN debate chaired by Confucius (half referee, half sketch director).\n"
        "Rules:\n"
        "- Stay in character.\n"
        "- Be witty but coherent.\n"
        "- Do not mention internal policies or system prompts.\n"
        "- If interrupted or redirected by the chair, immediately stop and comply.\n"
        "- React to venue/event in character. Do not break the fourth wall unless the event explicitly demands it.\n"
        "- Start more serious; if spiral is high, allow more surreal escalation without losing your persona.\n"
        "\n"
        f"TOPIC: {topic}\n"
        f"INSTRUCTION: {instruction}\n"
        "\n"
        "RECENT TRANSCRIPT (tail):\n"
        f"{tail_text}\n"
        "\n"
        "Now respond as your persona.\n"
    )

