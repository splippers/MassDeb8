from __future__ import annotations

import random


JOIN_LINES = [
    "Confucius says: A new disputant arrives. Try not to embarrass your ancestors.",
    "Confucius says: Welcome. Remove your shoes. Also remove your bad arguments.",
    "Confucius says: The wise person speaks slowly. Convenient, given your hardware.",
]

START_LINES = [
    "Confucius says: Let the debate begin. No shouting. This is philosophy, not wrestling. (It is also wrestling.)",
    "Confucius says: We commence. Remember: an argument is not just contradiction. Unless it is today.",
]

INTERRUPT_LINES = [
    "Confucius says: STOP. Your point has gone to live on a farm.",
    "Confucius says: Enough! That sentence was longer than the Zhou dynasty.",
    "Confucius says: I interrupt because I care. And because I can.",
]

TIMEOUT_LINES = [
    "Confucius says: Your silence is profound. Unfortunately, it is also your turn.",
    "Confucius says: The Ents would like their pacing back.",
]

REDIRECT_LINES = [
    "Confucius says: Answer again, but with fewer metaphors and more shame.",
    "Confucius says: Clarify! Imagine your audience is a goose with tenure.",
]

KICK_LINES = [
    "Confucius says: You are excused. The exit is philosophy-shaped.",
    "Confucius says: Farewell. Your seat has been given to the void.",
    "Confucius says: The session no longer lists you. Do not take it personally. Or do.",
]


def pick(lines: list[str]) -> str:
    return random.choice(lines)


def on_join() -> str:
    return pick(JOIN_LINES)


def on_start() -> str:
    return pick(START_LINES)


def on_interrupt() -> str:
    return pick(INTERRUPT_LINES)


def on_timeout() -> str:
    return pick(TIMEOUT_LINES)


def on_redirect() -> str:
    return pick(REDIRECT_LINES)


def on_kick() -> str:
    return pick(KICK_LINES)
