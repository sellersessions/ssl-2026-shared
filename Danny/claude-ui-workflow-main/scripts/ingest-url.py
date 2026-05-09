#!/usr/bin/env python3
"""Brand ingestion (URL mode) — orchestrator.

Calls scripts/extract-brand.mjs against a URL, then maps the raw signal into
the tokens.json schema + a profile.md + an ingestion-confidence.md.

Usage:
    python3 scripts/ingest-url.py <url> --slug <new-slug>
    python3 scripts/ingest-url.py https://sellersessions.com --slug sellersessions-derived
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BRANDS = ROOT / "brands"
EXTRACTOR = ROOT / "scripts" / "extract-brand.mjs"

# ── helpers ────────────────────────────────────────────────────────────────


def near_white(hex_value: str | None) -> bool:
    if not hex_value or not hex_value.startswith("#") or len(hex_value) != 7:
        return False
    r, g, b = int(hex_value[1:3], 16), int(hex_value[3:5], 16), int(hex_value[5:7], 16)
    return min(r, g, b) > 245


def near_black(hex_value: str | None) -> bool:
    if not hex_value or not hex_value.startswith("#") or len(hex_value) != 7:
        return False
    r, g, b = int(hex_value[1:3], 16), int(hex_value[3:5], 16), int(hex_value[5:7], 16)
    return max(r, g, b) < 20


def hex_distance(a: str, b: str) -> float:
    if not a or not b or not a.startswith("#") or not b.startswith("#"):
        return 9999
    ar, ag, ab = int(a[1:3], 16), int(a[3:5], 16), int(a[5:7], 16)
    br, bg, bb = int(b[1:3], 16), int(b[3:5], 16), int(b[5:7], 16)
    return ((ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2) ** 0.5


def first_non_system_font(font_string: str | None) -> str | None:
    if not font_string:
        return None
    SYSTEM = {
        "-apple-system", "BlinkMacSystemFont", "system-ui", "Segoe UI",
        "Roboto", "Helvetica Neue", "Helvetica", "Arial", "sans-serif",
        "serif", "monospace",
    }
    for tok in font_string.split(","):
        clean = tok.strip().strip('"').strip("'")
        if clean and clean not in SYSTEM:
            return clean
    return None


# ── extraction ─────────────────────────────────────────────────────────────


def run_extractor(url: str) -> dict:
    proc = subprocess.run(
        ["node", str(EXTRACTOR), url, "--json"],
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        raise SystemExit(f"extractor failed: {proc.stderr}")
    return json.loads(proc.stdout)


# ── signal → tokens mapping ────────────────────────────────────────────────


def map_to_tokens(signal: dict, slug: str) -> tuple[dict, dict]:
    """Return (tokens_dict, confidence_dict)."""
    tokens: dict = {
        "brand": slug,
        "version": "1",
        "generated_at": date.today().isoformat(),
        "source": f"ingested from {signal['identity']['hostname']}",
    }
    confidence: dict = {}

    # ── identity ─────────────────────────────────────────────
    ident = signal.get("identity", {})
    name = ident.get("og_site_name") or ident.get("og_title") or ident.get("title", "").split(" | ")[0].split(" - ")[0]
    domain = ident.get("hostname", "").lstrip("www.")
    tokens["identity"] = {"name": name, "domain": domain}
    confidence["identity.name"] = {
        "value": name,
        "source": "og:site_name" if ident.get("og_site_name") else "og:title or <title>",
        "confidence": "high" if ident.get("og_site_name") else "medium",
    }
    confidence["identity.domain"] = {"value": domain, "source": "location.hostname", "confidence": "high"}

    # ── theme ────────────────────────────────────────────────
    mode = signal.get("theme_mode", "light")
    tokens["theme"] = {"mode": mode}
    # Confidence reflects whether the multi-sample area-weighted vote was
    # decisive. If light_area and dark_area are within 20% of each other,
    # mark medium so screenshot-assist can verify (fix #14).
    mode_source = signal.get("theme_mode_source", "body bg luminance")
    mode_evidence = signal.get("theme_mode_evidence") or {}
    light_area = mode_evidence.get("light_area", 0)
    dark_area = mode_evidence.get("dark_area", 0)
    total_area = light_area + dark_area
    if total_area > 0:
        winner_share = max(light_area, dark_area) / total_area
        mode_conf = "high" if winner_share >= 0.7 else "medium"
    else:
        mode_conf = "medium"  # only single-sample fallback; verify
    confidence["theme.mode"] = {
        "value": mode,
        "source": mode_source,
        "confidence": mode_conf,
    }

    # ── colours ──────────────────────────────────────────────
    colors: dict = {}
    body_bg = signal.get("body_bg_hex")
    cta = (signal.get("primary_button") or {}).get("bg_hex")
    section_bgs = [s for s in (signal.get("section_bgs") or []) if not s.get("is_image") and s.get("bg", "").startswith("rgb")]
    section_bg_hexes = []
    for s in section_bgs:
        # convert rgb() to hex for comparison
        m = re.match(r"rgba?\((\d+),\s*(\d+),\s*(\d+)", s["bg"])
        if m:
            r, g, b = (int(x) for x in m.groups())
            hx = "#{:02x}{:02x}{:02x}".format(r, g, b)
            section_bg_hexes.append(hx)

    if body_bg:
        colors["background"] = {"token": f"{slug}-bg", "hex": body_bg}
        confidence["colors.background"] = {"value": body_bg, "source": "body computed bg", "confidence": "high"}

    # Brand wash detection (light themes): first section bg distinct from body, not near-white
    brand_wash = None
    for hx in section_bg_hexes:
        if hx == body_bg:
            continue
        if near_white(hx) and mode == "light":
            continue
        if near_black(hx) and mode == "dark":
            continue
        brand_wash = hx
        break

    # Role mapping: primary vs cta
    if mode == "dark":
        # On dark themes the primary brand colour usually IS the CTA (and the
        # button-distribution distinguishes primary from accent).
        primary = cta
        cta_final = cta
        if primary:
            colors["primary"] = {"token": f"{slug}-primary", "hex": primary}
            confidence["colors.primary"] = {
                "value": primary,
                "source": "primary button bg (dark theme heuristic)",
                "confidence": "high",
            }
        if cta_final:
            colors["cta"] = {"token": f"{slug}-cta", "hex": cta_final}
            confidence["colors.cta"] = {"value": cta_final, "source": "primary button bg", "confidence": "high"}
    else:
        # On light themes the primary brand "wash" is a pale section bg
        # distinct from white; the CTA is the saturated button colour.
        primary = brand_wash or cta
        if primary:
            colors["primary"] = {"token": f"{slug}-primary", "hex": primary}
            confidence["colors.primary"] = {
                "value": primary,
                "source": "first non-white section bg" if brand_wash else "fallback to button bg",
                "confidence": "medium" if brand_wash else "low",
            }
        if cta:
            colors["cta"] = {"token": f"{slug}-cta", "hex": cta}
            confidence["colors.cta"] = {"value": cta, "source": "primary button bg", "confidence": "high"}

    # Secondary: second non-bg non-white section bg, OR second button colour
    second_section = None
    for hx in section_bg_hexes[1:]:
        if hx in (body_bg, primary):
            continue
        if near_white(hx) and mode == "light":
            continue
        second_section = hx
        break
    if second_section:
        colors["secondary"] = {"token": f"{slug}-secondary", "hex": second_section}
        confidence["colors.secondary"] = {"value": second_section, "source": "second section bg", "confidence": "medium"}
    else:
        # try second button
        for entry in signal.get("button_bg_distribution_hex", [])[1:]:
            if entry.get("hex") and entry["hex"] != cta:
                colors["secondary"] = {"token": f"{slug}-secondary", "hex": entry["hex"]}
                confidence["colors.secondary"] = {
                    "value": entry["hex"],
                    "source": "second-most-common button bg",
                    "confidence": "low",
                }
                break

    # Text colours from body text scan, excluding link colour (often = CTA)
    body_colors = signal.get("body_text_colors_hex", [])
    candidates = [
        e["hex"] for e in body_colors
        if e.get("hex") and e["hex"] != cta
    ]
    text_main = candidates[0] if candidates else None

    # text_secondary: pick the lightest (highest min-channel) hex distinct
    # from text_main but not pure white — that's the "soft text" tier.
    def brightness(h: str) -> int:
        if not h or len(h) != 7:
            return -1
        return min(int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16))

    text_secondary_candidates = [
        h for h in candidates
        if h and h != text_main and brightness(h) < 250  # exclude pure-white
    ]
    text_secondary = max(text_secondary_candidates, key=brightness, default=None) if mode == "dark" else (
        min(text_secondary_candidates, key=brightness, default=None)
    )

    if text_main:
        colors["text"] = {"token": f"{slug}-text", "hex": text_main}
        confidence["colors.text"] = {"value": text_main, "source": "most common body text colour (excl. links)", "confidence": "high"}
    if text_secondary:
        colors["text_secondary"] = {"token": f"{slug}-text-secondary", "hex": text_secondary}
        confidence["colors.text_secondary"] = {"value": text_secondary, "source": "lightest non-white body text colour", "confidence": "medium"}

    # Card bg: prefer card-class match, fall back to most common non-bg container bg
    card_bg = None
    card_source = None
    for entry in signal.get("card_bgs_hex", []):
        hx = entry.get("hex")
        if not hx or hx == body_bg:
            continue
        card_bg = hx
        card_source = "most common .card-like container bg"
        break
    if not card_bg:
        for entry in signal.get("all_container_bgs_hex", []):
            hx = entry.get("hex")
            if not hx or hx == body_bg:
                continue
            if near_white(hx) and mode == "light":
                continue
            if near_black(hx) and mode == "dark":
                # only allow if not equal to body_bg (already filtered)
                pass
            # don't reuse primary or secondary
            if hx in {c.get("hex") for c in colors.values()}:
                continue
            card_bg = hx
            card_source = "most common container background distinct from body"
            break
    if card_bg and card_bg not in {c.get("hex") for c in colors.values()}:
        colors["card_bg"] = {"token": f"{slug}-card-bg", "hex": card_bg}
        confidence["colors.card_bg"] = {"value": card_bg, "source": card_source, "confidence": "medium"}

    # Border colour
    border = None
    for entry in signal.get("border_colors_hex", []):
        hx = entry.get("hex")
        if not hx or hx == body_bg:
            continue
        if hx in {c.get("hex") for c in colors.values()}:
            continue
        border = hx
        break
    if border:
        colors["border"] = {"token": f"{slug}-border", "hex": border}
        confidence["colors.border"] = {"value": border, "source": "most common rendered border colour", "confidence": "medium"}

    # Accent: second button bg distinct from cta — likely sale chip / secondary CTA / gold
    accent = None
    for entry in signal.get("button_bg_distribution_hex", []):
        hx = entry.get("hex")
        if not hx or hx == cta:
            continue
        if near_white(hx) or near_black(hx):
            continue
        accent = hx
        break
    if accent and accent not in {c.get("hex") for c in colors.values()}:
        colors["accent"] = {"token": f"{slug}-accent", "hex": accent}
        confidence["colors.accent"] = {"value": accent, "source": "second-most-common button bg", "confidence": "medium"}

    tokens["colors"] = colors

    # ── decorative_palette / texture / line_work / photography_direction ──
    # Fix #16: schema slots that previously had no home. URL ingestion fills
    # what it can heuristically; remainder marked low/medium confidence so
    # screenshot-assist or manual review can complete them.
    decorative: list[str] = []
    used_hexes = {c.get("hex") for c in colors.values() if c.get("hex")}
    # Source 1: SVG fill/stroke colours (petal motifs, illustrative line-work)
    for entry in signal.get("svg_decorative_colors", []):
        hx = entry.get("hex")
        if not hx or hx in used_hexes:
            continue
        decorative.append(hx)
        used_hexes.add(hx)
        if len(decorative) >= 6:
            break
    # Source 2: container bgs that aren't body/primary/cta/accent and have
    # meaningful saturation. Section washes, illustration backgrounds, blurs.
    if len(decorative) < 6:
        for entry in signal.get("all_container_bgs_hex", []):
            hx = entry.get("hex")
            if not hx or hx in used_hexes or hx == body_bg:
                continue
            if near_white(hx) or near_black(hx):
                continue
            r, g, b = int(hx[1:3], 16), int(hx[3:5], 16), int(hx[5:7], 16)
            if max(r, g, b) - min(r, g, b) < 25:
                continue
            decorative.append(hx)
            used_hexes.add(hx)
            if len(decorative) >= 6:
                break
    tokens["decorative_palette"] = decorative
    confidence["decorative_palette"] = {
        "value": ",".join(decorative) if decorative else "(empty)",
        "source": "saturated container bgs distinct from core palette",
        "confidence": "medium" if decorative else "low",
    }

    # Texture: signal from extract-brand.mjs bg_image_signal block (data-URI
    # bg-images on large containers usually = noise/grain textures). Falls
    # back to "gradient" if any bg-image present, "solid" otherwise.
    bg_sig = signal.get("bg_image_signal") or {}
    has_bg_image = bg_sig.get("total", 0) > 0
    likely_texture = bg_sig.get("likely_texture", False)
    if likely_texture:
        texture_type = "noise"
        texture_intensity = 0.3
        texture_notes = "data-URI bg-image detected on large containers — likely noise/grain overlay"
        texture_conf = "medium"
    elif has_bg_image:
        texture_type = "gradient"
        texture_intensity = 0.2
        texture_notes = "background-image present (gradient or photo) — verify via screenshot"
        texture_conf = "low"
    else:
        texture_type = "solid"
        texture_intensity = 0.0
        texture_notes = "no bg-image signal detected"
        texture_conf = "medium"
    tokens["texture"] = {
        "type": texture_type,
        "intensity": texture_intensity,
        "notes": texture_notes,
    }
    confidence["texture"] = {
        "value": texture_type,
        "source": "bg_image_signal heuristic",
        "confidence": texture_conf,
    }

    # line_work: cannot be derived from URL alone — requires image inspection
    # of SVGs / illustrations. Stub with style="none" and let screenshot-assist
    # or manual review fill it.
    tokens["line_work"] = {"style": "none"}
    confidence["line_work"] = {
        "value": "none",
        "source": "stub — not derivable from URL",
        "confidence": "low",
    }

    # photography_direction: stub with empty string. Could heuristically
    # sample <img> alt text or filenames in v3, but URL-only is too noisy.
    tokens["photography_direction"] = ""
    confidence["photography_direction"] = {
        "value": "(empty)",
        "source": "stub — not derivable from URL",
        "confidence": "low",
    }

    # ── typography ───────────────────────────────────────────
    typo: dict = {}
    heading_fonts = signal.get("heading_fonts", [])
    body_fonts = signal.get("body_fonts", [])
    if heading_fonts:
        typo["headings"] = {"font": heading_fonts[0]["font"], "weight_range": [500, 800]}
        confidence["typography.headings"] = {"value": heading_fonts[0]["font"], "source": "h1-h3 dominant font", "confidence": "high"}
    if body_fonts:
        typo["body"] = {"font": body_fonts[0]["font"], "weight_range": [400, 600]}
        confidence["typography.body"] = {"value": body_fonts[0]["font"], "source": "p/li dominant non-system font", "confidence": "high" if len(body_fonts) > 0 else "low"}
    btn = signal.get("primary_button") or {}
    btn_font = first_non_system_font(btn.get("font"))
    if btn_font:
        typo["buttons"] = {"font": btn_font, "weight_range": [500, 700]}
        confidence["typography.buttons"] = {"value": btn_font, "source": "primary button computed font", "confidence": "high"}

    # Google Fonts URL — pick the longest one if multiple
    g_links = signal.get("google_fonts_links", [])
    if g_links:
        typo["google_fonts_url"] = max(g_links, key=len)
        confidence["typography.google_fonts_url"] = {
            "value": typo["google_fonts_url"],
            "source": "<link> stylesheet",
            "confidence": "high",
        }

    tokens["typography"] = typo

    return tokens, confidence


# ── confidence report ──────────────────────────────────────────────────────


def write_confidence(slug: str, confidence: dict, signal: dict) -> Path:
    lines = [
        "---",
        f"project: claude-ui-workflow",
        f"role: ingestion-confidence",
        f"slug: {slug}",
        f"generated_at: {date.today().isoformat()}",
        f"source_url: https://{signal['identity']['hostname']}",
        "---",
        "",
        f"# Ingestion confidence — `{slug}`",
        "",
        "Per-field source + confidence for the derived `tokens.json`. Review",
        "anything marked `low` before locking the brand profile.",
        "",
        "| Field | Value | Source | Confidence | Action |",
        "|---|---|---|---|---|",
    ]
    for field, info in confidence.items():
        action = {
            "high": "—",
            "medium": "review on a screenshot",
            "low": "**confirm**: drop a Shottr full-page screenshot",
        }[info["confidence"]]
        value = info["value"]
        if isinstance(value, str) and len(value) > 60:
            value = value[:57] + "…"
        lines.append(f"| `{field}` | `{value}` | {info['source']} | {info['confidence']} | {action} |")
    lines.append("")
    lines.append("## Screenshot assist")
    lines.append("")
    lines.append("If any row above is `low` confidence (typically primary brand wash on")
    lines.append("light themes, or secondary palette colours), capture a Shottr full-page")
    lines.append("of the homepage (`Ctrl+1` for full, `Ctrl+2` for area) and save under")
    lines.append(f"`brands/{slug}/_captures/`. The brand-ingest screenshot mode (B4) will")
    lines.append("sample colours at fixed regions (nav strip, hero, primary button) to")
    lines.append("disambiguate role assignments that the URL pass got wrong.")
    out = BRANDS / slug / "ingestion-confidence.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return out


# ── profile.md generation ──────────────────────────────────────────────────


def write_profile_md(slug: str, tokens: dict, signal: dict) -> Path:
    ident = tokens["identity"]
    theme = tokens["theme"]
    colors = tokens["colors"]
    typo = tokens["typography"]
    description = signal["identity"].get("description") or "<<add description>>"

    lines = [
        f"# {ident['name']} Brand Profile",
        "",
        "> Auto-derived by `scripts/ingest-url.py`. Review the `<<review>>`",
        "> blocks below — those are sections that can't be derived from the URL",
        "> alone (animation philosophy, anti-patterns, page structure).",
        "",
        "## Identity",
        f"- **Project:** {ident['name']}",
        f"- **Domain:** {ident['domain']}",
        f"- **Description:** {description}",
        f"- **Deploy:** <<review — platform unknown from URL>>",
        f"- **Design system:** —",
        "",
        "## Theme",
        f"- **Mode:** {theme['mode']}",
        f"- **Style:** <<review — derive from screenshot/feel>>",
        f"- **Mood:** <<review — 3 adjectives>>",
        "",
        "## Colours",
        "| Role | Token | Hex |",
        "|------|-------|-----|",
    ]
    for role, info in colors.items():
        lines.append(f"| {role.replace('_', ' ').title()} | `{info['token']}` | `{info['hex']}` |")
    lines.extend([
        "",
        "## Typography",
        "| Role | Font | Weight range |",
        "|------|------|-------------|",
    ])
    for role, info in typo.items():
        if role == "google_fonts_url":
            continue
        wr = info.get("weight_range", [])
        wr_str = f"{wr[0]}-{wr[1]}" if len(wr) == 2 else ""
        lines.append(f"| {role.title()} | {info['font']} | {wr_str} |")
    if "google_fonts_url" in typo:
        lines.extend(["", f"Google Fonts URL: `{typo['google_fonts_url']}`"])
    lines.extend([
        "",
        "## Key Effects",
        "- <<review — derive from screenshot or design notes>>",
        "",
        "## Page Structure",
        "- <<review — section order from screenshot>>",
        "",
        "## Image Constraints",
        f"- {'Dark backgrounds preferred' if theme['mode'] == 'dark' else 'Light/white backgrounds dominant'}",
        "- <<review — stock photography rules>>",
        "- Append `No text` to all image prompts",
        "",
        "## Animation Preferences",
        "- <<review — derive from live page motion>>",
        "",
        "## Performance Budget",
        "- LCP target: < 2.5s",
        "- CLS target: < 0.1",
        "- Bundle target: < 200KB gzipped JS",
        "",
        "## Anti-Patterns",
        "- <<review — what to avoid for this brand>>",
        "",
    ])
    out = BRANDS / slug / "profile.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines), encoding="utf-8")
    return out


# ── main ───────────────────────────────────────────────────────────────────


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Ingest a URL into a brand profile + tokens.json")
    parser.add_argument("url", help="URL of the homepage to ingest")
    parser.add_argument("--slug", required=True, help="Folder slug under brands/")
    parser.add_argument("--keep-signal", action="store_true", help="Save raw extractor JSON next to outputs")
    args = parser.parse_args(argv[1:])

    print(f"> running extractor against {args.url}", file=sys.stderr)
    signal = run_extractor(args.url)

    tokens, confidence = map_to_tokens(signal, args.slug)
    out_dir = BRANDS / args.slug
    out_dir.mkdir(parents=True, exist_ok=True)

    tokens_path = out_dir / "tokens.json"
    tokens_path.write_text(json.dumps(tokens, indent=2) + "\n", encoding="utf-8")
    print(f"  wrote {tokens_path.relative_to(ROOT)}")

    profile_path = write_profile_md(args.slug, tokens, signal)
    print(f"  wrote {profile_path.relative_to(ROOT)}")

    confidence_path = write_confidence(args.slug, confidence, signal)
    print(f"  wrote {confidence_path.relative_to(ROOT)}")

    if args.keep_signal:
        signal_path = out_dir / "_signal.json"
        signal_path.write_text(json.dumps(signal, indent=2) + "\n", encoding="utf-8")
        print(f"  wrote {signal_path.relative_to(ROOT)}")

    # ── screenshot-assist hint (B4) ──────────────────────────────────────
    weak = [f for f, info in confidence.items() if info["confidence"] in ("low", "medium")]
    if weak:
        print("", file=sys.stderr)
        print("⚠ Low/medium confidence fields:", ", ".join(weak), file=sys.stderr)
        print("", file=sys.stderr)
        print("  Screenshot assist (B4) can disambiguate. Capture a Shottr full-page", file=sys.stderr)
        print(f"  of {args.url} (Ctrl+1 = full, Ctrl+2 = area), then run:", file=sys.stderr)
        print("", file=sys.stderr)
        print(
            f"    python3 scripts/refine-from-screenshot.py --slug {args.slug} --screenshot <path>",
            file=sys.stderr,
        )
        print("", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
