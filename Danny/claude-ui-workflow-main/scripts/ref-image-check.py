#!/usr/bin/env python3
"""Reference-image reliability harness (B8).

For every `enforce: "asset"` lock in `brands/<slug>/locks.json`, check
whether the pinned image survived a user-exported Stitch HTML/ZIP. Two
passes per slot:

  1. HTML scan — find the pinned filename in any image-bearing attribute
     across every .html file in the export.
  2. Hash fallback — if the filename is absent, perceptual-hash compare
     the pinned image against every image file in the export bundle. A
     close match means Stitch renamed but kept the file.

Output: `brands/<slug>/ref-image-report.md` (schema:
`brands/REF-IMAGE-REPORT-SCHEMA.md`) + a stdout summary suitable for
`/refine`'s §8 block.

Usage:
    python3 scripts/ref-image-check.py --slug <slug> --export <path>

`<path>` may be a single .html file, a directory, or a .zip. Zips are
extracted to a temp directory; the temp dir is removed on exit.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
import tempfile
import urllib.parse
import zipfile
from datetime import date
from pathlib import Path

try:
    from PIL import Image
except ModuleNotFoundError:
    sys.stderr.write(
        "Pillow not found. Install with:\n"
        "  python3 -m venv .venv && .venv/bin/pip install -r requirements.txt\n"
    )
    raise SystemExit(1)

try:
    import imagehash
except ModuleNotFoundError:
    sys.stderr.write(
        "imagehash not found. Install with:\n"
        "  .venv/bin/pip install -r requirements.txt\n"
        "(requirements.txt was updated for B8 — re-run pip install.)\n"
    )
    raise SystemExit(1)


ROOT = Path(__file__).resolve().parent.parent
BRANDS = ROOT / "brands"

IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".tiff"}
HASH_DISTANCE_THRESHOLD = 12  # see brands/REF-IMAGE-REPORT-SCHEMA.md


# ── path resolution ─────────────────────────────────────────────────────────


def resolve_pinned_path(slug: str, value: str) -> Path | None:
    """Try absolute → brand folder → workflow root. Return first existing path."""
    p = Path(value).expanduser()
    if p.is_absolute() and p.exists():
        return p
    for base in (BRANDS / slug, ROOT):
        candidate = (base / value).resolve()
        if candidate.exists():
            return candidate
    return None


def prepare_export(export: Path, tmp_root: Path) -> Path:
    """Return a directory path containing the export. Unzip if needed."""
    if export.is_dir():
        return export
    if export.suffix.lower() == ".zip":
        extract_dir = tmp_root / "export"
        extract_dir.mkdir()
        with zipfile.ZipFile(export) as zf:
            zf.extractall(extract_dir)
        return extract_dir
    if export.is_file():
        # Single HTML file — no asset bundle, but still walk-able as a one-file dir
        return export.parent
    raise SystemExit(f"export not found or unrecognised: {export}")


# ── locks loading ───────────────────────────────────────────────────────────


def load_asset_locks(slug: str) -> list[dict]:
    path = BRANDS / slug / "locks.json"
    if not path.exists():
        raise SystemExit(f"locks.json not found: {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    locks = data.get("locks", [])
    return [lock for lock in locks if lock.get("enforce") == "asset"]


# ── HTML scan ───────────────────────────────────────────────────────────────


def collect_html(export_dir: Path) -> str:
    """Concatenate every .html file in the export into one string."""
    parts: list[str] = []
    for html_path in sorted(export_dir.rglob("*.html")):
        try:
            parts.append(html_path.read_text(encoding="utf-8", errors="ignore"))
        except OSError:
            continue
    return "\n".join(parts)


def html_scan(haystack: str, pinned_path: Path) -> tuple[bool, str]:
    """Return (found, evidence). Searches filename, basename without extension,
    and URL-encoded variants. Case-insensitive."""
    name = pinned_path.name
    stem = pinned_path.stem
    candidates = {
        name,
        name.lower(),
        urllib.parse.quote(name),
        stem,
        stem.lower(),
    }
    haystack_lower = haystack.lower()
    for needle in candidates:
        idx = haystack_lower.find(needle.lower())
        if idx == -1:
            continue
        # Lift a small window for the evidence line — find the enclosing
        # attribute (e.g. src="..." or background-image: url(...)).
        window_start = max(0, idx - 60)
        window_end = min(len(haystack), idx + len(needle) + 30)
        snippet = haystack[window_start:window_end]
        # Compress whitespace
        snippet = re.sub(r"\s+", " ", snippet).strip()
        return True, snippet
    return False, ""


# ── hash fallback ───────────────────────────────────────────────────────────


def safe_phash(path: Path) -> imagehash.ImageHash | None:
    try:
        with Image.open(path) as img:
            return imagehash.phash(img)
    except Exception:
        return None


def hash_scan(
    pinned_path: Path,
    export_dir: Path,
    threshold: int = HASH_DISTANCE_THRESHOLD,
) -> tuple[bool, str, int | None]:
    """Walk the export for image files, return the closest match within
    threshold. Returns (found, evidence, distance)."""
    pinned_hash = safe_phash(pinned_path)
    if pinned_hash is None:
        return False, "could not hash pinned image", None
    best: tuple[int, Path] | None = None
    for candidate in export_dir.rglob("*"):
        if not candidate.is_file() or candidate.suffix.lower() not in IMAGE_SUFFIXES:
            continue
        candidate_hash = safe_phash(candidate)
        if candidate_hash is None:
            continue
        dist = pinned_hash - candidate_hash
        if best is None or dist < best[0]:
            best = (dist, candidate)
    if best is None:
        return False, "no image files in the export bundle", None
    distance, path = best
    if distance <= threshold:
        rel = path.relative_to(export_dir) if path.is_relative_to(export_dir) else path.name
        return True, f"matched `{rel}`, hash distance {distance}", distance
    return False, f"closest candidate hash distance {distance} (threshold {threshold})", distance


# ── per-slot verdict ────────────────────────────────────────────────────────


def check_lock(lock: dict, slug: str, haystack: str, export_dir: Path) -> dict:
    """Return a verdict record for a single asset lock."""
    field = lock["field"]
    value = lock["value"]
    pinned_path = resolve_pinned_path(slug, value)
    if pinned_path is None:
        return {
            "field": field,
            "pinned": value,
            "verdict": "FAIL",
            "evidence": f"pinned file not found on disk (looked in brands/{slug}/, workflow root)",
            "recommendation": "fix the path in locks.json or place the file before re-running",
        }
    found_html, html_evidence = html_scan(haystack, pinned_path)
    if found_html:
        return {
            "field": field,
            "pinned": value,
            "verdict": "PASS",
            "evidence": f"found in HTML: `{html_evidence}`",
            "recommendation": "—",
        }
    found_hash, hash_evidence, _distance = hash_scan(pinned_path, export_dir)
    if found_hash:
        return {
            "field": field,
            "pinned": value,
            "verdict": "PASS-VARIANT",
            "evidence": hash_evidence,
            "recommendation": "—",
        }
    slot = field.removeprefix("assets.").removesuffix(".image")
    return {
        "field": field,
        "pinned": value,
        "verdict": "FAIL",
        "evidence": "not found in HTML or asset bundle",
        "recommendation": f"`/regen-nb2 {slot}` (or re-prompt Stitch with the pinned image)",
    }


# ── report writer ───────────────────────────────────────────────────────────


def render_report(
    slug: str,
    export_source: Path,
    verdicts: list[dict],
) -> str:
    today = date.today().isoformat()
    pass_count = sum(1 for v in verdicts if v["verdict"] == "PASS")
    variant_count = sum(1 for v in verdicts if v["verdict"] == "PASS-VARIANT")
    fail_count = sum(1 for v in verdicts if v["verdict"] == "FAIL")
    total = len(verdicts)

    try:
        rel_source = export_source.relative_to(ROOT)
        export_str = str(rel_source)
    except ValueError:
        export_str = str(export_source)

    lines = [
        "---",
        f"brand: {slug}",
        f"generated_at: {today}",
        f"export_source: {export_str}",
        f"locks_checked: {total}",
        "verdict_summary:",
        f"  pass: {pass_count}",
        f"  pass_variant: {variant_count}",
        f"  fail: {fail_count}",
        "---",
        "",
        f"# Reference Image Report — {slug}",
        "",
        f"Generated {today} from `{export_str}` against {total} asset lock"
        f"{'s' if total != 1 else ''} in `brands/{slug}/locks.json`.",
        "",
        f"**Headline:** {pass_count} PASS · {variant_count} PASS-VARIANT · "
        f"{fail_count} FAIL  ({total} slot{'s' if total != 1 else ''} checked)",
        "",
        "## Per-slot verdicts",
        "",
        "| Slot | Pinned image | Verdict | Evidence | Recommendation |",
        "|---|---|---|---|---|",
    ]
    for v in verdicts:
        evidence = v["evidence"].replace("|", "\\|")
        recommendation = v["recommendation"].replace("|", "\\|")
        lines.append(
            f"| `{v['field']}` | `{v['pinned']}` | {v['verdict']} | {evidence} | {recommendation} |"
        )

    if fail_count:
        lines += ["", "## Failed slots", ""]
        for v in verdicts:
            if v["verdict"] == "FAIL":
                lines.append(f"- `{v['field']}` (pinned `{v['pinned']}`)")
                lines.append(f"  - Evidence: {v['evidence']}")
                lines.append(f"  - Recommendation: {v['recommendation']}")

    lines += [
        "",
        "## Notes",
        "",
        f"- Hash threshold: {HASH_DISTANCE_THRESHOLD} (perceptual hash distance).",
        "- Slot semantics are not verified — the harness checks presence, not placement.",
        "- See `brands/REF-IMAGE-REPORT-SCHEMA.md` for the full contract.",
        "",
    ]
    return "\n".join(lines)


def render_refine_summary(slug: str, verdicts: list[dict]) -> str:
    """The §8 block to splice into /refine's gap-analysis output."""
    pass_count = sum(1 for v in verdicts if v["verdict"] == "PASS")
    variant_count = sum(1 for v in verdicts if v["verdict"] == "PASS-VARIANT")
    fail_count = sum(1 for v in verdicts if v["verdict"] == "FAIL")
    total = len(verdicts)

    lines = [
        "## §8. Asset locks",
        "",
        f"{total} slot{'s' if total != 1 else ''} checked · {pass_count} PASS · "
        f"{variant_count} PASS-VARIANT · {fail_count} FAIL",
    ]
    if fail_count:
        lines += ["", "Failed:"]
        for v in verdicts:
            if v["verdict"] == "FAIL":
                lines.append(f"- `{v['field']}` (pinned `{v['pinned']}`)")
                lines.append(f"  → {v['recommendation']}")
    lines += ["", f"Full report: `brands/{slug}/ref-image-report.md`"]
    return "\n".join(lines)


