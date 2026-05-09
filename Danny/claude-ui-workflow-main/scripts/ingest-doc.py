#!/usr/bin/env python3
"""Brand ingestion (doc mode, B5).

Input: a markdown or plain-text style guide.
Output: brands/<slug>/{tokens.json, profile.md, ingestion-confidence.md}.

Two-pass parser:
  1. Strict pass — if the doc follows our canonical shape (## Identity,
     ## Theme, ## Colours table, ## Typography table) we lift directly with
     the same machinery as scripts/emit-tokens.py. Confidence: high.
  2. Fuzzy pass — fallback for free-form style guides. Hex codes are scanned
     with line context and assigned to roles via keyword classifier.
     Fonts are detected from "font", "typeface", and CSS font-family lines.
     Confidence: medium / low depending on how strong the role signal is.

PDF / docx are intentionally NOT supported — convert to markdown via Claude
Desktop first, then run this. Keeps the parser focused.

Usage:
    python3 scripts/ingest-doc.py <path> --slug <new-slug>
    python3 scripts/ingest-doc.py brands/sellersessions/profile.md --slug sellersessions-doc-derived
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BRANDS = ROOT / "brands"

HEX_RE = re.compile(r"#[0-9a-fA-F]{6}\b")

# Role keyword → canonical role. First-match wins; longer phrases first.
ROLE_KEYWORDS: list[tuple[str, str]] = [
    ("text tertiary", "text_tertiary"),
    ("tertiary text", "text_tertiary"),
    ("text secondary", "text_secondary"),
    ("secondary text", "text_secondary"),
    ("subtext", "text_secondary"),
    ("muted text", "text_secondary"),
    ("call to action", "cta"),
    ("call-to-action", "cta"),
    ("card bg", "card_bg"),
    ("card background", "card_bg"),
    ("surface", "card_bg"),
    ("background", "background"),
    ("primary", "primary"),
    ("secondary", "secondary"),
    ("cta", "cta"),
    ("button", "cta"),
    ("accent orange", "accent_orange"),
    ("accent gold", "accent_gold"),
    ("accent", "accent"),
    ("border", "border"),
    ("divider", "border"),
    ("outline", "border"),
    ("body text", "text"),
    ("paragraph", "text"),
    ("text", "text"),
    ("bg", "background"),
]

FONT_ROLE_KEYWORDS: list[tuple[str, str]] = [
    ("heading", "headings"),
    ("headline", "headings"),
    ("display", "headings"),
    ("title", "headings"),
    ("h1", "headings"),
    ("body", "body"),
    ("paragraph", "body"),
    ("default", "body"),
    ("button", "buttons"),
    ("cta", "buttons"),
    ("monospace", "monospace"),
    ("mono", "monospace"),
    ("code", "monospace"),
]


def slugify_role(role: str) -> str:
    s = role.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "_", s)
    return s.strip("_")


def luminance_hex(hx: str) -> float:
    h = hx.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return 0.299 * r + 0.587 * g + 0.114 * b


_SORTED_ROLE_KEYWORDS = sorted(ROLE_KEYWORDS, key=lambda kv: -len(kv[0]))
_SORTED_FONT_ROLE_KEYWORDS = sorted(FONT_ROLE_KEYWORDS, key=lambda kv: -len(kv[0]))


def classify_role(context: str) -> str | None:
    """Pick the most specific role keyword present in the context line.
    Multi-word labels are checked before single-word so that 'body text'
    beats 'primary' when both appear (e.g. 'Body text — primary copy')."""
    lc = context.lower()
    for needle, role in _SORTED_ROLE_KEYWORDS:
        if needle in lc:
            return role
    return None


def classify_font_role(context: str) -> str | None:
    lc = context.lower()
    for needle, role in _SORTED_FONT_ROLE_KEYWORDS:
        if needle in lc:
            return role
    return None


# ── strict pass (canonical-shape docs) ──────────────────────────────────────


def section_index(lines: list[str], heading: str) -> int:
    target = f"## {heading}".lower()
    for i, line in enumerate(lines):
        s = line.strip().lower()
        if s == target or s.startswith(target + " "):
            return i
    return -1


def parse_table(lines: list[str], start: int) -> tuple[list[list[str]], int]:
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


def strict_identity(lines: list[str]) -> dict:
    out: dict = {}
    i = section_index(lines, "Identity")
    if i < 0:
        return out
    for line in lines[i + 1 : i + 12]:
        s = line.strip()
        if s.startswith("##"):
            break
        m = re.match(r"-\s*\*\*(\w+):\*\*\s*(.+)", s)
        if not m:
            continue
        key, value = m.group(1).lower(), m.group(2).strip()
        if key == "project":
            out["name"] = re.split(r"\s*\(", value, maxsplit=1)[0].strip()
        elif key == "domain":
            out["domain"] = value.replace("https://", "").replace("http://", "").rstrip("/")
    return out


def strict_theme(lines: list[str]) -> dict:
    out: dict = {}
    i = section_index(lines, "Theme")
    if i < 0:
        return out
    for line in lines[i + 1 : i + 12]:
        s = line.strip()
        if s.startswith("##"):
            break
        m = re.match(r"-\s*\*\*(\w+):\*\*\s*(.+)", s)
        if not m:
            continue
        key, value = m.group(1).lower(), m.group(2).strip()
        if key == "mode":
            out["mode"] = value.lower().split()[0]
        elif key == "style":
            out["style"] = value
        elif key == "mood":
            out["mood"] = [s.strip().lower() for s in value.split(",")]
    return out


def strict_colors(lines: list[str]) -> dict:
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


def strict_typography(lines: list[str]) -> dict:
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
            out["google_fonts_url"] = m.group(1).strip("`").strip()
            break
    return out


# ── fuzzy pass (free-form style guides) ─────────────────────────────────────


def fuzzy_colors(lines: list[str], slug: str) -> tuple[dict, dict]:
    """Return (colors_dict, per_field_confidence_dict)."""
    out: dict = {}
    conf: dict = {}
    seen_roles: set[str] = set()
    for idx, line in enumerate(lines):
        for m in HEX_RE.finditer(line):
            hx = m.group(0).lower()
            # Classify the current line first to avoid prev-line role bleed.
            # Only fall back to prev-line context if the current line has no role keyword.
            role = classify_role(line)
            if role is None:
                prev = lines[idx - 1] if idx > 0 else ""
                role = classify_role(prev)
                source_context = "prev-line"
            else:
                source_context = "same-line"
            if role is None:
                continue
            if role in seen_roles:
                continue
            seen_roles.add(role)
            out[role] = {"token": f"{slug}-{role.replace('_', '-')}", "hex": hx}
            # Confidence: high when the role label is on the same line as the hex.
            conf[f"colors.{role}"] = {
                "value": hx,
                "source": f"fuzzy doc-scan ({source_context}): '{role.replace('_', ' ')}' near {hx}",
                "confidence": "high" if source_context == "same-line" else "medium",
            }
    return out, conf


def fuzzy_typography(lines: list[str], slug: str) -> tuple[dict, dict]:
    """Detect font names and pair them with role keywords from the same/prev line."""
    out: dict = {}
    conf: dict = {}
    seen_roles: set[str] = set()
    # Patterns: 'Inter, sans-serif', '"Plus Jakarta Sans"', 'font-family: Inter;'
    font_patterns = [
        re.compile(r"font-family\s*:\s*['\"]?([A-Z][A-Za-z0-9\s\-]+?)['\"]?\s*[,;]"),
        re.compile(r"['\"]([A-Z][A-Za-z0-9\s\-]{2,30})['\"]"),
        re.compile(r"\bfont\b\s*[:=]\s*([A-Z][A-Za-z0-9\s\-]{2,40})"),
        re.compile(r"\btypeface\b\s*[:=]?\s*([A-Z][A-Za-z0-9\s\-]{2,40})"),
    ]
    for idx, line in enumerate(lines):
        font_role = classify_font_role(line)
        if font_role is None:
            prev = lines[idx - 1] if idx > 0 else ""
            font_role = classify_font_role(prev)
        if font_role is None or font_role in seen_roles:
            continue
        for pat in font_patterns:
            m = pat.search(line)
            if not m:
                continue
            font = m.group(1).strip().strip(",;:'\"")
            if len(font) < 2 or font.lower() in {"sans-serif", "serif", "monospace", "system-ui"}:
                continue
            seen_roles.add(font_role)
            weights = parse_weight_range(line)
            entry = {"font": font}
            if weights:
                entry["weight_range"] = weights
            out[font_role] = entry
            conf[f"typography.{font_role}"] = {
                "value": font,
                "source": "fuzzy doc-scan: font name + role keyword",
                "confidence": "medium",
            }
            break
    # Google Fonts URL
    for line in lines:
        m = re.search(r"https://fonts\.googleapis\.com/[^\s`]+", line)
        if m:
            out["google_fonts_url"] = m.group(0).rstrip("`,;)")
            conf["typography.google_fonts_url"] = {
                "value": out["google_fonts_url"],
                "source": "fuzzy doc-scan: Google Fonts URL",
                "confidence": "high",
            }
            break
    return out, conf


def fuzzy_identity(lines: list[str]) -> tuple[dict, dict]:
    out: dict = {}
    conf: dict = {}
    # First H1 = brand name
    for line in lines:
        m = re.match(r"#\s+(.+?)(?:\s+brand\s+profile|\s+style\s+guide)?\s*$", line, re.IGNORECASE)
        if m:
            out["name"] = m.group(1).strip()
            conf["identity.name"] = {"value": out["name"], "source": "first H1", "confidence": "medium"}
            break
    # Domain pattern (e.g. example.com, www.example.com)
    for line in lines:
        m = re.search(r"\b(?:https?://)?(?:www\.)?([a-z0-9-]+\.[a-z]{2,}(?:\.[a-z]{2,})?)\b", line, re.IGNORECASE)
        if m and "fonts.googleapis" not in m.group(0):
            domain = m.group(1).lower()
            if domain.endswith(("png", "jpg", "svg", "css", "js")):
                continue
            out["domain"] = domain
            conf["identity.domain"] = {"value": domain, "source": "first domain mention", "confidence": "medium"}
            break
    return out, conf


def fuzzy_theme(colors: dict) -> tuple[dict, dict]:
    """Infer theme.mode from the background hex luminance."""
    bg = (colors.get("background") or {}).get("hex")
    if not bg:
        return {}, {}
    mode = "light" if luminance_hex(bg) > 128 else "dark"
    return (
        {"mode": mode},
        {"theme.mode": {"value": mode, "source": "luminance of background hex", "confidence": "high"}},
    )


# ── orchestrator ────────────────────────────────────────────────────────────


def is_canonical_shape(lines: list[str]) -> bool:
    """Doc looks canonical if it has both ## Colours table and ## Typography table."""
    return section_index(lines, "Colours") >= 0 or section_index(lines, "Colors") >= 0


