# Personas

Personas are YAML files in `personas/` (e.g. `personas/nietzsche.yaml`).

The node loads a persona and merges:
- persona constraints (e.g. temperature, max tokens)
- node CLI flags (e.g. model name, Ollama base URL)

## Format

Minimal keys:
- `name`
- `short_name`
- `system_prompt`

Optional keys:
- `constraints.max_tokens`
- `constraints.temperature`
- `constraints.top_p` (reserved)
- `tone.seriousness` (0–1)
- `tone.monty_factor` (0–1)

## Tone knobs

- `seriousness=0.0`: pure absurdist sketch energy
- `seriousness=1.0`: fully serious philosophy

- `monty_factor=0.0`: no sketch callbacks
- `monty_factor=1.0`: heavy sketch callbacks and theatrical stage directions

