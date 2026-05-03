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
            db.execute(
                """
                CREATE TABLE IF NOT EXISTS archive_meta (
                  archive_id INTEGER PRIMARY KEY AUTOINCREMENT,
                  archived_at_ms INTEGER NOT NULL,
                  line_count INTEGER NOT NULL
                )
                """
            )
            db.execute(
                """
                CREATE TABLE IF NOT EXISTS transcript_archive (
                  archive_id INTEGER NOT NULL,
                  seq INTEGER NOT NULL,
                  ts_ms INTEGER NOT NULL,
                  kind TEXT NOT NULL,
                  data_json TEXT NOT NULL,
                  PRIMARY KEY (archive_id, seq)
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

    def archive_and_clear(self) -> dict[str, Any]:
        """Copy the live transcript into transcript_archive, then delete live rows."""
        now = int(time.time() * 1000)
        with sqlite3.connect(self.path) as db:
            try:
                db.execute("BEGIN IMMEDIATE")
                n = int(db.execute("SELECT COUNT(*) FROM transcript").fetchone()[0] or 0)
                if n == 0:
                    db.commit()
                    return {"ok": True, "archive_id": None, "rows_archived": 0, "archived_at_ms": now}
                rows = db.execute(
                    "SELECT ts_ms, kind, data_json FROM transcript ORDER BY id ASC"
                ).fetchall()
                db.execute(
                    "INSERT INTO archive_meta (archived_at_ms, line_count) VALUES (?, ?)",
                    (now, len(rows)),
                )
                archive_id = int(db.execute("SELECT last_insert_rowid()").fetchone()[0])
                for seq, (ts_ms, kind, data_json) in enumerate(rows):
                    db.execute(
                        """
                        INSERT INTO transcript_archive (archive_id, seq, ts_ms, kind, data_json)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                        (archive_id, seq, ts_ms, kind, data_json),
                    )
                db.execute("DELETE FROM transcript")
                db.commit()
            except Exception:
                db.rollback()
                raise
        return {
            "ok": True,
            "archive_id": archive_id,
            "rows_archived": len(rows),
            "archived_at_ms": now,
        }

    def list_archives(self) -> list[dict[str, Any]]:
        with sqlite3.connect(self.path) as db:
            rows = db.execute(
                "SELECT archive_id, archived_at_ms, line_count FROM archive_meta ORDER BY archive_id DESC"
            ).fetchall()
        return [
            {"archive_id": r[0], "archived_at_ms": r[1], "line_count": r[2]}
            for r in rows
        ]

    def get_archive_events(self, archive_id: int) -> dict[str, Any] | None:
        with sqlite3.connect(self.path) as db:
            meta = db.execute(
                "SELECT archive_id, archived_at_ms, line_count FROM archive_meta WHERE archive_id = ?",
                (archive_id,),
            ).fetchone()
            if not meta:
                return None
            rows = db.execute(
                """
                SELECT ts_ms, kind, data_json FROM transcript_archive
                WHERE archive_id = ? ORDER BY seq ASC
                """,
                (archive_id,),
            ).fetchall()
        events: list[dict[str, Any]] = []
        for ts_ms, kind, data_json in rows:
            events.append({"ts_ms": ts_ms, "kind": kind, "data": json.loads(data_json)})
        return {
            "archive_id": meta[0],
            "archived_at_ms": meta[1],
            "line_count": meta[2],
            "events": events,
        }
