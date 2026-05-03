from __future__ import annotations

import secrets
from pathlib import Path

KEY_BYTES = 8
MIN_KEY_LEN = 8


def load_or_create_chair_key(project_root: Path) -> str:
    """Persist the chair key so the default hall keeps the same key across restarts."""
    path = project_root / "data" / "chair.key"
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        key = path.read_text(encoding="utf-8").strip()
        if len(key) >= MIN_KEY_LEN:
            return key
    key = secrets.token_hex(KEY_BYTES)
    path.write_text(key, encoding="utf-8")
    return key
