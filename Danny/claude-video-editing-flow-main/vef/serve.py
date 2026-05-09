"""vef serve -- localhost http server bridging terminal pipeline to browser UI.

Usage:
  python -m vef.serve <clip-folder> [--port 8765] [--no-open]

Routes:
  GET  /            mockup index.html (the UI)
  GET  /styles.css  forwarded if present alongside index.html (none today)
  GET  /state       state.json (or {} if missing)
  GET  /events      events.jsonl (or empty)
  POST /event       append to events.jsonl; immediately apply to state.json
                    where it's safe (presets, source, picks, ready, verdict).
                    Heavy actions (go, lockin) only set the ready flag and
                    log the event for terminal Claude to consume.

Single-threaded BaseHTTPRequestHandler. Localhost only. No auth.
The mockup HTML lives at:
    Claude-Video-Editing-Flow/mockups/v1-loop-cutter-aligned/index.html
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.parse
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

from . import state

STALE_SESSION_AGE_S = 24 * 3600  # auto-reset state on serve start if older

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MOCKUP_HTML = (
    PROJECT_ROOT / "mockups" / "v1-loop-cutter-aligned" / "index.html"
)


def _apply_event_to_state(action: str, payload: dict) -> None:
    """Some events update state.json directly so the UI mirrors instantly.
    Others are signals for terminal Claude to read and act on."""
    if action == "set_preset":
        key, value = payload.get("key"), payload.get("value")
        if key:
            state.merge(presets={key: value})
    elif action == "set_source":
        path = payload.get("path", "")
        name = Path(path).name if path else ""
        state.merge(source={"path": path, "name": name})
    elif action == "toggle_pick":
        cur = state.load()
        cands = cur.get("candidates")
        if not cands:
            return  # nothing to toggle yet, don't overwrite with []
        target_id = payload.get("id")
        toggled = False
        for c in cands:
            if c.get("id") == target_id:
                c["picked"] = not c.get("picked", False)
                toggled = True
                break
        if toggled:
            state.update(candidates=cands)
    elif action == "clear_picks":
        cur = state.load()
        cands = cur.get("candidates")
        if not cands:
            return
        for c in cands:
            c["picked"] = False
        state.update(candidates=cands)
    elif action == "lockin":
        # Mark ready=true so terminal Claude knows the user is done picking.
        # Reply text (if typed in the browser input) is logged in the event.
        state.update(ready=True)
    elif action == "verdict":
        state.update(verdict=payload.get("lane"), ready=True)
    elif action == "go":
        state.update(ready=True)
    # 'ping' / unknown: noop, just logged in events.jsonl


class Handler(BaseHTTPRequestHandler):
    def _send(self, status: int, body: bytes, ctype: str = "text/plain") -> None:
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)
        if path in ("/", "/index.html"):
            if query.get("fresh") == ["1"]:
                state.reset()
                state.update(stage="SETUP", ready=False)
            if not MOCKUP_HTML.exists():
                self._send(500, b"mockup not found", "text/plain")
                return
            self._send(200, MOCKUP_HTML.read_bytes(), "text/html; charset=utf-8")
        elif path == "/state":
            sp = state.state_path()
            body = sp.read_bytes() if sp.exists() else b"{}"
            self._send(200, body, "application/json")
        elif path == "/events":
            ep = state.events_path()
            body = ep.read_bytes() if ep.exists() else b""
            self._send(200, body, "application/x-ndjson")
        elif path == "/health":
            self._send(200, b'{"ok":true}', "application/json")
        else:
            self._send(404, b"not found")

    def do_POST(self) -> None:
        if self.path != "/event":
            self._send(404, b"not found")
            return
        length = int(self.headers.get("Content-Length", "0") or "0")
        raw = self.rfile.read(length) if length else b"{}"
        try:
            event = json.loads(raw or b"{}")
        except json.JSONDecodeError:
            self._send(400, b'{"error":"bad json"}', "application/json")
            return
        action = event.get("action", "")
        payload = event.get("payload", {}) or {}
        if not action:
            self._send(400, b'{"error":"missing action"}', "application/json")
            return
        state.append_event(action, payload)
        try:
            _apply_event_to_state(action, payload)
        except Exception as exc:  # noqa: BLE001
            self._send(
                500,
                json.dumps({"error": str(exc)}).encode(),
                "application/json",
            )
            return
        self._send(200, b'{"ok":true}', "application/json")

    def log_message(self, *args, **kwargs) -> None:  # noqa: D401, ANN002
        # Quiet by default. Set VEF_VERBOSE=1 to see request logs.
        if os.environ.get("VEF_VERBOSE"):
            super().log_message(*args, **kwargs)


def serve(clip_folder: Path, port: int = 8765, open_browser: bool = True) -> None:
    if not clip_folder.is_dir():
        print(f"not a directory: {clip_folder}", file=sys.stderr)
        sys.exit(2)

    edit_dir = clip_folder / "edit"
    edit_dir.mkdir(parents=True, exist_ok=True)
    workdir = edit_dir / ".vef"
    workdir.mkdir(parents=True, exist_ok=True)
    os.environ["VEF_WORKDIR"] = str(workdir)

    # Auto-reset stale state so a returning user doesn't inherit yesterday's picks.
    events = state.read_events()
    if events:
        last_ts = events[-1].get("ts", 0)
        if time.time() - last_ts > STALE_SESSION_AGE_S:
            state.reset()

    if not state.state_path().exists():
        state.update(stage="SETUP", ready=False)

    url = f"http://localhost:{port}"
    print(f"vef serve")
    print(f"  workdir : {workdir}")
    print(f"  state   : {state.state_path()}")
    print(f"  events  : {state.events_path()}")
    print(f"  mockup  : {MOCKUP_HTML}")
    print(f"  url     : {url}")

    server = HTTPServer(("127.0.0.1", port), Handler)

    if open_browser:
        try:
            webbrowser.open_new_tab(url)
        except Exception:
            pass

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped.")
    finally:
        server.server_close()


def main() -> int:
    ap = argparse.ArgumentParser(prog="vef.serve")
    ap.add_argument("clip_folder", type=Path,
                    help="per-clip working folder (contains the .mp4 + edit/)")
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--no-open", action="store_true",
                    help="don't auto-open browser")
    args = ap.parse_args()
    serve(args.clip_folder, args.port, open_browser=not args.no_open)
    return 0


if __name__ == "__main__":
    sys.exit(main())
