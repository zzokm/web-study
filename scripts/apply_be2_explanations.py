#!/usr/bin/env python3
"""Apply detailed B2 Python explanations from data/explanations/be2-python-explanations.json."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPL_PATH = ROOT / "data" / "explanations" / "be2-python-explanations.json"
EXAM_DIR = ROOT / "data" / "exams"
WRITTEN_PATH = ROOT / "data" / "written-questions" / "questions.json"


def load_explanations() -> dict:
    return json.loads(EXPL_PATH.read_text(encoding="utf-8"))


def apply_exam_year(year: str, fixes: dict[str, str]) -> int:
    exam_path = EXAM_DIR / f"{year}.json"
    data = json.loads(exam_path.read_text(encoding="utf-8"))
    changes = 0
    for block in data:
        for question in block["questions"]:
            qid = question["id"]
            if qid in fixes and question.get("explanation") != fixes[qid]:
                question["explanation"] = fixes[qid]
                changes += 1
    if changes:
        exam_path.write_text(
            json.dumps(data, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
    print(f"{year}: {changes} explanation(s) updated")
    return changes


def apply_written(fixes: dict[str, str]) -> int:
    data = json.loads(WRITTEN_PATH.read_text(encoding="utf-8"))
    changes = 0
    for question in data["questions"]:
        qid = question["id"]
        if qid in fixes and question.get("explanation") != fixes[qid]:
            question["explanation"] = fixes[qid]
            changes += 1
    if changes:
        WRITTEN_PATH.write_text(
            json.dumps(data, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
    print(f"written: {changes} explanation(s) updated")
    return changes


def main() -> None:
    if not EXPL_PATH.exists():
        print(f"Missing {EXPL_PATH}", file=sys.stderr)
        sys.exit(1)
    expl = load_explanations()
    total = 0
    for year in ("2021", "2024", "2025"):
        total += apply_exam_year(year, expl.get(year, {}))
    total += apply_written(expl.get("written", {}))
    print(f"Total: {total} updates")


if __name__ == "__main__":
    main()
