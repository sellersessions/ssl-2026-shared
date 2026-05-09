#!/usr/bin/env python3
"""Emit brands/<slug>/tokens.json from brands/<slug>/profile.md.

Schema: brands/TOKENS-SCHEMA.md.

Usage:
    python3 scripts/emit-tokens.py <slug>
    python3 scripts/emit-tokens.py --all
"""

from __future__ import annotations

import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BRANDS = ROOT / "brands"


def slugify_role(role: str) -> str:
    s = role.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "_", s)
    return s.strip("_")


def parse_table(lines: list[str], start: int) -> tuple[list[list[str]], int]:
    """Parse a markdown table starting at lines[start]. Return rows + next index."""
    rows: list[list[str]] = []
    i = start
    while i < len(lines) and lines[i].lstrip().startswith("|"):
        if "---" in lines[i]:
            i += 1
            continue
        cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
        rows.append(cells)
        i += 1
    return rows, i


def parse_weight_range(raw: str) -> list[int]:
    nums = [int(n) for n in re.findall(r"\d{3}", raw)]
    if not nums:
        return []
    return [nums[0], nums[-1]]


def section_index(lines: list[str], heading: str) -> int:
    target = f"## {heading}".lower()
    for i, line in enumerate(lines):
        stripped = line.strip().lower()
        if stripped == target or stripped.startswith(target + " "):
            return i
    return -1


def emit_identity(lines: list[str]) -> dict:
    out: dict = {}
    i = section_index(lines, "Identity")
    if i < 0:
        return out
    for line in lines[i + 1 : i + 10]:
        line = line.strip()
        if not line.startswith("-"):
            if line.startswith("##"):
                break
            continue
        m = re.match(r"-\s*\*\*(\w+):\*\*\s*(.+)", line)
        if not m:
            continue
        key, value = m.group(1).lower(), m.group(2).strip()
        if key == "project":
            out["name"] = re.split(r"\s*\(", value, maxsplit=1)[0].strip()
        elif key == "domain":
            out["domain"] = value.replace("https://", "").replace("http://", "").rstrip("/")
    return out


def emit_theme(lines: list[str]) -> dict:
    out: dict = {}
    i = section_index(lines, "Theme")
    if i < 0:
        return out
    for line in lines[i + 1 : i + 10]:
        line = line.strip()
        if line.startswith("##"):
            break
        m = re.match(r"-\s*\*\*(\w+):\*\*\s*(.+)", line)
        if not m:
            continue
        key, value = m.group(1).lower(), m.group(2).strip()
        if key == "mode":
            out["mode"] = value.lower()
        elif key == "style":
            out["style"] = value
        elif key == "mood":
            out["mood"] = [s.strip().lower() for s in value.split(",")]
    return out


def emit_colors(lines: list[str]) -> dict:
    out: dict = {}
    i = section_index(lines, "Colours")
    if i < 0:
        i = section_index(lines, "Colors")
    if i < 0:
        return out
    j = i + 1
    while j < len(lines) and not lines[j].lstrip().startswith("|"):
        j += 1
    rows, _ = parse_table(lines, j)
    for row in rows[1:]:
        if len(row) < 3:
            continue
        role, token, hex_value = row[0], row[1], row[2]
        if not role or not hex_value:
            continue
        token = token.strip("`").strip()
        hex_value = hex_value.strip("`").strip().lower()
        if not re.match(r"^#[0-9a-f]{3,8}$", hex_value):
            continue
        out[slugify_role(role)] = {"token": token, "hex": hex_value}
    return out


def emit_typography(lines: list[str]) -> dict:
    out: dict = {}
    i = section_index(lines, "Typography")
    if i < 0:
        return out
    j = i + 1
    while j < len(lines) and not lines[j].lstrip().startswith("|"):
        j += 1
    rows, end = parse_table(lines, j)
    for row in rows[1:]:
        if len(row) < 3:
            continue
        role, font, weights = row[0], row[1], row[2]
        if not role or not font:
            continue
        out[slugify_role(role)] = {
            "font": font,
            "weight_range": parse_weight_range(weights),
        }
    for line in lines[end : end + 10]:
        m = re.search(r"Google Fonts URL:\s*`?([^`]+)`?", line)
        if m:
            out["google_fonts_url"] = m.group(1).strip()
            break
    return out


def emit_brand(slug: str) -> dict:
    profile = BRANDS / slug / "profile.md"
    if not profile.exists():
        raise SystemExit(f"profile not found: {profile}")
    text = profile.read_text(encoding="utf-8")
    lines = text.splitlines()
    return {
        "brand": slug,
        "version": "1",
        "generated_at": date.today().isoformat(),
        "source": f"brands/{slug}/profile.md",
        "identity": emit_identity(lines),
        "theme": emit_theme(lines),
        "colors": emit_colors(lines),
        "typography": emit_typography(lines),
    }


def write_tokens(slug: str) -> Path:
    payload = emit_brand(slug)
    out = BRANDS / slug / "tokens.json"
    out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    return out


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 1
    arg = argv[1]
    if arg == "--all":
        slugs = [d.name for d in BRANDS.iterdir() if d.is_dir() and (d / "profile.md").exists()]
    else:
        slugs = [arg]
    for slug in slugs:
        path = write_tokens(slug)
        print(f"wrote {path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
