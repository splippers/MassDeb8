from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CURSORREF = ROOT / "CursorRef"
PERSONAS_DIR = ROOT / "personas"


def main() -> None:
    text = CURSORREF.read_text(encoding="utf-8")
    lines = text.splitlines()

    # CursorRef format we expect:
    # ---
    #
    # personas/foo.yaml
    # <yaml content...>
    # ---
    #
    # personas/bar.yaml
    # <yaml content...>
    #
    # Some files may end with a stray backtick.
    persona_header = re.compile(r"^personas/(?P<name>[a-z0-9_.-]+\.yaml)\s*$", re.IGNORECASE)

    found: dict[str, list[str]] = {}
    i = 0
    while i < len(lines):
        m = persona_header.match(lines[i].strip())
        if not m:
            i += 1
            continue

        filename = m.group("name")
        i += 1
        # Skip possible blank line
        if i < len(lines) and lines[i].strip() == "":
            i += 1

        buf: list[str] = []
        while i < len(lines):
            line = lines[i]
            if line.strip() == "---":
                break
            buf.append(line.rstrip("\n"))
            i += 1

        # Trim trailing lone backtick if present (CursorRef sometimes ends with it)
        while buf and buf[-1].strip() in ("`", "```"):
            buf.pop()

        # Clean leading/trailing blank lines
        while buf and buf[0].strip() == "":
            buf.pop(0)
        while buf and buf[-1].strip() == "":
            buf.pop()

        found[filename] = buf

        # Move past the '---' divider if we stopped on it
        if i < len(lines) and lines[i].strip() == "---":
            i += 1

    if not found:
        raise SystemExit("No persona blocks found in CursorRef.")

    PERSONAS_DIR.mkdir(parents=True, exist_ok=True)
    for filename, content_lines in found.items():
        out_path = PERSONAS_DIR / filename
        out_path.write_text("\n".join(content_lines).rstrip() + "\n", encoding="utf-8")

    print(f"synced {len(found)} personas from CursorRef into {PERSONAS_DIR}")


if __name__ == "__main__":
    main()

