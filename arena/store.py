from __future__ import annotations

import json
import sqlite3
import time
from pathlib import Path
from typing import Any


class Store:
    def __init__(self, path: str | Path):
        self.path = str(path)
        self._init()

    def _init(self) -> None:
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(self.path) as db:
            db.execute(
                """
                CREATE TABLE IF NOT EXISTS transcript (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  ts_ms INTEGER NOT NULL,
                  kind TEXT NOT NULL,
                  data_json TEXT NOT NULL
                )
                """
            )
            db.commit()

    def append(self, kind: str, data: dict[str, Any]) -> dict[str, Any]:
        event = {
            "ts_ms": int(time.time() * 1000),
            "kind": kind,
            "data": data,
        }
        with sqlite3.connect(self.path) as db:
            db.execute(
                "INSERT INTO transcript (ts_ms, kind, data_json) VALUES (?, ?, ?)",
                (event["ts_ms"], kind, json.dumps(data, ensure_ascii=False)),
            )
            db.commit()
        return event

    def tail(self, n: int = 40) -> list[dict[str, Any]]:
        with sqlite3.connect(self.path) as db:
            rows = db.execute(
                "SELECT ts_ms, kind, data_json FROM transcript ORDER BY id DESC LIMIT ?",
                (n,),
            ).fetchall()
        out: list[dict[str, Any]] = []
        for ts_ms, kind, data_json in reversed(rows):
            out.append({"ts_ms": ts_ms, "kind": kind, "data": json.loads(data_json)})
        return out
