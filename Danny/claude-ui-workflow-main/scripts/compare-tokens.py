#!/usr/bin/env python3
"""Score a derived tokens.json against a canonical one.

Usage:
    python3 scripts/compare-tokens.py <canonical-slug> <derived-slug>
    python3 scripts/compare-tokens.py sellersessions sellersessions-derived

Match rules — see brands/TOKENS-SCHEMA.md "Field-match metric" section.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BRANDS = ROOT / "brands"


def load(slug: str) -> dict:
    return json.loads((BRANDS / slug / "tokens.json").read_text(encoding="utf-8"))


def hex_distance(a: str, b: str) -> float:
    if not a or not b:
        return 9999
    a, b = a.lstrip("#"), b.lstrip("#")
    if len(a) != 6 or len(b) != 6:
        return 9999
    ar, ag, ab = int(a[:2], 16), int(a[2:4], 16), int(a[4:], 16)
    br, bg, bb = int(b[:2], 16), int(b[2:4], 16), int(b[4:], 16)
    return ((ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2) ** 0.5


def palette_match(canonical: dict, derived: dict) -> tuple[int, int, list[str]]:
    """Count canonical hex values present in derived (within distance threshold)."""
    canonical_hexes = [v["hex"] for v in canonical.get("colors", {}).values()]
    derived_hexes = [v["hex"] for v in derived.get("colors", {}).values()]
    matches = []
    misses = []
    for c_hex in canonical_hexes:
        nearest = min(derived_hexes, key=lambda d: hex_distance(c_hex, d), default=None)
        if nearest and hex_distance(c_hex, nearest) < 20:  # 20 = ΔRGB tolerance
            matches.append(f"{c_hex} ≈ {nearest}")
        else:
            misses.append(c_hex)
    return len(matches), len(canonical_hexes), misses


def typography_match(canonical: dict, derived: dict) -> tuple[int, int]:
    matches = 0
    total = 0
    for role in ("headings", "body"):
        if role not in canonical.get("typography", {}):
            continue
        total += 1
        c_font = canonical["typography"][role].get("font", "").lower()
        d_font = derived.get("typography", {}).get(role, {}).get("font", "").lower()
        # tolerate stack variants and renames (Muli ↔ Mulish)
        c_first = c_font.split("/")[0].strip()
        d_first = d_font.split("/")[0].strip()
        if c_first and (c_first in d_font or d_first in c_font):
            matches += 1
    return matches, total


def theme_match(canonical: dict, derived: dict) -> tuple[int, int]:
    c_mode = canonical.get("theme", {}).get("mode", "").split()[0].lower()
    d_mode = derived.get("theme", {}).get("mode", "").split()[0].lower()
    return (1 if c_mode == d_mode else 0), 1


def identity_match(canonical: dict, derived: dict) -> tuple[int, int]:
    matches = 0
    total = 2
    c = canonical.get("identity", {})
    d = derived.get("identity", {})
    if c.get("name", "").lower().strip() == d.get("name", "").lower().strip():
        matches += 1
    if c.get("domain", "").lower().lstrip("www.") == d.get("domain", "").lower().lstrip("www."):
        matches += 1
    return matches, total


def main(argv: list[str]) -> int:
    if len(argv) < 3:
        print(__doc__)
        return 1
    canonical_slug, derived_slug = argv[1], argv[2]
    canonical = load(canonical_slug)
    derived = load(derived_slug)

    pm, pt, misses = palette_match(canonical, derived)
    tm, tt = typography_match(canonical, derived)
    them_m, them_t = theme_match(canonical, derived)
    im, it = identity_match(canonical, derived)

    total_matched = pm + tm + them_m + im
    total_fields = pt + tt + them_t + it
    pct = (total_matched / total_fields * 100) if total_fields else 0

    print(f"=== compare-tokens: {canonical_slug} vs {derived_slug} ===")
    print(f"  identity     {im}/{it}")
    print(f"  theme.mode   {them_m}/{them_t}")
    print(f"  typography   {tm}/{tt}")
    print(f"  palette      {pm}/{pt}")
    print(f"  ─────────────────────")
    print(f"  TOTAL        {total_matched}/{total_fields}  ({pct:.0f}%)")
    if misses:
        print(f"\n  palette misses (canonical hex absent or > ΔRGB 20 from any derived):")
        for m in misses:
            print(f"    {m}")
    bar = 80
    print(f"\n  {'PASS' if pct >= bar else 'FAIL'} (bar: {bar}%)")
    return 0 if pct >= bar else 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
