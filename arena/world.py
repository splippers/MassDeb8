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
            "Echoing, unstable, occasionally rolling. "
            "Heidegger becomes dangerously coherent. "
            "Everyone must speak as if shouting across an enormous hollow stone."
        ),
    ),
    Venue(
        name="A Moving Toy Train Set",
        description=(
            "Constant motion, derailments possible. "
            "Archimedes becomes obsessed with leverage. "
            "Arguments should wobble, recover, and occasionally fly off the tracks."
        ),
    ),
    Venue(
        name="Inside a Crisp Packet",
        description=(
            "Thunderous crackling, distorted acoustics. "
            "Wittgenstein questions the meaning of 'crisp'. "
            "Treat the environment as noisy and ridiculous, but stay in character."
        ),
    ),
    Venue(
        name="Summit of Ben Nevis (Misty, Echoing)",
        description=(
            "Wind interference, low visibility. "
            "Schopenhauer complains about the Will and the weather. "
            "Treat pauses and uncertainty as mist and gusts interrupting your thought."
        ),
    ),
    Venue(
        name="First Class Dining Saloon of a White Star Line Vessel",
        description=(
            "Elegance + impending doom. "
            "Plato discusses the Form of Iceberg. "
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

