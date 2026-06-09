#!/usr/bin/env python3
"""Validate backend explanation coverage and flag quality issues before commit."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAT_PATH = ROOT / "web/public/data/catalog.json"
EXPL_PATH = ROOT / "data/explanations/backend-explanations.json"

MIN_LEN = 150
BAD_PHRASES = [
    "client must authenticate",  # conflates 403 with 401
    "makemigrations applies",
    "migrate only creates",
    "Objects.all() is correct",
]

STEM_LEAK = re.compile(r"\n\s*[ab]\.\s*(True|False)\s*$", re.I | re.M)


def is_backend(q: dict) -> bool:
    return any(t.startswith("be-") for t in (q.get("relatedTopics") or []))


def parse_key(key: str) -> tuple[str, str]:
    parts = key.split(":")
    return parts[0], parts[-1]


def main() -> int:
    cat = json.loads(CAT_PATH.read_text(encoding="utf-8"))
    expl = json.loads(EXPL_PATH.read_text(encoding="utf-8"))
    errors: list[str] = []
    warnings: list[str] = []

    backend = [q for q in cat["questions"] if is_backend(q)]
    for q in sorted(backend, key=lambda x: x["questionKey"]):
        year, qid = parse_key(q["questionKey"])
        section = expl.get("written" if year == "written" else year, {})
        text = section.get(qid)
        if not text:
            errors.append(f"MISSING: {q['questionKey']}")
            continue
        if len(text) < MIN_LEN:
            warnings.append(f"SHORT ({len(text)}): {q['questionKey']}")
        for phrase in BAD_PHRASES:
            if phrase.lower() in text.lower():
                errors.append(f"BAD_PHRASE '{phrase}': {q['questionKey']}")
        if year == "2025" and q.get("type") == "multiple_choice":
            stem = q.get("questionText", "")
            if STEM_LEAK.search(stem):
                warnings.append(f"STEM_LEAK: {q['questionKey']}")

    # duplicate explanation check across same qid different years is OK
    print(f"Backend questions: {len(backend)}")
    print(f"Explanations loaded: {sum(len(v) for v in expl.values())}")
    if warnings:
        print(f"\nWARNINGS ({len(warnings)}):")
        for w in warnings:
            print(f"  {w}")
    if errors:
        print(f"\nERRORS ({len(errors)}):")
        for e in errors:
            print(f"  {e}")
        return 1
    print("\nValidation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
