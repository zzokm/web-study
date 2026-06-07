"""Re-parse all questions with book sourceRefs after citation→global (+21) fix."""

from __future__ import annotations

import json
import re
from pathlib import Path

import _bootstrap  # noqa: F401

from slide_ref import (
    BOOK_CITATION_TO_GLOBAL_OFFSET,
    chapter_from_topic,
    enrich_question_sources,
    lecture_id,
    load_book_manifest,
    load_manifest,
)

ROOT = Path(__file__).resolve().parents[1]
TEXTBOOK_PAGE_RE = re.compile(r"Textbook Page (\d+)", re.I)


def cite_reference_text(text: str, chapter: int, book_manifest: dict) -> str:
    """Show cited page numbers in prose (global → cited when needed)."""
    if not chapter:
        return text or ""
    ch = book_manifest["chapters"].get(lecture_id(chapter))
    if not ch:
        return text or ""
    start, end = ch["bookPageRange"]

    def repl(m: re.Match[str]) -> str:
        n = int(m.group(1))
        if start <= n <= end:
            cited = n - BOOK_CITATION_TO_GLOBAL_OFFSET
            return f"Textbook Page {cited}"
        return m.group(0)

    return TEXTBOOK_PAGE_RE.sub(repl, text or "")


def reparse_question(q: dict, manifest: dict, book_manifest: dict) -> bool:
    if not q.get("sourceRefs"):
        return False
    ch = chapter_from_topic(q.get("topic", "")) or 0
    if q.get("reference"):
        q["reference"] = cite_reference_text(q["reference"], ch, book_manifest)
    enrich_question_sources(q, manifest, book_manifest)
    return True


def process_file(path: Path, manifest: dict, book_manifest: dict) -> int:
    data = json.loads(path.read_text(encoding="utf-8"))
    n = 0
    if isinstance(data, list):
        for q in data:
            if reparse_question(q, manifest, book_manifest):
                n += 1
    elif isinstance(data, dict) and "questions" in data:
        for q in data["questions"]:
            if reparse_question(q, manifest, book_manifest):
                n += 1
        if "questions" in data.get("questions", []):  # repetitive wrapper
            pass
    elif isinstance(data, dict) and "questions" in data.get("questions", []):
        pass
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return n


def main() -> None:
    manifest = load_manifest()
    book_manifest = load_book_manifest()

    # Remove deprecated printedPageStart from manifest
    for ch in book_manifest.get("chapters", {}).values():
        ch.pop("printedPageStart", None)
    (ROOT / "data" / "manifests" / "book.json").write_text(
        json.dumps(book_manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    total = 0
    for pool in (ROOT / "data" / "pools").glob("chapter-*.json"):
        n = process_file(pool, manifest, book_manifest)
        print(f"{pool.name}: {n}")
        total += n

    for name in (
        "data/exams/2019.json",
        "data/exams/2021.json",
        "data/exams/2024.json",
        "data/exams/2025.json",
    ):
        p = ROOT / name
        if p.is_file():
            n = process_file(p, manifest, book_manifest)
            print(f"{name}: {n}")
            total += n

    rep = ROOT / "data" / "repetitive-questions.json"
    if rep.is_file():
        data = json.loads(rep.read_text(encoding="utf-8"))
        n = 0
        for q in data.get("questions", []):
            if reparse_question(q, manifest, book_manifest):
                n += 1
        rep.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"repetitive-questions.json: {n}")
        total += n

    for answered in (ROOT / "data" / "answered").glob("chapter-*.json"):
        n = process_file(answered, manifest, book_manifest)
        print(f"data/answered/{answered.name}: {n}")
        total += n

    print(f"\nRe-parsed {total} questions. Run: cd web && npm run sync")


if __name__ == "__main__":
    main()
