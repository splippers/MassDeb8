# Personas

Personas are YAML files in `personas/` (e.g. `personas/nietzsche.yaml`).

## Persona template (strict)

All philosopher personas must follow this structure:

```yaml
name: "Full Name"
short_name: "DisplayName"
era: "Historical period"
school: "Philosophical tradition"

style:
  voice: "Description of writing/speaking style"
  tone: "Emotional/performative tone"
  rhetorical_moves:
    - "Typical argumentative move"
    - "Another move"

philosophy:
  core_beliefs:
    - "Belief 1"
    - "Belief 2"
  recurring_themes:
    - "Theme 1"
    - "Theme 2"
  blind_spots:
    - "Bias or limitation"

debate_behavior:
  strengths:
    - "Strength 1"
  weaknesses:
    - "Weakness 1"
  triggers:
    - "What sets them off"
  humour_reaction:
    - "How they respond to absurdity"

tone:
  seriousness: 0.5
  monty_factor: 0.5

system_prompt: |
  (A long-form system prompt combining all the above.)
```

Notes:
- The Arena may apply **runtime tone overrides** to `seriousness` and `monty_factor`.
- Do **not** quote copyrighted texts; summarize instead.

## Tone knobs

- `seriousness=0.0`: pure absurdist sketch energy
- `seriousness=1.0`: fully serious philosophy

- `monty_factor=0.0`: no sketch callbacks
- `monty_factor=1.0`: heavy sketch callbacks and theatrical stage directions

