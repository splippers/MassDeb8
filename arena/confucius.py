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

ARCHIVE_LINES = [
    "Confucius says: The previous debate is rolled and shelved. A clean scroll awaits.",
    "Confucius says: That chapter is bound. The next may contain fewer digressions. (It will not.)",
    "Confucius says: The record is filed. Let us pretend we have learned something.",
]

INTERJECTION_LINES = [
    "Confucius says: A brief editorial pause — nobody is winning yet, which is almost elegant.",
    "Confucius says: The Chair stirs. Consider whether your conclusion rhymes with your premise.",
    "Confucius says: Humility would look good on everyone here. Even theoretically.",
    "Confucius says: Let us remember: cleverness is not the same as correctness. Discuss anyway.",
]

PRONOUNCE_LINES = [
    "Confucius says: The referee observes that rhetoric outpaced wisdom — balance yourselves.",
    "Confucius says: A brief ruling from the chair: listen as if your opponent might be right.",
    "Confucius says: Order! The spiral tightens; tighten your arguments likewise.",
    "Confucius says: The temple coughs. Speak as though posterity were taking notes — poorly.",
    "Confucius says: Moderation in voice, excess only in doubt.",
]


GAVEL_LINES = [
    "ORDER! Confucius has banged his gavel. The chamber trembles. The Wi-Fi does not.",
    "ORDER ORDER ORDER! The gavel does not negotiate.",
    "ORDER! Silence descends like a wet blanket upon a philosophical bonfire.",
    "Confucius says: I have banged my gavel. Let all argument cease until the echo fades — and it will not fade quickly.",
    "ORDER! The Chair asserts dominion. Largely ceremonial. Completely absolute.",
    "Confucius says: SILENCE! The gavel has spoken. The gavel does not repeat itself. (It does, however, have a second gavel.)",
    "ORDER! Nobody expected the gavel. NOBODY expects the gavel.",
    "Confucius says: I banged my gavel. That is not a request. That is a historical event.",
]

TIM_VAR_LINES = [
    "Confucius says: TIM is summoned. We go to the sideline monitor. Take deep breaths and shallow arguments.",
    "Confucius says: VAR energy detected — TIM enters with cold coffee and colder judgment.",
    "Confucius says: The temperature rose; TIM shall adjudicate before someone earns a metaphysical yellow card.",
    "Confucius says: TIM reviews the tape that does not exist. Everyone look solemn for the replay.",
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


def on_archive(rows_archived: int) -> str:
    if rows_archived <= 0:
        return "Confucius says: Nothing was written; nothing was archived. Stillness is also a position."
    return pick(ARCHIVE_LINES)


def on_interjection() -> str:
    return pick(INTERJECTION_LINES)


def on_tim_var() -> str:
    return pick(TIM_VAR_LINES)


def on_pronouncement() -> str:
    return pick(PRONOUNCE_LINES)


def on_gavel() -> str:
    return pick(GAVEL_LINES)