def map_doc(text: str, slug: str) -> tuple[dict, dict]:
    lines = text.splitlines()
    tokens: dict = {
        "brand": slug,
        "version": "1",
        "generated_at": date.today().isoformat(),
        "source": "ingested from doc",
    }
    confidence: dict = {}

    if is_canonical_shape(lines):
        identity = strict_identity(lines)
        theme = strict_theme(lines)
        colors = strict_colors(lines)
        typography = strict_typography(lines)
        for k, v in identity.items():
            confidence[f"identity.{k}"] = {"value": v, "source": "canonical Identity bullets", "confidence": "high"}
        for k, v in theme.items():
            confidence[f"theme.{k}"] = {"value": v if isinstance(v, str) else ",".join(v), "source": "canonical Theme bullets", "confidence": "high"}
        for k, v in colors.items():
            confidence[f"colors.{k}"] = {"value": v["hex"], "source": "canonical Colours table", "confidence": "high"}
        for k, v in typography.items():
            if k == "google_fonts_url":
                confidence["typography.google_fonts_url"] = {"value": v, "source": "canonical Typography section", "confidence": "high"}
            else:
                confidence[f"typography.{k}"] = {"value": v["font"], "source": "canonical Typography table", "confidence": "high"}
    else:
        identity, id_conf = fuzzy_identity(lines)
        colors, col_conf = fuzzy_colors(lines, slug)
        typography, ty_conf = fuzzy_typography(lines, slug)
        theme, th_conf = fuzzy_theme(colors)
        confidence.update(id_conf)
        confidence.update(th_conf)
        confidence.update(col_conf)
        confidence.update(ty_conf)

    if identity:
        tokens["identity"] = identity
    if theme:
        tokens["theme"] = theme
    if colors:
        tokens["colors"] = colors
    if typography:
        tokens["typography"] = typography
    return tokens, confidence


