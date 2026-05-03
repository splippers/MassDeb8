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
    peer_names: list[str] | None = None,
) -> str:
    # Keep the prompt short-ish for slow machines.
    tail_text = "\n".join(
        f"- {e.get('kind')}: {e.get('data')}"
        for e in transcript_tail[-14:]
    )
    peers = peer_names or []
    peer_line = (
        "Other debaters you may address by name (e.g. to ask one clear question): "
        + ", ".join(peers)
        + ".\n\n"
        if peers
        else ""
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
        "Turn format (mandatory for every reply):\n"
        "- Write exactly one paragraph (no lists, no multiple paragraphs, no blank lines).\n"
        "- Base your answer on the topic and what has already been said in RECENT TRANSCRIPT; respond to prior speakers, do not ignore the thread.\n"
        "- Do not repeat yourself: avoid re-using lines or arguments you already made earlier in this debate.\n"
        "- You may end with one direct question to another debater by name if you want their answer next.\n"
        "\n"
        f"{peer_line}"
        f"TOPIC: {topic}\n"
        f"INSTRUCTION: {instruction}\n"
        "\n"
        "RECENT TRANSCRIPT (tail):\n"
        f"{tail_text}\n"
        "\n"
        "Now respond as your persona in one paragraph.\n"
    )

