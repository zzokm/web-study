"""
Append relatedTopics (lecture slugs) to each question in exam JSON files.

Reads per-year allocation maps from data/allocations/{year}.json
(question id -> lecture PDF filename(s)) and writes lectureId slugs from
data/manifests/lectures.json onto every question.

Lecture scope reference: data/lectures/references/front.md, back.md

Usage:
    python scripts/apply_topic_allocations.py
    python scripts/apply_topic_allocations.py --dry-run
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import _bootstrap  # noqa: F401

ROOT = _bootstrap.REPO_ROOT
MANIFEST_PATH = ROOT / "data" / "manifests" / "lectures.json"

# Allocation key in file -> question id in exam JSON (when they differ)
ALLOC_KEY_TO_EXAM_ID: dict[str, dict[str, str]] = {
    "2025": {
        "q22": "q22_23a",
        "q23": "q23b",
        "part_two_q3": "q81",
    },
}

EXAM_CONFIG: list[tuple[str, str, str]] = [
    ("2021", "data/allocations/2021.json", "data/exams/2021.json"),
    ("2024", "data/allocations/2024.json", "data/exams/2024.json"),
    ("2025", "data/allocations/2025.json", "data/exams/2025.json"),
]

LECTURE_FILE_RE = re.compile(r"lec-\d+[-\w]+\.pdf", re.IGNORECASE)


def load_lecture_file_map(manifest: dict) -> dict[str, str]:
    """Map lecture filename -> lectureId slug (e.g. fe-1, be-4)."""
    out: dict[str, str] = {}
    for lecture_id, meta in manifest.get("lectures", {}).items():
        filename = meta.get("lectureFile", "").strip().lower()
        if filename:
            out[filename] = lecture_id
    return out


def parse_allocation_value(raw: str, file_map: dict[str, str]) -> list[str]:
    """Split 'a.pdf / b.pdf' and resolve each to a lectureId slug."""
    topics: list[str] = []
    seen: set[str] = set()

    for match in LECTURE_FILE_RE.finditer(raw):
        filename = match.group(0).lower()
        lecture_id = file_map.get(filename)
        if not lecture_id:
            raise KeyError(f"Unknown lecture file in allocation: {filename}")
        if lecture_id not in seen:
            seen.add(lecture_id)
            topics.append(lecture_id)

    if not topics:
        raise ValueError(f"No lecture files found in allocation value: {raw!r}")

    return topics


def build_exam_topic_map(
    allocation: dict[str, str],
    file_map: dict[str, str],
    year: str,
) -> dict[str, list[str]]:
    aliases = ALLOC_KEY_TO_EXAM_ID.get(year, {})
    exam_topics: dict[str, list[str]] = {}

    for alloc_key, raw_value in allocation.items():
        exam_id = aliases.get(alloc_key, alloc_key)
        exam_topics[exam_id] = parse_allocation_value(raw_value, file_map)

    return exam_topics


def iter_questions(exam_blocks: list[dict]):
    for block in exam_blocks:
        for question in block.get("questions", []):
            yield question


def apply_to_exam(
    exam_path: Path,
    exam_topics: dict[str, list[str]],
    *,
    dry_run: bool,
) -> tuple[int, list[str], list[str]]:
    blocks = json.loads(exam_path.read_text(encoding="utf-8"))
    applied = 0
    missing: list[str] = []
    unknown_alloc_keys: list[str] = []

    exam_ids = {q["id"] for q in iter_questions(blocks)}
    for exam_id in sorted(exam_topics):
        if exam_id not in exam_ids:
            unknown_alloc_keys.append(exam_id)

    for question in iter_questions(blocks):
        qid = question["id"]
        topics = exam_topics.get(qid, [])
        if not topics:
            missing.append(qid)
        question["relatedTopics"] = topics
        applied += 1

    if not dry_run:
        exam_path.write_text(
            json.dumps(blocks, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    return applied, missing, unknown_alloc_keys


def resolve_allocation_path(relative_path: str) -> Path:
    path = ROOT / relative_path
    if not path.is_file():
        raise FileNotFoundError(f"Allocation file not found: {path}")
    return path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Report changes without writing exam JSON files",
    )
    args = parser.parse_args()

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    file_map = load_lecture_file_map(manifest)

    exit_code = 0

    for year, alloc_name, exam_rel in EXAM_CONFIG:
        alloc_path = resolve_allocation_path(alloc_name)
        exam_path = ROOT / exam_rel
        allocation = json.loads(alloc_path.read_text(encoding="utf-8"))
        exam_topics = build_exam_topic_map(allocation, file_map, year)

        applied, missing, unknown_alloc_keys = apply_to_exam(
            exam_path,
            exam_topics,
            dry_run=args.dry_run,
        )

        print(f"\n{year} ({exam_rel})")
        print(f"  allocation entries: {len(allocation)}")
        print(f"  questions updated:  {applied}")
        print(f"  without mapping:    {len(missing)}")
        if missing:
            print(f"    {', '.join(missing)}")
            exit_code = 1
        if unknown_alloc_keys:
            print(f"  alloc keys with no matching question: {', '.join(unknown_alloc_keys)}")
            exit_code = 1

    if args.dry_run:
        print("\n(dry-run — no files written)")
    else:
        print("\nDone — exam JSON files updated.")

    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
