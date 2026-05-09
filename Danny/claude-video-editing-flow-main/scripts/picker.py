#!/usr/bin/env python3
"""Render candidates for a video cut as a coloured table.

Usage: python3 picker.py <candidates.json>
Respects NO_COLOR and FORCE_COLOR env vars.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
try:
    from vef import state as _vef
except ImportError:
    _vef = None

TIER_STYLE = {3: "bold green", 2: "yellow", 1: "dim"}
TIER_STARS = {3: "★★★", 2: "★★", 1: "★"}


def fmt_time(seconds: float) -> str:
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{mins}:{secs:02d}"


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: picker.py <candidates.json>", file=sys.stderr)
        return 2

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"not found: {path}", file=sys.stderr)
        return 2

    try:
        data = json.loads(path.read_text())
    except json.JSONDecodeError as exc:
        print(f"malformed json: {exc}", file=sys.stderr)
        return 3

    console = Console(force_terminal=True, width=120)

    meta = (
        f"[cyan]Clip[/]     {data['clip']}\n"
        f"[cyan]Source[/]   {fmt_time(data['source_duration_s'])}\n"
        f"[cyan]Target[/]   {data['target_s']}s  ±{data['tolerance_pct']}%\n"
        f"[cyan]Found[/]    {len(data['candidates'])} candidates"
    )
    console.print(Panel(meta, title="[bold cyan]STEP 3 · Score candidates[/]",
                        title_align="left", border_style="cyan", expand=False))

    table = Table(show_header=True, header_style="bold white",
                  border_style="dim", expand=False, pad_edge=False)
    table.add_column("#", justify="right", style="dim", width=3)
    table.add_column("Beat", min_width=28)
    table.add_column("Dur", justify="right", width=7)
    table.add_column("Source", justify="right", width=15)
    table.add_column("Tier", justify="center", width=5)
    table.add_column("Flag", style="yellow")

    for c in data["candidates"]:
        tier = c.get("tier", 1)
        stars = Text(TIER_STARS[tier], style=TIER_STYLE[tier])
        flag = c.get("flag") or ""
        src = f"{fmt_time(c['source_start_s'])} → {fmt_time(c['source_end_s'])}"
        table.add_row(
            str(c["id"]),
            c["beat"],
            f"{c['duration_s']:.2f}s",
            src,
            stars,
            Text(flag, style="yellow" if flag else ""),
        )

    console.print(table)

    console.print()
    console.print("[bold white]Quotes[/]  [dim]— read only the rows that caught your eye[/]")
    for c in data["candidates"]:
        quote = (c.get("quote") or "").strip()
        if not quote:
            continue
        if len(quote) > 180:
            quote = quote[:177] + "…"
        console.print(
            f"  [bold cyan]{c['id']:>2}[/] · [dim]{c['beat']}[/]\n"
            f"     [italic]\"{quote}\"[/]"
        )

    combos = data.get("combos", [])
    if combos:
        console.print()
        ctable = Table(
            title="[bold]Combos[/] [dim](pre-computed to target)[/]",
            title_justify="left", show_header=True,
            header_style="bold white", border_style="dim", expand=False,
        )
        ctable.add_column("", justify="center", width=3, style="bold magenta")
        ctable.add_column("Picks", min_width=20)
        ctable.add_column("Total", justify="right", width=8)
        ctable.add_column("Label")
        target = data["target_s"]
        tol = target * data["tolerance_pct"] / 100
        for combo in combos:
            picks_str = " + ".join(str(p) for p in combo["picks"])
            total = combo["total_s"]
            in_tol = abs(total - target) <= tol
            total_style = "green" if in_tol else "red"
            ctable.add_row(
                combo["letter"],
                picks_str,
                Text(f"{total:.1f}s", style=total_style),
                combo.get("label", ""),
            )
        console.print(ctable)

    console.print()
    console.print(
        "[bold]Your pick?[/]  "
        "[dim]combo letter · number list · \"skip N\" · free text[/]"
    )
    console.print("[magenta]▸[/]")

    if _vef is not None:
        target = data.get("target_s") or 60
        tol = (data.get("tolerance_pct") or 10) / 100
        clip_name = data.get("clip", "")
        if clip_name and not clip_name.endswith((".mp4", ".mov")):
            clip_name = f"{clip_name}.mp4"
        _vef.update(
            stage="PICK",
            source={
                "name": clip_name,
                "path": clip_name,
                "duration_s": data.get("source_duration_s"),
            },
            presets=_merge_preset_target(target),
            candidates=[
                {
                    "id": c["id"],
                    "tier": c.get("tier", 1),
                    "beat": c.get("beat", ""),
                    "duration_s": round(float(c.get("duration_s", 0)), 2),
                    "quote": (c.get("quote") or "").strip(),
                    "picked": False,
                    "source_start_s": c.get("source_start_s"),
                    "source_end_s": c.get("source_end_s"),
                }
                for c in data.get("candidates", [])
            ],
            budget={
                "total_s": 0,
                "target_s": target,
                "lower": round(target * (1 - tol), 1),
                "upper": round(target * (1 + tol), 1),
                "in_window": False,
                "delta": -target,
            },
            ready=False,
        )

    return 0


def _merge_preset_target(target: float) -> dict:
    cur = _vef.load().get("presets", {}) if _vef else {}
    cur["target"] = int(target) if target == int(target) else target
    return cur


if __name__ == "__main__":
    sys.exit(main())