# ── orchestration ───────────────────────────────────────────────────────────


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(
        description="Reference-image reliability harness — check pinned product images survived a Stitch export"
    )
    parser.add_argument("--slug", required=True, help="Brand slug under brands/")
    parser.add_argument(
        "--export",
        required=True,
        help="Path to the Stitch export — single .html file, directory, or .zip",
    )
    parser.add_argument(
        "--no-write",
        action="store_true",
        help="Print the report to stdout without writing to disk",
    )
    parser.add_argument(
        "--summary-only",
        action="store_true",
        help="Print only the §8 summary block (for splicing into /refine)",
    )
    args = parser.parse_args(argv[1:])

    asset_locks = load_asset_locks(args.slug)
    if not asset_locks:
        print(
            f"No asset locks in brands/{args.slug}/locks.json — nothing to check.",
            file=sys.stderr,
        )
        return 0

    export_path = Path(args.export).expanduser().resolve()
    if not export_path.exists():
        print(f"export not found: {export_path}", file=sys.stderr)
        return 1

    with tempfile.TemporaryDirectory(prefix="ref-image-check-") as tmp:
        tmp_root = Path(tmp)
        export_dir = prepare_export(export_path, tmp_root)
        haystack = collect_html(export_dir)

        verdicts = [check_lock(lock, args.slug, haystack, export_dir) for lock in asset_locks]

    report = render_report(args.slug, export_path, verdicts)
    summary = render_refine_summary(args.slug, verdicts)
    fails = sum(1 for v in verdicts if v["verdict"] == "FAIL")

    if args.summary_only:
        print(summary)
        return 1 if fails else 0

    if args.no_write:
        print(report)
        print()
        print(summary)
        return 1 if fails else 0

    out_path = BRANDS / args.slug / "ref-image-report.md"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(report, encoding="utf-8")
    print(summary)
    print(f"\nwrote {out_path.relative_to(ROOT)}", file=sys.stderr)

    return 1 if fails else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
