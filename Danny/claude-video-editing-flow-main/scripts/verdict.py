#!/usr/bin/env python3
"""Render the 4-lane verdict options as a coloured table.

Usage: python3 verdict.py [preview-path]
"""
from __future__ import annotations

import sys
from pathlib import Path

from rich.console import Console
from rich.panel import Panel
from rich.table import Table

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
try:
    from vef import state as _vef
except ImportError:
    _vef = None

LANES = [
    ("a", "green",  "ACCEPT",   "ship it",                    "write learnings → session close → SHIP"),
    ("b", "cyan",   "RE-FRAME", "tighten zoom on pick 3",     "same picks, adjust crop → back to step 7"),
    ("c", "yellow", "RE-FLOW",  "23s handoff feels mishmash", "add bridge · expand · swap picks → step 5"),
    ("d", "red",    "RE-PICK",  "scrap, start over",          "different candidates entirely → step 4"),
]


def main() -> int:
    console = Console(force_terminal=True, width=120)

    preview = sys.argv[1] if len(sys.argv) > 1 else None
    subtitle = f"[dim]{preview}[/]" if preview else "[dim]preview watched — what next?[/]"
    console.print(Panel(subtitle, title="[bold cyan]STEP 9 · Verdict[/]",
                        title_align="left", border_style="cyan", expand=False))

    if _vef is not None:
        update: dict = {"stage": "VERDICT", "verdict": None, "ready": False}
        if preview:
            update["render"] = (_vef.load().get("render") or {})
            update["render"]["output"] = {
                **(update["render"].get("output") or {}),
                "path": preview,
                "name": Path(preview).name,
            }
        _vef.update(**update)

    table = Table(show_header=True, header_style="bold white",
                  border_style="dim", expand=False)
    table.add_column("Lane", justify="center", width=6)
    table.add_column("Action", width=10)
    table.add_column("Say (example)", style="italic", min_width=30)
    table.add_column("Means")

    for letter, colour, action, say, means in LANES:
        table.add_row(
            f"[bold {colour}]{letter}[/]",
            f"[{colour}]{action}[/]",
            f"\"{say}\"",
            means,
        )

    console.print(table)

    console.print()
    console.print(
        "[bold]Verdict?[/]   "
        "[dim]a · b · c · d · or describe in free text[/]"
    )
    console.print("[magenta]▸[/]")

    return 0


if __name__ == "__main__":
    sys.exit(main())