# ── writers ─────────────────────────────────────────────────────────────────


def write_confidence(slug: str, confidence: dict, source_path: Path) -> Path:
    lines = [
        "---",
        "project: claude-ui-workflow",
        "role: ingestion-confidence",
        f"slug: {slug}",
        f"generated_at: {date.today().isoformat()}",
        f"source_doc: {source_path.name}",
        "---",
        "",
        f"# Ingestion confidence — `{slug}`",
        "",
        "Per-field source + confidence for the derived `tokens.json`. Doc-mode",
        "ingestion (B5). Strict pass uses the canonical shape; fuzzy fallback",
        "scans hex codes with line-context role keywords.",
        "",
        "| Field | Value | Source | Confidence | Action |",
        "|---|---|---|---|---|",
    ]
    for field, info in confidence.items():
        action = {
            "high": "—",
            "medium": "review",
            "low": "**confirm** manually",
        }[info["confidence"]]
        value = info["value"]
        if isinstance(value, str) and len(value) > 60:
            value = value[:57] + "…"
        lines.append(f"| `{field}` | `{value}` | {info['source']} | {info['confidence']} | {action} |")
    out = BRANDS / slug / "ingestion-confidence.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return out


def write_profile_md(slug: str, tokens: dict) -> Path:
    ident = tokens.get("identity", {})
    theme = tokens.get("theme", {})
    colors = tokens.get("colors", {})
    typo = tokens.get("typography", {})
    name = ident.get("name", slug.replace("-", " ").title())
    domain = ident.get("domain", "<<review>>")

    lines = [
        f"# {name} Brand Profile",
        "",
        "> Auto-derived by `scripts/ingest-doc.py`. Review the `<<review>>`",
        "> blocks below — those are sections that can't be derived from the doc",
        "> alone (animation philosophy, anti-patterns, page structure).",
        "",
        "## Identity",
        f"- **Project:** {name}",
        f"- **Domain:** {domain}",
        "- **Deploy:** <<review>>",
        "- **Design system:** —",
        "",
        "## Theme",
        f"- **Mode:** {theme.get('mode', '<<review>>')}",
        f"- **Style:** {theme.get('style', '<<review>>')}",
        f"- **Mood:** {', '.join(theme.get('mood', [])) if theme.get('mood') else '<<review>>'}",
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
        "- <<review>>",
        "",
        "## Page Structure",
        "- <<review>>",
        "",
        "## Image Constraints",
        "- <<review>>",
        "- Append `No text` to all image prompts",
        "",
        "## Animation Preferences",
        "- <<review>>",
        "",
        "## Performance Budget",
        "- LCP target: < 2.5s",
        "- CLS target: < 0.1",
        "- Bundle target: < 200KB gzipped JS",
        "",
        "## Anti-Patterns",
        "- <<review>>",
        "",
    ])
    out = BRANDS / slug / "profile.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines), encoding="utf-8")
    return out


