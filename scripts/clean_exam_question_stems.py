#!/usr/bin/env python3
"""Normalize exam questionText in source JSON (strip embedded T/F lines, leaks)."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXAM_DIR = ROOT / "data" / "exams"
NORMALIZE_JS = """
import { normalizeExamQuestionText } from './web/scripts/parse-question-content.mjs';
const text = process.argv[1];
process.stdout.write(normalizeExamQuestionText(text));
"""


def normalize(text: str) -> str:
    result = subprocess.run(
        ["node", "--input-type=module", "-e", NORMALIZE_JS, text],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout


def main() -> None:
    total = 0
    for path in sorted(EXAM_DIR.glob("20*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        changes = 0
        for block in data:
            for q in block["questions"]:
                old = q.get("questionText", "")
                new = normalize(old)
                if new != old:
                    q["questionText"] = new
                    changes += 1
        if changes:
            path.write_text(
                json.dumps(data, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
        print(f"{path.name}: {changes} stem(s) cleaned")
        total += changes
    print(f"Total: {total}")


if __name__ == "__main__":
    main()
