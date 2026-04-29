from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Venue:
    name: str
    description: str


APPROVED_VENUES: list[Venue] = [
    Venue(
        name="The Void Inside the Boulder (Indiana Jones)",
        description=(
            "Echoing emptiness; dust motes of forgotten civilizations; occasional rolling. "
            "Everyone must speak as if shouting across an enormous hollow stone."
        ),
    ),
    Venue(
        name="A Moving Toy Train Set",
        description=(
            "Constant motion through miniature landscapes. Sudden derailments. "
            "Arguments should wobble, recover, and occasionally fly off the tracks."
        ),
    ),
    Venue(
        name="The Crackling Confines of a Crisp Packet",
        description=(
            "Acoustically hostile; salt-and-vinegar thundercrackle with every movement. "
            "Treat the environment as noisy and ridiculous, but stay in character."
        ),
    ),
    Venue(
        name="The Misty Summit of Ben Nevis",
        description=(
            "Wind-whipped, cold, visibility questionable. "
            "Treat pauses and uncertainty as mist and gusts interrupting your thought."
        ),
    ),
    Venue(
        name="The First Class Dining Saloon of a Certain White Star Line Vessel",
        description=(
            "Elegant wood, polite conversation, and a faint sense of impending doom. "
            "Maintain decorum while the universe hints at catastrophe."
        ),
    ),
]


def venue_by_name(name: str) -> Venue:
    for v in APPROVED_VENUES:
        if v.name == name:
            return v
    return Venue(name=name, description="An undocumented venue. Reality feels cheaper here.")


# Event catalog is intentionally light-weight: chair can always send arbitrary events.
SOFT_EVENTS = ["Round of Drinks", "Sudden Breeze", "Chair Sneezes", "Someone Drops a Pen"]
HARD_EVENTS = ["Fight Breaks Out", "Concussion", "Smoke Alarm", "Chair Receives Phone Call (You're late for dinner!)"]
CATASTROPHIC_EVENTS = ["Tornado", "Earthquake", "Godzilla Attack", "Giant Foot (Monty Python)", "Temporal Anomaly"]
META_EVENTS = ["Transcript erased by cartoon hand", "Debate relocated mid-sentence", "Iambic pentameter", "Narrator complains about the budget"]

