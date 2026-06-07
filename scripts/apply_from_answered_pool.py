"""
Apply a reviewed answered-pools/*.json file to question pools, exams, and repetitive questions.

Usage:
  python scripts/apply_from_answered_pool.py data/answered/chapter-21-controlling-fundamentals.json

Workflow for new chapter updates:
  1. Edit or create data/answered/<slug>.json (dual refs: chN:s* slides, chN,p* textbook).
  2. Set printedPageStart in data/manifests/book.json for that chapter if using footer page numbers.
  3. Run this script, then: cd web && npm run sync
"""

from __future__ import annotations

import json
import re
import sys
from copy import deepcopy
from pathlib import Path

import _bootstrap  # noqa: F401 — adds scripts/lib to sys.path

from slide_ref import enrich_question_sources, load_book_manifest, load_manifest

ROOT = Path(__file__).resolve().parents[1]
ANSWERED_DIR = ROOT / "data" / "answered"
POOLS_DIR = ROOT / "data" / "pools"
EXAM_FILES = {
    "data/exams/2019.json": ROOT / "data" / "exams" / "2019.json",
    "data/exams/2021.json": ROOT / "data" / "exams" / "2021.json",
    "data/exams/2024.json": ROOT / "data" / "exams" / "2024.json",
    "data/exams/2025.json": ROOT / "data" / "exams" / "2025.json",
}
REPETITIVE = ROOT / "data" / "repetitive-questions.json"

CITE_RE = re.compile(r"\[cite:\s*[^\]]+\]")
TEXTBOOK_PAGE_RE = re.compile(r"Textbook Page (\d+)", re.I)
CHAPTER_TOPIC_RE = re.compile(r"Chapter\s+(\d+)\s*:", re.I)
POOL_ONLY_KEYS = frozenset(
    {"poolIndex", "origin", "sourceFile", "sourceQuestionId", "questionType"}
)


def strip_cites(text: str) -> str:
    return CITE_RE.sub("", text).strip() if text else ""


def exam_key(q: dict) -> tuple[str, str]:
    return (q["sourceFile"], q["sourceQuestionId"] or q["id"])


def pool_key(q: dict) -> tuple[str, str]:
    return (q.get("origin", ""), q.get("sourceQuestionId") or q.get("id", ""))


def chapter_from_topic(topic: str) -> int:
    m = CHAPTER_TOPIC_RE.search(topic or "")
    return int(m.group(1)) if m else 0


def extract_book_pages(reference: str) -> list[int]:
    return sorted({int(m.group(1)) for m in TEXTBOOK_PAGE_RE.finditer(reference or "")})


def book_page_spec(pages: list[int]) -> str:
    from slide_ref import compress_pages

    return compress_pages(pages)[1:]  # compress_pages prefixes "s"


def infer_source_refs(q: dict, slide_ref: str | None) -> list[str] | None:
    """Build sourceRefs from explicit field, or textbook pages + prior slideRef."""
    if q.get("sourceRefs"):
        return q["sourceRefs"]
    ch = chapter_from_topic(q.get("topic", ""))
    if not ch:
        return None
    refs: list[str] = []
    if slide_ref:
        refs.append(slide_ref)
    pages = extract_book_pages(strip_cites(q.get("reference", "")))
    if pages:
        refs.append(f"ch{ch},p{book_page_spec(pages)}")
    return refs or None


def prepare_answered_question(
    q: dict,
    prior_by_pool_key: dict[tuple[str, str], dict],
) -> dict:
    """Return answered question with sourceRefs filled when missing."""
    prepared = dict(q)
    prior = prior_by_pool_key.get(pool_key(q))
    slide_ref = prior.get("slideRef") if prior else None
    refs = infer_source_refs(prepared, slide_ref)
    if refs:
        prepared["sourceRefs"] = refs
    return prepared


def content_fields(q: dict) -> dict:
    """Fields copied from answered pool into live question records."""
    out = {
        "explanation": strip_cites(q.get("explanation", "")),
        "reference": strip_cites(q.get("reference", "")),
        "correctAnswerId": q.get("correctAnswerId"),
        "sourceRefs": q.get("sourceRefs"),
    }
    if q.get("questionText"):
        out["questionText"] = q["questionText"]
    if q.get("options"):
        out["options"] = q["options"]
    if q.get("context") is not None:
        out["context"] = q["context"]
    return out


