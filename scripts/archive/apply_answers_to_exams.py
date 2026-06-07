"""
Merge answered questions from answered-pools/ into root exam JSON files.

- Does NOT modify answered-pools/ (read-only).
- Strips [cite: ...] markers from all text fields written to exams.
- Prefixes reference with "{topic} - " when not already present.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ANSWERED_DIR = ROOT / "answered-pools"
EXAM_FILES = ["final19.json", "final21.json", "final24.json", "final25.json"]

# [cite: 23], [cite:], [cite:23], optional whitespace inside brackets
CITE_PATTERN = re.compile(r"\[cite\s*:[^\]]*\]", re.IGNORECASE)


def strip_cites(text: str | None) -> str | None:
    if text is None:
        return None
    if not isinstance(text, str):
        return text
    cleaned = CITE_PATTERN.sub("", text)
    cleaned = re.sub(r"  +", " ", cleaned)
    cleaned = re.sub(r" +\.", ".", cleaned)
    return cleaned.strip()


def clean_value(value):
    """Recursively strip cite markers from strings in question payloads."""
    if isinstance(value, str):
        return strip_cites(value)
    if isinstance(value, list):
        return [clean_value(v) for v in value]
    if isinstance(value, dict):
        return {k: clean_value(v) for k, v in value.items()}
    return value


def format_reference(topic: str | None, reference: str | None) -> str | None:
    if not reference:
        return None
    topic = strip_cites(topic) or ""
    ref = strip_cites(reference) or ""
    if not ref:
        return None
    if not topic:
        return ref

    chapter_prefix = f"{topic} - "
    if ref.startswith(chapter_prefix):
        return ref
    if ref.startswith(topic):
        rest = ref[len(topic) :].lstrip()
        if rest.startswith("-"):
            rest = rest.lstrip("-").lstrip()
        return f"{topic} - {rest}" if rest else topic
    return f"{chapter_prefix}{ref}"


def load_answer_index() -> dict[tuple[str, str], dict]:
    """Map (exam filename, question id) -> answered question record."""
    index: dict[tuple[str, str], dict] = {}
    duplicates: list[tuple[str, str]] = []

    for path in sorted(ANSWERED_DIR.glob("chapter-*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        for q in data.get("questions") or []:
            source_file = q.get("sourceFile")
            qid = q.get("sourceQuestionId") or q.get("id")
            if not source_file or not qid:
                continue
            key = (source_file, str(qid))
            if key in index:
                duplicates.append(key)
            index[key] = q

    if duplicates:
        print(f"Warning: {len(duplicates)} duplicate keys in answered-pools (last wins).")
    return index


def apply_to_exam(path: Path, index: dict[tuple[str, str], dict]) -> dict:
    questions = json.loads(path.read_text(encoding="utf-8"))
    stats = {"updated": 0, "missing": 0, "already_complete": 0}

    for q in questions:
        qid = q.get("id")
        key = (path.name, str(qid)) if qid else None
        answered = index.get(key) if key else None

        if not answered:
            stats["missing"] += 1
            continue

        topic = answered.get("topic") or q.get("topic")
        answer_id = answered.get("correctAnswerId")
        explanation = strip_cites(answered.get("explanation"))
        reference = format_reference(topic, answered.get("reference"))

        had_all = (
            q.get("correctAnswerId") is not None
            and q.get("explanation")
            and q.get("reference")
        )

        if answer_id is not None:
            q["correctAnswerId"] = answer_id
        if explanation:
            q["explanation"] = explanation
        if reference:
            q["reference"] = reference

        # Clean cite markers from existing exam text fields
        if q.get("questionText"):
            q["questionText"] = strip_cites(q["questionText"])
        if q.get("context"):
            q["context"] = strip_cites(q["context"])
        for opt in q.get("options") or []:
            if opt.get("content"):
                opt["content"] = strip_cites(opt["content"])

        if had_all and answer_id and explanation and reference:
            stats["already_complete"] += 1
        elif answer_id and explanation and reference:
            stats["updated"] += 1
        else:
            stats["missing"] += 1  # partial answer in source

    path.write_text(json.dumps(questions, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return stats


def main() -> None:
    if not ANSWERED_DIR.is_dir():
        raise SystemExit(f"Missing directory: {ANSWERED_DIR}")

    index = load_answer_index()
    print(f"Loaded {len(index)} answered questions from answered-pools/")

    totals = {"updated": 0, "missing": 0, "already_complete": 0, "exam_questions": 0}

    for name in EXAM_FILES:
        path = ROOT / name
        if not path.exists():
            print(f"Skip missing exam file: {name}")
            continue
        exam_count = len(json.loads(path.read_text(encoding="utf-8")))
        stats = apply_to_exam(path, index)
        totals["exam_questions"] += exam_count
        totals["updated"] += stats["updated"]
        totals["missing"] += stats["missing"]
        totals["already_complete"] += stats["already_complete"]
        filled = exam_count - stats["missing"]
        print(
            f"{name}: {filled}/{exam_count} with answer+explanation+reference "
            f"({stats['updated']} newly filled)"
        )

    still_missing = []
    for name in EXAM_FILES:
        path = ROOT / name
        if not path.exists():
            continue
        for q in json.loads(path.read_text(encoding="utf-8")):
            if not (q.get("correctAnswerId") and q.get("explanation") and q.get("reference")):
                still_missing.append((name, q.get("id"), q.get("topic")))

    if still_missing:
        print(f"\nStill incomplete: {len(still_missing)} questions")
        for item in still_missing[:15]:
            print(f"  - {item[0]} {item[1]} ({item[2]})")
        if len(still_missing) > 15:
            print(f"  ... and {len(still_missing) - 15} more")
    else:
        print("\nAll exam questions have answer, explanation, and reference.")


if __name__ == "__main__":
    main()
