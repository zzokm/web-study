"""Point Ch.7 planning-step refs at slide 8 (fixed diagram) instead of slide 10."""

from __future__ import annotations

import json
import re
from pathlib import Path

from slide_ref import enrich_question_sources, load_book_manifest, load_manifest

ROOT = Path(__file__).resolve().parents[2]
CH7_S10 = re.compile(r"ch7:s10\b", re.I)
CH7_S8 = "ch7:s8"

TARGETS = [
    ROOT / "data" / "exams" / "2024.json",
    ROOT / "data" / "exams" / "2025.json",
    ROOT / "data" / "pools" / "chapter-7-principles-of-planning.json",
    ROOT / "data" / "answered" / "chapter-7-principles-of-planning.json",
    ROOT / "data" / "repetitive-questions.json",
]


def patch_slide_strings(value: str) -> str:
    return CH7_S10.sub(CH7_S8, value)


def patch_question(q: dict, manifest: dict, book: dict) -> bool:
    changed = False
    for key in ("slideRef",):
        if isinstance(q.get(key), str) and CH7_S10.search(q[key]):
            q[key] = patch_slide_strings(q[key])
            changed = True
    refs = q.get("sourceRefs")
    if refs:
        new_refs = [patch_slide_strings(r) if isinstance(r, str) else r for r in refs]
        if new_refs != refs:
            q["sourceRefs"] = new_refs
            changed = True
    if changed:
        enrich_question_sources(q, manifest, book)
    return changed


def walk_questions(data, manifest: dict, book: dict) -> int:
    n = 0
    if isinstance(data, list):
        for q in data:
            if isinstance(q, dict) and "questionText" in q:
                if patch_question(q, manifest, book):
                    n += 1
    elif isinstance(data, dict):
        qs = data.get("questions")
        if isinstance(qs, list):
            for q in qs:
                if patch_question(q, manifest, book):
                    n += 1
    return n


def main() -> None:
    manifest = load_manifest()
    book = load_book_manifest()
    total = 0
    for path in TARGETS:
        if not path.is_file():
            print(f"skip missing {path}")
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        count = walk_questions(data, manifest, book)
        if count:
            path.write_text(
                json.dumps(data, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
            print(f"{path.name}: updated {count} questions")
            total += count
        else:
            print(f"{path.name}: no ch7:s10 refs")
    print(f"Total: {total}")


if __name__ == "__main__":
    main()
