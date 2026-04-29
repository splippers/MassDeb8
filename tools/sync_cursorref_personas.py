from __future__ import annotations

import argparse
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CURSORREF = ROOT / "CursorRef"
PERSONAS_DIR = ROOT / "personas"


def _read_blocks(cursorref_text: str) -> dict[str, str]:
    lines = cursorref_text.splitlines()
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
        if i < len(lines) and lines[i].strip() == "":
            i += 1

        buf: list[str] = []
        while i < len(lines):
            line = lines[i]
            if line.strip() == "---":
                break
            buf.append(line.rstrip("\n"))
            i += 1

        while buf and buf[-1].strip() in ("`", "```"):
            buf.pop()

        while buf and buf[0].strip() == "":
            buf.pop(0)
        while buf and buf[-1].strip() == "":
            buf.pop()

        found[filename] = buf

        if i < len(lines) and lines[i].strip() == "---":
            i += 1

    return {k: ("\n".join(v).rstrip() + "\n") for k, v in found.items()}


def main() -> None:
    ap = argparse.ArgumentParser(description="Sync personas/*.yaml blocks out of CursorRef.")
    ap.add_argument("--apply", action="store_true", help="Actually write files (default: dry-run).")
    ap.add_argument(
        "--check",
        action="store_true",
        help="Exit non-zero if diffs exist (implies dry-run).",
    )
    ap.add_argument("--cursorref", default=str(CURSORREF), help="Path to CursorRef.")
    ap.add_argument("--personas-dir", default=str(PERSONAS_DIR), help="Output personas/ dir.")
    args = ap.parse_args()

    cursorref_path = Path(args.cursorref)
    personas_dir = Path(args.personas_dir)

    text = cursorref_path.read_text(encoding="utf-8")
    blocks = _read_blocks(text)
    if not blocks:
        raise SystemExit("No persona blocks found in CursorRef.")

    personas_dir.mkdir(parents=True, exist_ok=True)

    created: list[str] = []
    changed: list[str] = []
    unchanged: list[str] = []

    for filename, desired in sorted(blocks.items()):
        out_path = personas_dir / filename
        if not out_path.exists():
            created.append(filename)
            if args.apply and not args.check:
                out_path.write_text(desired, encoding="utf-8")
            continue

        current = out_path.read_text(encoding="utf-8")
        if current != desired:
            changed.append(filename)
            if args.apply and not args.check:
                out_path.write_text(desired, encoding="utf-8")
        else:
            unchanged.append(filename)

    mode = "APPLY" if (args.apply and not args.check) else "DRY-RUN"
    print(f"[{mode}] cursorref={cursorref_path} personas_dir={personas_dir}")
    print(f"[{mode}] found={len(blocks)} created={len(created)} changed={len(changed)} unchanged={len(unchanged)}")
    if created:
        print(f"[{mode}] create: {', '.join(created)}")
    if changed:
        print(f"[{mode}] update: {', '.join(changed)}")
    if (created or changed) and not args.apply:
        print(f"[{mode}] no files written (run with --apply to write)")

    if args.check and (created or changed):
        raise SystemExit(2)


if __name__ == "__main__":
    main()

