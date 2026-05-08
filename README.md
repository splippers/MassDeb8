# Symposium of Infinite Contention (SIC)
Also known internally as: MassDeb8

A LAN-based virtual debating arena where multiple LLMs, cast as classic philosophers, engage in structured argument under live human moderation.

Type: Meta-System / Simulation  
Intent: Playground + Portfolio Signal  
Audience: Developers, researchers, and curious humans

==================================================

OVERVIEW

Symposium of Infinite Contention (SIC) is a theatrical, local-network debating arena in which multiple Ollama-backed language models participate as philosophers, taking turns to argue, respond, and pontificate.

A human user acts as the Chair — presented diegetically as Confucius — with the power to interrupt, redirect, and moderate the flow of discourse in real time.

This project is intentionally playful, satirical, and a little botched. That is not a bug.

==================================================

WHY THIS EXISTS

Most multi-agent LLM demos assume:
- Unlimited seriousness
- Perfect hardware
- Passive observers
- Endless output

SIC asks a different question:

What if machine discourse were:
- Slow on purpose
- Interruptible
- Moderated
- Theatrical
- Slightly ridiculous

Influenced heavily by Monty Python’s Philosophers’ Football Match, SIC treats argument as performance rather than truth production.

==================================================

CORE IDEAS

HUMAN-IN-THE-LOOP AUTHORITY  
A single Chair controls the arena:
- Starting and stopping debate
- Selecting the next speaker
- Hard-interrupting monologues
- Redirecting the topic

SLOWNESS AS A FEATURE  
Ent Mode deliberately embraces slow, ponderous delivery so that limited hardware feels intentional rather than deficient.

PERSONAS OVER MODELS  
Each debater is defined by a YAML persona, not just a model name. Tone, seriousness, and absurdity are adjustable parameters.

DIEGETIC FLAWS  
Outdated names, strange artefacts, and inconsistent terminology are intentional. This is a world with history, not a pristine demo.

==================================================

WHAT IS IMPLEMENTED (MVP)

- Arena server with WebSocket coordination
- React-based Chair UI (lobby, arena, control drawer)
- Live roster and turn-taking
- Token streaming into a shared transcript
- Chair controls: start, next, interrupt, redirect
- Ent Mode pacing controls
- Scripted Confucius interjections
- YAML-based persona system with tone knobs
- Lightweight LAN security via chair key

==================================================

WHAT THIS IS NOT

- Not a benchmark
- Not a serious philosophy engine
- Not a production AI safety framework
- Not hardened for hostile networks

It is a sandbox for observing and steering machine discourse.

==================================================

TECHNICAL SHAPE

- Python backend (FastAPI + WebSockets)
- Ollama-backed debater nodes (local or LAN)
- React frontend for Chair control
- Single-server or LAN-distributed deployment
- Intentionally permissive trust model (for now)

==================================================

STATUS

This is an actively developed MVP scaffold designed to be extended with richer rulesets, juries, scoring, moderation models, or additional theatrical layers.

It is complete enough to be interesting, and unfinished enough to remain playful.

==================================================

A NOTE ON NAMING

MassDeb8 was the original working title.
Symposium of Infinite Contention is the public-facing name.

The residue between the two is intentional.

==================================================

FINAL WORD

This project exists because discourse is more interesting when someone can shout “Enough!” and bang the gavel.

Truth is optional.
Structure is not.
