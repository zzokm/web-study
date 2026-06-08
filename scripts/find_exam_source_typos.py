"""
Find exam questions whose explanations still mention source-paper typos or fixes.

These notes usually mean the option text in data/exams/*.json should be corrected
and the explanation rewritten without hedging language.

Usage
-----
    python scripts/find_exam_source_typos.py
    python scripts/find_exam_source_typos.py --quiet   # exit 1 if any found
"""
from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXAMS_DIR = ROOT / "data" / "exams"
EXAM_YEARS = ("2021", "2024", "2025")

# Explanations matching these patterns likely still describe unfixed print typos.
TYPO_NOTE_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("typo", re.compile(r"\btypo(?:graphical|graphy)?\b", re.I)),
    ("exam error note", re.compile(r"note on exam error", re.I)),
    ("exam source", re.compile(r"exam'?s?\s+source", re.I)),
    ("source had", re.compile(r"\b(?:in|from)\s+the\s+source\s+had\b", re.I)),
    ("corrected for intent", re.compile(r"corrected\s+for\s+intent", re.I)),
    ("assuming typo", re.compile(r"assuming\s+a\s+typographical", re.I)),
    ("instead of H/O typo", re.compile(r"instead\s+of\s+['\"]?(?:H|11)", re.I)),
    ("exam source duplicate", re.compile(r"exam\s+source\s+due\s+to\s+duplicate", re.I)),
    ("common typographical error", re.compile(r"common\s+typographical\s+error", re.I)),
    ("slight typo", re.compile(r"slight\s+typo", re.I)),
    ("likely typographical", re.compile(r"likely\s+typographical", re.I)),
]


@dataclass(frozen=True)
class TypoNoteHit:
    year: str
    block_id: str
    question_id: str
    correct_answer_id: str
    pattern_label: str
    question_preview: str
    explanation: str
    options: tuple[str, ...]


def iter_exam_questions(year: str):
    path = EXAMS_DIR / f"{year}.json"
    with open(path, encoding="utf-8") as handle:
        blocks = json.load(handle)
    for block in blocks:
        block_id = block.get("id", "?")
        for question in block.get("questions", []):
            yield year, block_id, question


def find_typo_notes_in_explanation(explanation: str) -> str | None:
    for label, pattern in TYPO_NOTE_PATTERNS:
        if pattern.search(explanation):
            return label
    return None


def scan_exam_typo_notes() -> list[TypoNoteHit]:
    hits: list[TypoNoteHit] = []
    for exam_year in EXAM_YEARS:
        for year, block_id, question in iter_exam_questions(exam_year):
            explanation = (question.get("explanation") or "").strip()
            if not explanation:
                continue
            label = find_typo_notes_in_explanation(explanation)
            if not label:
                continue
            options = tuple(
                f"{opt.get('id', '?').upper()}. {opt.get('content', '')}"
                for opt in question.get("options", [])
            )
            hits.append(
                TypoNoteHit(
                    year=year,
                    block_id=block_id,
                    question_id=question.get("id", "?"),
                    correct_answer_id=(question.get("correctAnswerId") or "?").upper(),
                    pattern_label=label,
                    question_preview=(question.get("questionText") or "").split("\n")[0][:100],
                    explanation=explanation,
                    options=options,
                )
            )
    return hits


def format_hit(hit: TypoNoteHit) -> str:
    lines = [
        f"{hit.year}/{hit.question_id} ({hit.block_id})  answer={hit.correct_answer_id}  [{hit.pattern_label}]",
        f"  Q: {hit.question_preview}",
    ]
    for option in hit.options:
        lines.append(f"  {option}")
    lines.append(f"  Explanation: {hit.explanation[:240]}{'…' if len(hit.explanation) > 240 else ''}")
    return "\n".join(lines)


def main() -> int:
    quiet = "--quiet" in sys.argv
    hits = scan_exam_typo_notes()

    if not hits:
        if not quiet:
            print("OK – no exam explanations mention unfixed source typos.")
        return 0

    if not quiet:
        print(f"Found {len(hits)} question(s) with source-typo notes in explanations:\n")
        for hit in hits:
            print(format_hit(hit))
            print()
        print("Fix by correcting option/question text in data/exams/*.json,")
        print("then rewrite the explanation without typo hedging.")
    else:
        for hit in hits:
            print(
                f"{hit.year}/{hit.question_id}\t{hit.correct_answer_id}\t{hit.pattern_label}"
            )

    return 1


if __name__ == "__main__":
    sys.exit(main())