# ── main ────────────────────────────────────────────────────────────────────


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Ingest a markdown / plain-text style guide into a brand profile + tokens.json")
    parser.add_argument("doc", help="Path to the style-guide doc (.md or .txt)")
    parser.add_argument("--slug", required=True, help="Folder slug under brands/")
    args = parser.parse_args(argv[1:])

    doc_path = Path(args.doc).expanduser().resolve()
    if not doc_path.exists():
        print(f"doc not found: {doc_path}", file=sys.stderr)
        return 1
    if doc_path.suffix.lower() not in (".md", ".txt", ".markdown"):
        print(f"unsupported file type: {doc_path.suffix}. Use .md or .txt — convert PDF/docx in Claude Desktop first.", file=sys.stderr)
        return 1

    text = doc_path.read_text(encoding="utf-8")
    print(f"> reading {doc_path.name} ({len(text)} chars)", file=sys.stderr)

    tokens, confidence = map_doc(text, args.slug)
    out_dir = BRANDS / args.slug
    out_dir.mkdir(parents=True, exist_ok=True)

    tokens_path = out_dir / "tokens.json"
    tokens_path.write_text(json.dumps(tokens, indent=2) + "\n", encoding="utf-8")
    print(f"  wrote {tokens_path.relative_to(ROOT)}")

    profile_path = write_profile_md(args.slug, tokens)
    print(f"  wrote {profile_path.relative_to(ROOT)}")

    confidence_path = write_confidence(args.slug, confidence, doc_path)
    print(f"  wrote {confidence_path.relative_to(ROOT)}")

    weak = [f for f, info in confidence.items() if info["confidence"] in ("low", "medium")]
    if weak:
        print("", file=sys.stderr)
        print("⚠ Low/medium confidence fields:", ", ".join(weak), file=sys.stderr)
        print("  Review ingestion-confidence.md before locking the brand profile.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
