#!/usr/bin/env python3
"""Snap-and-validate gate for an EDL.

Runs ffmpeg silencedetect on the EDL source, snaps each range to the nearest
real silence, prints a before/after diff, writes the snapped bounds back into
the EDL, and refuses to advance to render if any cut is still mid-word
(unless `--accept-tight` is passed).

Usage:
  lockin.py <edl.json> [--head-pad 0.150] [--tail-pad 0.250]
                       [--snap-window 2.0] [--noise-db -32]
                       [--accept-tight] [--no-rewrite]
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _boundary import (
    DEFAULT_HEAD_PAD, DEFAULT_TAIL_PAD, DEFAULT_WINDOW, DEFAULT_NOISE_DB,
    load_or_detect, snap_range,
)

try:
    from vef import state as _vef
except ImportError:
    _vef = None

STATUS_STYLE = {"clean": "bold green", "tight": "yellow", "mid_word": "bold red"}
STATUS_GLYPH = {"clean": "✓ clean", "tight": "⚠ tight", "mid_word": "✗ mid-word"}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("edl", type=Path)
    ap.add_argument("--head-pad", type=float, default=DEFAULT_HEAD_PAD)
    ap.add_argument("--tail-pad", type=float, default=DEFAULT_TAIL_PAD)
    ap.add_argument("--snap-window", type=float, default=DEFAULT_WINDOW)
    ap.add_argument("--noise-db", type=float, default=DEFAULT_NOISE_DB)
    ap.add_argument("--accept-tight", action="store_true",
                    help="render even if some cuts are still mid-word")
    ap.add_argument("--no-rewrite", action="store_true",
                    help="print diff but don't overwrite the EDL")
    args = ap.parse_args()

    if not args.edl.exists():
        print(f"not found: {args.edl}", file=sys.stderr)
        return 2
    try:
        data = json.loads(args.edl.read_text())
    except json.JSONDecodeError as exc:
        print(f"malformed json: {exc}", file=sys.stderr)
        return 3

    console = Console(force_terminal=True, width=120)
    ranges = data.get("ranges", [])
    sources = data.get("sources") or {}

    if not ranges:
        console.print("[yellow]EDL has no ranges[/]")
        return 4

    # Capture original bounds BEFORE snap so the diff table can show them
    old_bounds = [(float(r.get("start", 0)), float(r.get("end", 0))) for r in ranges]

    snap_results = _snap_all(ranges, sources, args, console)
    if snap_results is None:
        return 4  # source resolution failure already reported

    _print_diff(console, ranges, old_bounds, snap_results)

    # Apply snap to in-memory ranges (this is what we'll write + use downstream)
    snapped = []
    for r, sr in zip(ranges, snap_results):
        new = dict(r)
        new["start"] = sr.new_start
        new["end"] = sr.new_end
        new["duration_s"] = round(sr.new_end - sr.new_start, 3)
        new["snap"] = {
            "status": sr.status,
            "head_gap": sr.head_gap,
            "tail_gap": sr.tail_gap,
        }
        snapped.append(new)

    _print_lockin_panel(console, data, snapped)

    has_mid_word = any(r.status == "mid_word" for r in snap_results)
    if has_mid_word and not args.accept_tight:
        console.print()
        console.print(
            "[bold red]REFUSED[/] one or more cuts have no clean silence within "
            "window. Re-pick the bounds, widen [bold]--snap-window[/], or pass "
            "[bold]--accept-tight[/] to render anyway."
        )
        return 5

    if not args.no_rewrite:
        data["ranges"] = snapped
        args.edl.write_text(json.dumps(data, indent=2))
        console.print(f"\n[dim]wrote snapped bounds → {args.edl}[/]")

    _update_vef_state(data, snapped)

    console.print()
    console.print(
        "[bold]Render?[/]   "
        "[bold green]y[/] yes  ·  [bold yellow]n[/] revise  ·  [bold red]q[/] quit"
    )
    console.print("[magenta]▸[/]")
    return 0


def _snap_all(ranges, sources, args, console):
    """Group ranges by source, probe each source once, snap all its ranges."""
    by_source: dict[str, list[tuple[int, dict]]] = {}
    for i, r in enumerate(ranges):
        key = r.get("source")
        if not key:
            console.print(f"[red]range {i}: missing 'source'[/]")
            return None
        if key not in sources:
            console.print(f"[red]range {i}: source '{key}' not in sources map[/]")
            return None
        by_source.setdefault(key, []).append((i, r))

    snap_results = [None] * len(ranges)
    for key, items in by_source.items():
        src_path = Path(sources[key]).expanduser()
        if not src_path.is_absolute():
            # Resolve relative paths against the EDL file's parent, not CWD
            src_path = (args.edl.resolve().parent / src_path).resolve()
        if not src_path.exists():
            console.print(f"[red]source not found: {src_path}[/]")
            return None

        cache_path = src_path.parent / "edit" / "silences.json"
        console.print(
            f"[dim]probing silences in {src_path.name}  "
            f"(noise={args.noise_db}dB) …[/]"
        )
        silences = load_or_detect(
            src_path, cache=cache_path,
            noise_db=args.noise_db, min_silence=0.10,
        )
        console.print(f"[dim]  {len(silences)} silence intervals[/]")

        for i, r in items:
            snap_results[i] = snap_range(
                float(r.get("start", 0)),
                float(r.get("end", 0)),
                silences,
                head_pad=args.head_pad,
                tail_pad=args.tail_pad,
                window=args.snap_window,
            )
    return snap_results


def _print_diff(console, ranges, old_bounds, snap_results):
    table = Table(
        show_header=True, header_style="bold white",
        border_style="dim", expand=False,
        title="[bold cyan]GATE 1 · snap to silence[/]",
        title_justify="left",
    )
    table.add_column("Pick", justify="center", width=5, style="bold magenta")
    table.add_column("Beat", min_width=18, max_width=30)
    table.add_column("Old", justify="right", width=17)
    table.add_column("New", justify="right", width=17)
    table.add_column("Head", justify="right", width=7)
    table.add_column("Tail", justify="right", width=7)
    table.add_column("Status", justify="left", width=11)

    for i, (r, (os, oe), sr) in enumerate(
        zip(ranges, old_bounds, snap_results), start=1
    ):
        beat = (r.get("beat") or "—")[:30]
        old = f"{os:.2f} → {oe:.2f}"
        new = f"{sr.new_start:.2f} → {sr.new_end:.2f}"
        head = f"{int(sr.head_gap*1000)}ms"
        tail = f"{int(sr.tail_gap*1000)}ms"
        status = Text(STATUS_GLYPH[sr.status], style=STATUS_STYLE[sr.status])
        table.add_row(str(i), beat, old, new, head, tail, status)
    console.print(table)


def _print_lockin_panel(console, data, snapped_ranges):
    target = data.get("target_runtime_s") or data.get("target_seconds")
    total = sum(r.get("duration_s", 0) for r in snapped_ranges)
    mode = data.get("selection_mode", "")
    changelog = data.get("changelog_v2") or data.get("changelog", "")
    subtitle = f"[dim]{mode}[/]" if mode else ""
    if changelog:
        subtitle = (subtitle + "\n" if subtitle else "") + f"[dim]{changelog}[/]"
    if not subtitle:
        subtitle = "[dim]picks snapped — review before rendering[/]"

    console.print(Panel(subtitle, title="[bold cyan]STEP 5 · Lock in picks[/]",
                        title_align="left", border_style="cyan", expand=False))

    table = Table(show_header=True, header_style="bold white",
                  border_style="dim", expand=False)
    table.add_column("Pick", justify="center", width=6, style="bold magenta")
    table.add_column("Beat")
    table.add_column("Dur", justify="right", width=9)

    for i, r in enumerate(snapped_ranges, start=1):
        dur = r.get("duration_s") or (r.get("end", 0) - r.get("start", 0))
        table.add_row(str(i), r.get("beat", "—"), f"{dur:.2f}s")

    if target is not None:
        tol = target * 0.10
        in_tol = abs(total - target) <= tol
        mark = "✓" if in_tol else "✗"
        style = "bold green" if in_tol else "bold red"
        table.add_row("", Text("Total", style="bold"),
                      Text(f"{total:.2f}s {mark}", style=style))
    else:
        table.add_row("", Text("Total", style="bold"),
                      Text(f"{total:.2f}s", style="bold green"))
    console.print(table)


def _update_vef_state(data, snapped_ranges):
    if _vef is None:
        return
    cur = _vef.load()
    cands = cur.get("candidates") or []
    target = (cur.get("budget") or {}).get("target_s") \
        or data.get("target_runtime_s") \
        or data.get("target_seconds") or 60
    total = sum(r.get("duration_s", 0) for r in snapped_ranges)
    lower = round(target * 0.9, 1)
    upper = round(target * 1.1, 1)
    in_window = lower <= total <= upper

    if cands:
        picked_ids: list[int] = []
        for r in snapped_ranges:
            rs = float(r.get("start", 0))
            re_ = float(r.get("end", rs))
            best_id = None
            best_score = float("inf")
            for c in cands:
                cs, ce = c.get("source_start_s"), c.get("source_end_s")
                if cs is None or ce is None:
                    continue
                cs, ce = float(cs), float(ce)
                if max(0.0, min(ce, re_) - max(cs, rs)) < 1.0:
                    continue
                score = abs(cs - rs) + abs(ce - re_)
                if score < best_score:
                    best_score = score
                    best_id = c["id"]
            if best_id is not None:
                picked_ids.append(best_id)
        for c in cands:
            c["picked"] = c["id"] in picked_ids

    _vef.update(
        stage="GATES",
        candidates=cands,
        picks=[
            {"start": float(r.get("start", 0)),
             "end": float(r.get("end", 0)),
             "duration_s": float(r.get("duration_s", 0)),
             "beat": r.get("beat", "")}
            for r in snapped_ranges
        ],
        budget={
            "total_s": round(total, 2),
            "target_s": target,
            "lower": lower,
            "upper": upper,
            "in_window": in_window,
            "delta": round(total - target, 2),
        },
        ready=False,
    )


if __name__ == "__main__":
    sys.exit(main())
