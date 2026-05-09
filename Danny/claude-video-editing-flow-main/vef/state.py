"""state.json + events.jsonl helpers.

Working folder discovery:
1. VEF_WORKDIR env var if set
2. ./edit/.vef/ relative to cwd (pipeline scripts run from per-clip folder)
3. Fall back to ./.vef/ if no edit/ subdir

The helper module is import-once-safe and stateless: each call reads/writes
the file fresh. No locking. The serve.py http handler is single-threaded so
concurrent writers (terminal Claude + browser POST) serialize naturally.
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any


def get_workdir() -> Path:
    explicit = os.environ.get("VEF_WORKDIR")
    if explicit:
        return Path(explicit)
    cwd = Path.cwd()
    edit = cwd / "edit"
    if edit.is_dir():
        return edit / ".vef"
    return cwd / ".vef"


def state_path() -> Path:
    return get_workdir() / "state.json"


def events_path() -> Path:
    return get_workdir() / "events.jsonl"


def load() -> dict[str, Any]:
    p = state_path()
    if not p.exists():
        return {}
    try:
        return json.loads(p.read_text())
    except json.JSONDecodeError:
        return {}


def _write(payload: dict[str, Any]) -> None:
    p = state_path()
    p.parent.mkdir(parents=True, exist_ok=True)
    payload["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    tmp = p.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(payload, indent=2))
    tmp.replace(p)


def update(**kw: Any) -> dict[str, Any]:
    """Shallow merge: top-level keys are replaced wholesale."""
    cur = load()
    cur.update(kw)
    _write(cur)
    return cur


def merge(**kw: Any) -> dict[str, Any]:
    """Deep merge for nested dicts (e.g. presets, render, gates).

    Lists and scalars at any level are replaced. Dicts merge recursively.
    """
    cur = load()
    _deep_merge(cur, kw)
    _write(cur)
    return cur


def _deep_merge(dst: dict[str, Any], src: dict[str, Any]) -> None:
    for key, val in src.items():
        if (
            key in dst
            and isinstance(dst[key], dict)
            and isinstance(val, dict)
        ):
            _deep_merge(dst[key], val)
        else:
            dst[key] = val


def append_event(action: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    p = events_path()
    p.parent.mkdir(parents=True, exist_ok=True)
    event = {
        "ts": time.time(),
        "action": action,
        "payload": payload or {},
    }
    with p.open("a") as f:
        f.write(json.dumps(event) + "\n")
    return event


def read_events(since_ts: float | None = None) -> list[dict[str, Any]]:
    p = events_path()
    if not p.exists():
        return []
    out: list[dict[str, Any]] = []
    for line in p.read_text().splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            ev = json.loads(line)
        except json.JSONDecodeError:
            continue
        if since_ts is not None and ev.get("ts", 0) <= since_ts:
            continue
        out.append(ev)
    return out


def reset() -> None:
    """Wipe state.json and events.jsonl (used at the start of a session)."""
    for p in (state_path(), events_path()):
        if p.exists():
            p.unlink()
