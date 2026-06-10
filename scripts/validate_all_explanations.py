#!/usr/bin/env python3
"""Validate explanation coverage and quality for every catalog question."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAT_PATH = ROOT / "web" / "public" / "data" / "catalog.json"
EXPL_PATH = ROOT / "data" / "explanations" / "all-explanations.json"

MIN_LEN = 150
BANNED_HEADERS = ("**Answer**", "**Explanation**", "**Exam tip**")
STRUCTURE_HEADERS = (
    "**How it works**",
    "**Step by step**",
    "**What this question tests**",
    "**The key line**",
    "**Why the others fail**",
    "**Common mistake**",
)
STEM_LEAK = re.compile(r"\n\s*[ab]\.\s*(True|False)\s*$", re.I | re.M)


def parse_key(key: str) -> tuple[str, str]:
    parts = key.split(":")
    if key.startswith("written:"):
        return "written", key.split(":", 1)[1]
    return parts[0], parts[-1]


def has_structure(text: str) -> bool:
    return any(h in text for h in STRUCTURE_HEADERS)


def main() -> int:
    cat = json.loads(CAT_PATH.read_text(encoding="utf-8"))
    expl = json.loads(EXPL_PATH.read_text(encoding="utf-8")) if EXPL_PATH.exists() else {}
    errors: list[str] = []
    warnings: list[str] = []

    for q in sorted(cat["questions"], key=lambda x: x["questionKey"]):
        year, qid = parse_key(q["questionKey"])
        section = expl.get(year, {})
        text = section.get(qid) or q.get("explanation") or ""

        if not text.strip():
            errors.append(f"MISSING: {q['questionKey']}")
            continue
        if len(text) < MIN_LEN:
            warnings.append(f"SHORT ({len(text)}): {q['questionKey']}")
        if not has_structure(text):
            warnings.append(f"NO_STRUCTURE: {q['questionKey']}")
        for banned in BANNED_HEADERS:
            if banned in text:
                errors.append(f"BANNED_HEADER {banned}: {q['questionKey']}")
        if "\u2014" in text or "\u2013" in text:
            warnings.append(f"EM_DASH: {q['questionKey']}")
        if q.get("type") == "multiple_choice" and STEM_LEAK.search(q.get("questionText", "")):
            warnings.append(f"STEM_LEAK: {q['questionKey']}")

    print(f"Catalog questions: {len(cat['questions'])}")
    print(f"Overlay explanations: {sum(len(v) for v in expl.values())}")
    if warnings:
        print(f"\nWARNINGS ({len(warnings)}):")
        for w in warnings[:30]:
            print(f"  {w}")
        if len(warnings) > 30:
            print(f"  ... and {len(warnings) - 30} more")
    if errors:
        print(f"\nERRORS ({len(errors)}):")
        for e in errors:
            print(f"  {e}")
        return 1
    print("\nValidation passed (no errors).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
