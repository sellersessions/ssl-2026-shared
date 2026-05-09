#!/usr/bin/env python3
"""Brand ingestion — screenshot assist (B4).

URL ingestion (`scripts/ingest-url.py`) is the baseline. When palette roles
land at low/medium confidence — typically secondary, text_secondary, card_bg,
border, or the brand wash on light themes — the user drops a Shottr full-page
screenshot of the homepage and runs this. We sample dominant colours in
fixed regions (nav strip, hero band, body band) and propose overrides for the
weak fields.

Usage:
    python3 scripts/refine-from-screenshot.py --slug <slug> --screenshot <path>

Apply overrides interactively (default) or by passing them up-front:
    --apply primary,cta,secondary       only consider these roles
    --skip text,text_secondary          never override these
    --auto-medium                        auto-apply when URL confidence is medium
    --no-prompt                          non-interactive: print proposals only
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path

try:
    from PIL import Image
except ModuleNotFoundError:
    sys.stderr.write(
        "Pillow not found. Install with:\n"
        "  python3 -m venv .venv && .venv/bin/pip install -r requirements.txt\n"
        "Then re-run with .venv/bin/python3 scripts/refine-from-screenshot.py …\n"
    )
    raise SystemExit(1)


ROOT = Path(__file__).resolve().parent.parent
BRANDS = ROOT / "brands"

# Roles that are the typical screenshot-assist targets — these are the fields
# the URL pass tends to get wrong on light themes / sparse buttons.
# Fix #17: theme.mode and primary are now also re-evaluable from the
# screenshot. theme.mode uses multi-sample luminance across the image bands;
# primary re-counts button-shaped regions by colour frequency.
PALETTE_ROLES = ("theme_mode", "primary", "cta", "secondary", "accent", "card_bg", "border", "text", "text_secondary", "background")

# How many palette swatches to extract per region for proposal
PALETTE_K = 8


# ── colour helpers ──────────────────────────────────────────────────────────


def rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    return "#{:02x}{:02x}{:02x}".format(*rgb)


def hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def luminance(rgb: tuple[int, int, int]) -> float:
    """Perceived luminance, 0..255."""
    r, g, b = rgb
    return 0.299 * r + 0.587 * g + 0.114 * b


def saturation(rgb: tuple[int, int, int]) -> float:
    """HSV saturation, 0..1."""
    r, g, b = (c / 255 for c in rgb)
    mx = max(r, g, b)
    mn = min(r, g, b)
    return 0.0 if mx == 0 else (mx - mn) / mx


def is_near_grey(rgb: tuple[int, int, int], threshold: int = 8) -> bool:
    r, g, b = rgb
    return max(r, g, b) - min(r, g, b) <= threshold


def colour_distance(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) ** 0.5


# ── region sampling ─────────────────────────────────────────────────────────


def dominant_colours(region: Image.Image, k: int = PALETTE_K) -> list[tuple[str, int]]:
    """Return up to k (hex, pixel_count) tuples ordered by frequency."""
    if region.mode != "RGB":
        region = region.convert("RGB")
    # Quantize to a small palette, then count occurrences
    quant = region.quantize(colors=k, method=Image.Quantize.MAXCOVERAGE)
    palette = quant.getpalette() or []
    counts = quant.getcolors() or []
    out: list[tuple[str, int]] = []
    for count, idx in counts:
        r, g, b = palette[idx * 3 : idx * 3 + 3]
        out.append((rgb_to_hex((r, g, b)), count))
    out.sort(key=lambda x: x[1], reverse=True)
    return out


def crop_region(img: Image.Image, role: str) -> Image.Image:
    """Return the canonical sub-image for a given semantic region."""
    w, h = img.size
    if role == "nav":
        # Top 80px, full width — likely contains nav/brand wash
        return img.crop((0, 0, w, min(80, h)))
    if role == "hero":
        # Below nav, above the fold (estimate fold ~ 0.5*h or 900px, whichever smaller)
        top = min(80, h)
        bottom = min(int(h * 0.45), top + 900)
        return img.crop((0, top, w, bottom))
    if role == "body":
        # Middle band — primary text region
        top = int(h * 0.30)
        bottom = int(h * 0.65)
        # 60% centre column to avoid sidebar/nav noise
        left = int(w * 0.20)
        right = int(w * 0.80)
        return img.crop((left, top, right, bottom))
    if role == "full":
        return img
    raise ValueError(f"unknown region: {role}")


# ── role inference from palette ─────────────────────────────────────────────


def pick_brand_wash(nav_palette: list[tuple[str, int]], body_bg_hex: str | None) -> str | None:
    """Most common nav-band colour distinct from the body bg."""
    for hx, _ in nav_palette:
        if hx == body_bg_hex:
            continue
        # Skip near-pure-white only on dark themes — light themes legitimately use white nav
        return hx
    return nav_palette[0][0] if nav_palette else None


def pick_theme_mode_from_image(img: Image.Image) -> tuple[str, dict]:
    """Multi-sample luminance vote on the screenshot itself (fix #17 → #14).
    Sample 5 horizontal bands, weight by area, majority luminance wins.
    Returns (mode, evidence)."""
    if img.mode != "RGB":
        img = img.convert("RGB")
    w, h = img.size
    bands = [
        (0, int(h * 0.05), w, int(h * 0.20)),   # near-top, below nav
        (0, int(h * 0.25), w, int(h * 0.40)),   # upper-mid
        (0, int(h * 0.45), w, int(h * 0.60)),   # middle
        (0, int(h * 0.65), w, int(h * 0.80)),   # lower-mid
        (0, int(h * 0.82), w, int(h * 0.95)),   # near-bottom, above footer
    ]
    light_pixels = 0
    dark_pixels = 0
    band_lums = []
    for box in bands:
        crop = img.crop(box)
        # Resize to small thumb for fast averaging
        crop = crop.resize((40, 30))
        pixels = list(crop.getdata())
        for r, g, b in pixels:
            lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
            if lum > 0.5:
                light_pixels += 1
            else:
                dark_pixels += 1
        # Per-band average for evidence
        avg_lum = sum((0.299 * r + 0.587 * g + 0.114 * b) / 255 for r, g, b in pixels) / len(pixels)
        band_lums.append(round(avg_lum, 3))
    total = light_pixels + dark_pixels or 1
    light_share = light_pixels / total
    mode = "light" if light_share >= 0.5 else "dark"
    evidence = {
        "light_pixel_share": round(light_share, 3),
        "band_avg_luminance": band_lums,
        "samples": total,
    }
    return mode, evidence


def pick_primary_button_from_image(
    hero_palette: list[tuple[str, int]],
    body_bg_hex: str | None,
    theme_mode: str,
) -> str | None:
    """Re-rank hero-band colours for primary-button likelihood (fix #17 → #15).
    Filters: skip body bg, skip near-grey, skip near-white/near-black on
    matching theme. Score = pixel_share × saturation × distance-from-bg.
    Mid-saturation dark/colourful blocks score highest."""
    body_bg_rgb = hex_to_rgb(body_bg_hex) if body_bg_hex else None
    total = sum(c for _, c in hero_palette) or 1
    best: tuple[float, str] | None = None
    for hx, count in hero_palette:
        if hx == body_bg_hex:
            continue
        rgb = hex_to_rgb(hx)
        if is_near_grey(rgb, threshold=15):
            # near-grey OK only if theme is opposite (dark grey buttons on
            # light theme = primary CTA candidate). Allow near-black on
            # light theme; near-white on dark theme.
            lum = luminance(rgb)
            if theme_mode == "light" and lum > 60:
                continue
            if theme_mode == "dark" and lum < 195:
                continue
        share = count / total
        if share < 0.005:
            continue
        sat = saturation(rgb)
        # Distance from body bg — buttons need to contrast
        dist = colour_distance(rgb, body_bg_rgb) / 442 if body_bg_rgb else 0.5
        score = share * (0.5 + sat) * (0.5 + dist)
        if best is None or score > best[0]:
            best = (score, hx)
    return best[1] if best else None


def pick_cta(hero_palette: list[tuple[str, int]], body_bg: str | None, exclude: set[str]) -> str | None:
    """Most saturated mid-tone colour in hero region with material pixel count.
    Excludes near-grey, near-black, and near-white — CTAs are vibrant mid-tones."""
    best: tuple[float, str] | None = None
    total = sum(c for _, c in hero_palette) or 1
    for hx, count in hero_palette:
        if hx in exclude:
            continue
        rgb = hex_to_rgb(hx)
        if is_near_grey(rgb):
            continue
        lum = luminance(rgb)
        if lum < 40 or lum > 240:  # strip near-black/near-white card bgs
            continue
        sat = saturation(rgb)
        share = count / total
        if share < 0.005:
            continue
        score = sat * (share ** 0.25)
        if best is None or score > best[0]:
            best = (score, hx)
    return best[1] if best else None


def pick_text(body_palette: list[tuple[str, int]], theme_mode: str) -> str | None:
    """Darkest near-grey on light theme; lightest near-grey on dark theme."""
    candidates = [(hx, count) for hx, count in body_palette if is_near_grey(hex_to_rgb(hx), threshold=20)]
    if not candidates:
        return None
    if theme_mode == "dark":
        candidates.sort(key=lambda x: luminance(hex_to_rgb(x[0])), reverse=True)
    else:
        candidates.sort(key=lambda x: luminance(hex_to_rgb(x[0])))
    return candidates[0][0]


def pick_text_secondary(
    body_palette: list[tuple[str, int]],
    text_main: str | None,
    body_bg: str | None,
    theme_mode: str,
) -> str | None:
    """Mid-tone grey distinct from both text_main and body_bg."""
    text_main_rgb = hex_to_rgb(text_main) if text_main else None
    body_bg_rgb = hex_to_rgb(body_bg) if body_bg else None
    candidates = []
    for hx, count in body_palette:
        rgb = hex_to_rgb(hx)
        if not is_near_grey(rgb, threshold=20):
            continue
        if text_main_rgb and colour_distance(rgb, text_main_rgb) < 25:
            continue
        if body_bg_rgb and colour_distance(rgb, body_bg_rgb) < 30:
            continue
        candidates.append((hx, count, luminance(rgb)))
    if not candidates:
        return None
    # Pick the candidate closest to halfway between text_main and body_bg
    if text_main_rgb and body_bg_rgb:
        target = (luminance(text_main_rgb) + luminance(body_bg_rgb)) / 2
        candidates.sort(key=lambda x: abs(x[2] - target))
        return candidates[0][0]
    # Fallback: mid-luminance pick
    candidates.sort(key=lambda x: x[2])
    return candidates[len(candidates) // 2][0]


# ── tokens.json + confidence.md round-trip ──────────────────────────────────


def load_tokens(slug: str) -> dict:
    path = BRANDS / slug / "tokens.json"
    if not path.exists():
        raise SystemExit(f"tokens.json not found: {path} — run ingest-url.py first")
    return json.loads(path.read_text(encoding="utf-8"))


def save_tokens(slug: str, tokens: dict) -> Path:
    path = BRANDS / slug / "tokens.json"
    path.write_text(json.dumps(tokens, indent=2) + "\n", encoding="utf-8")
    return path


def parse_confidence(slug: str) -> dict[str, dict]:
    """Lift the field|value|source|confidence rows out of ingestion-confidence.md.
    Returns dict keyed by field name with {value, source, confidence}.
    Returns empty dict if file missing or malformed.
    """
    path = BRANDS / slug / "ingestion-confidence.md"
    out: dict[str, dict] = {}
    if not path.exists():
        return out
    rows = re.findall(
        r"^\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*([^|]+)\s*\|\s*(high|medium|low)\s*\|",
        path.read_text(encoding="utf-8"),
        re.MULTILINE,
    )
    for field, value, source, conf in rows:
        out[field] = {"value": value, "source": source.strip(), "confidence": conf.strip()}
    return out


def append_override_log(slug: str, overrides: list[dict], screenshot_path: Path) -> Path:
    """Append a Screenshot Overrides section to ingestion-confidence.md."""
    path = BRANDS / slug / "ingestion-confidence.md"
    if not path.exists():
        # Bootstrap a minimal file if missing
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("---\nrole: ingestion-confidence\n---\n\n", encoding="utf-8")
    body = path.read_text(encoding="utf-8")
    section_marker = "\n## Screenshot Overrides\n"
    if section_marker in body:
        body = body.split(section_marker)[0].rstrip() + "\n"
    lines = [
        "",
        "## Screenshot Overrides",
        "",
        f"Applied {date.today().isoformat()} from `{screenshot_path.name}`.",
        "",
        "| Field | URL value | Screenshot value | Was | Now |",
        "|---|---|---|---|---|",
    ]
    for o in overrides:
        lines.append(
            f"| `{o['field']}` | `{o['url_value']}` | `{o['new_value']}` | "
            f"{o['old_confidence']} | {o['new_confidence']} |"
        )
    path.write_text(body + "\n".join(lines) + "\n", encoding="utf-8")
    return path


# ── orchestration ───────────────────────────────────────────────────────────


def propose_overrides(
    img: Image.Image,
    tokens: dict,
    confidence: dict[str, dict],
    only: set[str] | None,
    skip: set[str],
    auto_medium: bool,
) -> list[dict]:
    """Return a list of override proposals: {field, url_value, new_value, ...}."""
    theme_mode = tokens.get("theme", {}).get("mode", "light")
    body_bg = tokens.get("colors", {}).get("background", {}).get("hex")

    nav_palette = dominant_colours(crop_region(img, "nav"))
    hero_palette = dominant_colours(crop_region(img, "hero"))
    body_palette = dominant_colours(crop_region(img, "body"))

    proposals: list[dict] = []
    colors = tokens.get("colors", {})

    def maybe_propose(field: str, new_value: str | None, source: str):
        if new_value is None:
            return
        role = field.split(".")[-1]
        if role in skip:
            return
        if only and role not in only:
            return
        info = confidence.get(field, {})
        old_conf = info.get("confidence", "low")
        old_value = info.get("value") or colors.get(role, {}).get("hex") or "—"
        # Only override low/medium (or medium when auto_medium); never high
        if old_conf == "high":
            return
        if old_conf == "medium" and not auto_medium and not only:
            # caller can still confirm interactively below
            pass
        if new_value.lower() == str(old_value).lower():
            return  # no change
        proposals.append({
            "field": field,
            "role": role,
            "url_value": old_value,
            "new_value": new_value,
            "old_confidence": old_conf,
            "new_confidence": "high",
            "source": source,
        })

    # ── theme.mode re-evaluation (fix #17 → #14) ──────────────────────
    # Run BEFORE colour proposals so downstream picks use the corrected mode.
    mode_proposal, mode_evidence = pick_theme_mode_from_image(img)
    if mode_proposal != theme_mode:
        # Apply directly to local theme_mode so downstream colour heuristics
        # (text, primary) use the corrected value, not the URL one.
        theme_mode = mode_proposal
        existing_mode = tokens.get("theme", {}).get("mode")
        info = confidence.get("theme.mode", {})
        old_conf = info.get("confidence", "medium")
        # Always include this — flipping theme is foundational
        if "theme_mode" not in skip and (only is None or "theme_mode" in only):
            proposals.append({
                "field": "theme.mode",
                "role": "theme_mode",
                "url_value": existing_mode or "—",
                "new_value": mode_proposal,
                "old_confidence": old_conf,
                "new_confidence": "high",
                "source": f"screenshot multi-band luminance vote (light_share={mode_evidence['light_pixel_share']})",
            })

    # Primary on light themes uses brand-wash; primary on dark themes is the
    # CTA bg (which we re-pick below). Light-theme primary keeps existing logic.
    primary_proposal = (
        pick_brand_wash(nav_palette, body_bg) if theme_mode == "light"
        else pick_primary_button_from_image(hero_palette, body_bg, theme_mode)
    )
    # CTA: full button re-rank from hero band (replaces bare pick_cta which
    # missed near-black buttons on light themes — finding #15)
    cta_proposal = pick_primary_button_from_image(hero_palette, body_bg, theme_mode)
    secondary_proposal = pick_cta(
        hero_palette,
        body_bg,
        exclude={body_bg or "", cta_proposal or "", colors.get("cta", {}).get("hex", "")},
    )
    text_proposal = pick_text(body_palette, theme_mode)
    text_secondary_proposal = pick_text_secondary(body_palette, text_proposal, body_bg, theme_mode)

    maybe_propose("colors.primary", primary_proposal, "screenshot nav-band dominant" if theme_mode == "light" else "screenshot hero-band button re-rank")
    maybe_propose("colors.cta", cta_proposal, "screenshot hero-band button re-rank (frequency × saturation × bg-distance)")
    maybe_propose("colors.secondary", secondary_proposal, "screenshot hero-band 2nd-saturated")
    maybe_propose("colors.text", text_proposal, "screenshot body-band darkest-grey")
    maybe_propose("colors.text_secondary", text_secondary_proposal, "screenshot body-band mid-grey")

    return proposals


def apply_overrides(tokens: dict, proposals: list[dict]) -> int:
    applied = 0
    colors = tokens.setdefault("colors", {})
    slug = tokens.get("brand", "brand")
    for o in proposals:
        role = o["role"]
        # theme.mode goes to tokens.theme.mode, not colors
        if role == "theme_mode":
            tokens.setdefault("theme", {})["mode"] = o["new_value"]
            applied += 1
            continue
        existing = colors.get(role, {})
        token_name = existing.get("token") or f"{slug}-{role.replace('_', '-')}"
        colors[role] = {"token": token_name, "hex": o["new_value"]}
        applied += 1
    return applied


def print_palette_table(label: str, palette: list[tuple[str, int]]) -> None:
    print(f"\n  {label}:", file=sys.stderr)
    total = sum(c for _, c in palette) or 1
    for hx, count in palette:
        share = count / total * 100
        print(f"    {hx}  {share:5.1f}%", file=sys.stderr)


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Refine brand tokens.json from a Shottr full-page screenshot")
    parser.add_argument("--slug", required=True, help="Brand slug under brands/")
    parser.add_argument("--screenshot", required=True, help="Path to the screenshot (PNG/JPG)")
    parser.add_argument("--apply", default="", help="Comma-list of roles to consider (default: all)")
    parser.add_argument("--skip", default="", help="Comma-list of roles to never override")
    parser.add_argument("--auto-medium", action="store_true", help="Auto-apply when URL confidence is medium (default: low only)")
    parser.add_argument("--no-prompt", action="store_true", help="Print proposals only; do not write")
    parser.add_argument("--show-palettes", action="store_true", help="Print the per-region quantised palettes for debugging")
    args = parser.parse_args(argv[1:])

    screenshot_path = Path(args.screenshot).expanduser().resolve()
    if not screenshot_path.exists():
        print(f"screenshot not found: {screenshot_path}", file=sys.stderr)
        return 1

    img = Image.open(screenshot_path).convert("RGB")
    print(f"> loaded {screenshot_path.name} ({img.size[0]}x{img.size[1]})", file=sys.stderr)

    tokens = load_tokens(args.slug)
    confidence = parse_confidence(args.slug)

    only = {r.strip() for r in args.apply.split(",") if r.strip()} or None
    skip = {r.strip() for r in args.skip.split(",") if r.strip()}

    if args.show_palettes:
        print_palette_table("nav band (top 80px)", dominant_colours(crop_region(img, "nav")))
        print_palette_table("hero band", dominant_colours(crop_region(img, "hero")))
        print_palette_table("body band (centre 60%)", dominant_colours(crop_region(img, "body")))

    proposals = propose_overrides(img, tokens, confidence, only, skip, args.auto_medium)

    if not proposals:
        print("\nNo overrides proposed (all eligible fields already high-confidence or unchanged).")
        return 0

    print("\nProposed overrides:")
    print(f"  {'field':<25} {'old':<10} {'new':<10}  source")
    print(f"  {'-' * 25} {'-' * 10} {'-' * 10}  ------")
    for o in proposals:
        print(f"  {o['field']:<25} {o['url_value']:<10} {o['new_value']:<10}  {o['source']}  [{o['old_confidence']} → high]")

    if args.no_prompt:
        print("\n(--no-prompt: proposals printed, no changes written)")
        return 0

    confirm = input("\nApply these overrides? [y/N] ").strip().lower()
    if confirm != "y":
        print("Skipped — tokens.json unchanged.")
        return 0

    n = apply_overrides(tokens, proposals)
    tokens_path = save_tokens(args.slug, tokens)
    log_path = append_override_log(args.slug, proposals, screenshot_path)
    print(f"\n  applied {n} override(s)")
    print(f"  wrote {tokens_path.relative_to(ROOT)}")
    print(f"  wrote {log_path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