def apply_content(target: dict, source: dict, manifest: dict, book_manifest: dict) -> list[str]:
    """Merge answered content into target; return list of change descriptions."""
    changes: list[str] = []
    before_answer = target.get("correctAnswerId")

    for key, value in content_fields(source).items():
        if value is None:
            continue
        if target.get(key) != value:
            if key == "correctAnswerId":
                changes.append(f"correctAnswerId {before_answer} -> {value}")
            target[key] = value

    if target.get("sourceRefs"):
        enrich_question_sources(target, manifest, book_manifest)
    elif target.get("slideRef"):
        from slide_ref import parse_slide_ref

        target["slideRefParsed"] = parse_slide_ref(target["slideRef"], manifest)

    return changes


def pool_question_from_answered(q: dict, manifest: dict, book_manifest: dict) -> dict:
    row = {
        "id": q["id"],
        "topic": q["topic"],
        "questionText": q["questionText"],
        "context": q.get("context"),
        "options": q["options"],
        "correctAnswerId": q["correctAnswerId"],
        "explanation": strip_cites(q.get("explanation", "")),
        "reference": strip_cites(q.get("reference", "")),
        "origin": q["origin"],
        "sourceFile": q["sourceFile"],
        "sourceQuestionId": q.get("sourceQuestionId") or q["id"],
        "questionType": q.get("questionType"),
        "poolIndex": q.get("poolIndex"),
    }
    refs = q.get("sourceRefs")
    if refs:
        row["sourceRefs"] = refs
        enrich_question_sources(row, manifest, book_manifest)
    return row


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1

    answered_path = Path(sys.argv[1])
    if not answered_path.is_file():
        candidate = ANSWERED_DIR / answered_path.name
        if candidate.is_file():
            answered_path = candidate
        else:
            print(f"Not found: {sys.argv[1]}")
            return 1

    pool = json.loads(answered_path.read_text(encoding="utf-8"))
    slug = pool["slug"]
    dest_pool = POOLS_DIR / f"{slug}.json"
    manifest = load_manifest()
    book_manifest = load_book_manifest()

    prior_by_pool_key: dict[tuple[str, str], dict] = {}
    if dest_pool.is_file():
        existing = json.loads(dest_pool.read_text(encoding="utf-8"))
        prior_by_pool_key = {pool_key(q): q for q in existing.get("questions", [])}

    prepared_questions = [
        prepare_answered_question(q, prior_by_pool_key) for q in pool["questions"]
    ]
    # Persist inferred sourceRefs back into answered-pools for the next edit cycle.
    pool["questions"] = prepared_questions
    answered_path.write_text(
        json.dumps(pool, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    # Build pool file (preserve metadata, re-parse all refs)
    out_pool = {
        "lecture": pool["lecture"],
        "slug": slug,
        "totalQuestions": pool["totalQuestions"],
        "originsBreakdown": pool["originsBreakdown"],
        "questions": [
            pool_question_from_answered(q, manifest, book_manifest)
            for q in prepared_questions
        ],
    }
    dest_pool.write_text(
        json.dumps(out_pool, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"Wrote pool: {dest_pool.relative_to(ROOT)} ({len(out_pool['questions'])} questions)")

    by_exam = {exam_key(q): q for q in prepared_questions}
    all_answer_changes: list[str] = []

    for fname, path in EXAM_FILES.items():
        if not path.is_file():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        n = 0
        for q in data:
            if q.get("topic") != pool["lecture"]:
                continue
            src = by_exam.get((fname, q["id"]))
            if not src:
                continue
            ch = apply_content(q, src, manifest, book_manifest)
            for c in ch:
                if c.startswith("correctAnswerId"):
                    all_answer_changes.append(f"{fname} {q['id']}: {c}")
            n += 1
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"Updated {fname}: {n} questions")

    if REPETITIVE.is_file():
        rep = json.loads(REPETITIVE.read_text(encoding="utf-8"))
        n_rep = 0
        for rq in rep.get("questions", []):
            if rq.get("topic") != pool["lecture"]:
                continue
            src = by_exam.get(exam_key(rq))
            if not src:
                src = next(
                    (
                        q
                        for q in pool["questions"]
                        if (q.get("sourceQuestionId") or q["id"])
                        == (rq.get("sourceQuestionId") or rq.get("id"))
                        and q.get("origin") == rq.get("origin")
                    ),
                    None,
                )
            if not src:
                continue
            apply_content(rq, src, manifest, book_manifest)
            n_rep += 1
        REPETITIVE.write_text(
            json.dumps(rep, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        print(f"Updated repetitive-questions.json: {n_rep} questions")

    if all_answer_changes:
        print("\n*** ANSWER CHANGES ***")
        for line in all_answer_changes:
            print(line)
    else:
        print("\nNo correctAnswerId changes (refs/explanations only).")

    print("\nNext: cd web && npm run sync")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
