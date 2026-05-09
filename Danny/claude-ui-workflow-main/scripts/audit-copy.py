#!/usr/bin/env python3
"""Stage 8 hard-fail audit for Claude UI Workflow.

Every locked string must appear verbatim in the rendered HTML; every
anti-drift string must be absent.

Exits 0 on PASS, 1 on FAIL, 2 on bad input. Designed to wire into pre-commit / CI.

Audit-target resolution (cycle-3 findings #38-#40):
1. If locks.json carries verbatim arrays (`*_verbatim`, `*_locked`, plus
   `wordmark.text` and `story_verbatim`) we use those as the audit targets.
   These are the explicit "MUST appear" strings.
2. Otherwise (e.g. Databrill cycle-2 locks.json which is tokens-only) we
   fall back to walking source-truth.json, excluding meta keys (any key
   prefixed with `_` plus a known list).

Anti-drift resolution:
1. If locks.json carries an explicit `anti_drift_strings` array (preferred,
   future schema) use it directly.
2. Else if `anti_drift_rules` exists, regex-extract single-quoted phrases
   ONLY from rules that start with "Do NOT use" (the rules whose intent is
   forbid). Phrases must contain at least one letter (avoids matching the
   `, ` connectors between phrases).
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from pathlib import Path

META_KEY_DENYLIST = {
    "category",
    "wordmark_capitalization",
    "id",
    "layout",
    "icon_role",
    "cta_style",
    "meta_description",
    "label",
    "platform",
    "extracted",
    "method",
    "purpose",
    "url_source",
}

VERBATIM_KEY_SUFFIXES = ("_verbatim", "_locked")

ANSI = {
    "reset": "\033[0m",
    "red": "\033[31m",
    "green": "\033[32m",
    "yellow": "\033[33m",
    "dim": "\033[2m",
    "bold": "\033[1m",
}


def colour(text: str, name: str) -> str:
    if not sys.stdout.isatty():
        return text
    return f"{ANSI[name]}{text}{ANSI['reset']}"


def is_meta_key(key: str) -> bool:
    return key.startswith("_") or key in META_KEY_DENYLIST


def collect_leaf_strings(node, path="$"):
    """Walk a JSON tree, yield (path, string_value) for every leaf string,
    skipping underscore-prefixed and known meta keys."""
    if isinstance(node, dict):
        for key, value in node.items():
            if is_meta_key(key):
                continue
            yield from collect_leaf_strings(value, f"{path}.{key}")
    elif isinstance(node, list):
        for index, value in enumerate(node):
            yield from collect_leaf_strings(value, f"{path}[{index}]")
    elif isinstance(node, str) and node.strip():
        yield path, node


def collect_locks_targets(locks: dict):
    """Pull every must-appear-verbatim string from locks.json. Returns a
    list of (label, value) tuples."""
    targets = []

    wordmark = locks.get("wordmark")
    if isinstance(wordmark, dict) and isinstance(wordmark.get("text"), str):
        targets.append(("wordmark.text", wordmark["text"]))

    story = locks.get("story_verbatim")
    if isinstance(story, str) and story.strip():
        targets.append(("story_verbatim", story))

    for key, value in locks.items():
        if not any(key.endswith(suffix) for suffix in VERBATIM_KEY_SUFFIXES):
            continue
        if key in {"story_verbatim"}:
            continue  # already pulled above
        if isinstance(value, list):
            for index, item in enumerate(value):
                if isinstance(item, str) and item.strip():
                    targets.append((f"{key}[{index}]", item))
                elif isinstance(item, dict):
                    for inner_key, inner_value in item.items():
                        if isinstance(inner_value, str) and inner_value.strip():
                            targets.append((f"{key}[{index}].{inner_key}", inner_value))

    nl = locks.get("newsletter_verbatim")
    if isinstance(nl, dict):
        for inner_key, inner_value in nl.items():
            if isinstance(inner_value, str) and inner_value.strip():
                targets.append((f"newsletter_verbatim.{inner_key}", inner_value))

    return targets


def normalise(text: str) -> str:
    """HTML-entity-decode and collapse whitespace so '&amp;' matches '&'."""
    decoded = html.unescape(text)
    return re.sub(r"\s+", " ", decoded).strip()


def extract_anti_drift_phrases(rules):
    """Pull every single-quoted phrase out of rules whose intent is FORBID.

    Heuristic: only rules starting with "Do NOT use" or "Do NOT add" or
    "Do NOT include" carry forbidden phrases. Other rules (e.g. "Do NOT
    change wording — must include 'X'") name REQUIRED phrases inside the
    quotes, which we must skip. Phrases must contain at least one letter
    to avoid matching ', ' connectors between phrases.
    """
    forbid_prefixes = ("do not use", "do not add", "do not include")
    quote_pattern = re.compile(r"'([^']*[A-Za-z][^']*)'")

    phrases = []
    seen = set()
    for rule in rules:
        head = rule.strip().lower()
        if not any(head.startswith(prefix) for prefix in forbid_prefixes):
            continue
        for match in quote_pattern.findall(rule):
            if match not in seen:
                seen.add(match)
                phrases.append(match)
    return phrases


def audit(source_truth_path: Path, locks_path: Path, html_path: Path) -> int:
    source_truth = json.loads(source_truth_path.read_text(encoding="utf-8"))
    locks = json.loads(locks_path.read_text(encoding="utf-8"))
    rendered_raw = html_path.read_text(encoding="utf-8")
    rendered = normalise(rendered_raw)

    print(colour("Stage 8 hard-fail audit", "bold"))
    print(colour(f"  source-truth: {source_truth_path}", "dim"))
    print(colour(f"  locks:        {locks_path}", "dim"))
    print(colour(f"  rendered:     {html_path}", "dim"))
    print()

    # 1. resolve audit targets
    locks_targets = collect_locks_targets(locks)
    if locks_targets:
        targets = locks_targets
        target_source = "locks.json (verbatim arrays)"
    else:
        targets = list(collect_leaf_strings(source_truth))
        target_source = "source-truth.json (no verbatim arrays in locks; falling back)"

    presence_misses = []
    for path, value in targets:
        target = normalise(value)
        if target not in rendered:
            presence_misses.append((path, value))

    presence_passed = len(targets) - len(presence_misses)
    print(colour("Locked-copy presence", "bold"))
    print(colour(f"  source: {target_source}", "dim"))
    print(f"  {presence_passed}/{len(targets)} strings present verbatim")
    if presence_misses:
        print(colour(f"  {len(presence_misses)} MISSING:", "red"))
        for path, value in presence_misses:
            preview = value if len(value) <= 80 else value[:77] + "..."
            print(f"    {colour('FAIL', 'red')} {path}  →  {preview!r}")
    else:
        print(colour("  All present.", "green"))
    print()

    # 2. anti-drift absence check
    drift_phrases = locks.get("anti_drift_strings")
    drift_source = None
    if isinstance(drift_phrases, list) and drift_phrases:
        drift_source = "locks.json::anti_drift_strings"
    else:
        rules = locks.get("anti_drift_rules") or []
        if rules:
            drift_phrases = extract_anti_drift_phrases(rules)
            drift_source = "locks.json::anti_drift_rules (regex-extracted)"
        else:
            drift_phrases = []

    drift_hits = []
    for phrase in drift_phrases or []:
        if normalise(phrase) in rendered:
            drift_hits.append(phrase)

    print(colour("Anti-drift absence", "bold"))
    if not drift_phrases and drift_source is None:
        print(colour("  WARN: locks.json has neither anti_drift_strings nor anti_drift_rules.", "yellow"))
        print(colour("        (cycle-3 finding #40 — fix in /lock skill)", "dim"))
    else:
        print(colour(f"  source: {drift_source}", "dim"))
        drift_passed = len(drift_phrases) - len(drift_hits)
        print(f"  {drift_passed}/{len(drift_phrases)} phrases absent")
        if drift_hits:
            print(colour(f"  {len(drift_hits)} PRESENT (must be removed):", "red"))
            for phrase in drift_hits:
                preview = phrase if len(phrase) <= 80 else phrase[:77] + "..."
                print(f"    {colour('FAIL', 'red')} {preview!r}")
        else:
            print(colour("  All absent.", "green"))
    print()

    # 3. summary
    fail_count = len(presence_misses) + len(drift_hits)
    if fail_count == 0:
        print(colour("PASS — Stage 8 audit clean.", "green"))
        return 0
    print(colour(f"FAIL — {fail_count} issue(s). Hard-fail; cycle cannot lock.", "red"))
    return 1


def parse_args():
    parser = argparse.ArgumentParser(
        description="Stage 8 hard-fail audit (Claude UI Workflow)."
    )
    parser.add_argument(
        "--source-truth",
        type=Path,
        default=Path("source-truth.json"),
        help="Path to source-truth.json (default: ./source-truth.json)",
    )
    parser.add_argument(
        "--locks",
        type=Path,
        default=Path("locks.json"),
        help="Path to locks.json (default: ./locks.json)",
    )
    parser.add_argument(
        "--html",
        type=Path,
        default=Path("full-page-merged.html"),
        help="Path to rendered HTML (default: ./full-page-merged.html)",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    for path in (args.source_truth, args.locks, args.html):
        if not path.exists():
            print(colour(f"ERROR: {path} not found.", "red"), file=sys.stderr)
            sys.exit(2)
    sys.exit(audit(args.source_truth, args.locks, args.html))


if __name__ == "__main__":
    main()
