"""
Add slideRef + slideRefParsed to all exam questions from reference text.
Writes docs/audits/slide-ref-validation.md for human review.
Does NOT modify data/answered/.
"""

from __future__ import annotations

import json
from pathlib import Path

import _bootstrap  # noqa: F401

from slide_ref import (
    build_manifest,
    build_slide_ref,
    chapter_from_topic,
    expand_pages,
    extract_slide_numbers,
    load_manifest,
    parse_slide_ref,
)

ROOT = Path(__file__).resolve().parents[1]
EXAM_FILES = [
    "data/exams/2019.json",
    "data/exams/2021.json",
    "data/exams/2024.json",
    "data/exams/2025.json",
]
REPORT_PATH = ROOT / "docs" / "audits" / "slide-ref-validation.md"


def apply_to_exams(manifest: dict) -> tuple[list[dict], list[dict]]:
    rows: list[dict] = []
    errors: list[dict] = []

    for name in EXAM_FILES:
        path = ROOT / name
        questions = json.loads(path.read_text(encoding="utf-8"))
        for q in questions:
            topic = q.get("topic")
            ch = chapter_from_topic(topic)
            ref = q.get("reference") or ""
            qid = q.get("id")

            try:
                if ch is None:
                    raise ValueError(f"Cannot parse chapter from topic: {topic}")
                slide_ref, parsed = build_slide_ref(ch, ref, manifest)
                # Round-trip check
                reparsed = parse_slide_ref(slide_ref, manifest)
                if reparsed["pages"] != parsed["pages"] or reparsed["kind"] != parsed["kind"]:
                    raise ValueError("Round-trip mismatch")

                q["slideRef"] = slide_ref
                q["slideRefParsed"] = parsed

                extracted = extract_slide_numbers(ref)
                rows.append(
                    {
                        "exam": name,
                        "id": qid,
                        "topic": topic,
                        "reference": ref,
                        "extractedSlides": extracted,
                        "slideRef": slide_ref,
                        "parsedPages": parsed["pages"],
                        "kind": parsed["kind"],
                        "ok": True,
                    }
                )
            except Exception as e:
                errors.append({"exam": name, "id": qid, "reference": ref, "error": str(e)})
                rows.append(
                    {
                        "exam": name,
                        "id": qid,
                        "topic": topic,
                        "reference": ref,
                        "extractedSlides": extract_slide_numbers(ref),
                        "slideRef": None,
                        "parsedPages": [],
                        "kind": "error",
                        "ok": False,
                        "error": str(e),
                    }
                )

        path.write_text(json.dumps(questions, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    return rows, errors


def write_report(rows: list[dict], errors: list[dict], manifest: dict) -> None:
    lines: list[str] = []
    w = lines.append

    w("# Slide reference validation report")
    w("")
    w("## Syntax")
    w("")
    w("```")
    w("slideRef = {lectureId}:{slideSpec}")
    w("lectureId  = ch1 | ch2 | ch3 | ch7 | ch8 | ch11 | ch13 | ch15 | ch18 | ch21")
    w("slideSpec  = s9 | s18-19 | s7,8 | s36-39 | all | course")
    w("```")
    w("")
    w("Slide numbers map 1:1 to PDF page index in `assets/lectures/` (1-based).")
    w("")
    w("## Lecture manifest")
    w("")
    w("| lectureId | Chapter | PDF | Pages |")
    w("|-----------|---------|-----|------:|")
    for lid, lec in sorted(manifest["lectures"].items(), key=lambda x: x[1]["chapterNumber"]):
        w(f"| `{lid}` | {lec['topic']} | `{lec['lectureFile']}` | {lec['pageCount']} |")
    w("")
    w(f"## Summary")
    w("")
    ok = sum(1 for r in rows if r["ok"])
    w(f"- **{ok}/{len(rows)}** questions parsed successfully")
    w(f"- **{len(errors)}** errors")
    w("")

    if errors:
        w("### Errors")
        w("")
        for e in errors:
            w(f"- `{e['exam']}` `{e['id']}`: {e['error']}")
        w("")

    w("## Full comparison table")
    w("")
    w("| Exam | ID | Kind | Extracted | slideRef | Parsed pages | Match | Reference (truncated) |")
    w("|------|-----|------|-----------|----------|--------------|:-----:|------------------------|")
    for r in rows:
        ext = ",".join(map(str, r["extractedSlides"])) if r["extractedSlides"] else "—"
        parsed = ",".join(map(str, r["parsedPages"])) if r["parsedPages"] else ("—" if r["kind"] != "all" else f"1..")
        if r["kind"] == "all" and r["ok"]:
            parsed = f"1..{manifest['lectures'][r['slideRef'].split(':')[0]]['pageCount']}"
        match = "✓" if r["ok"] else "✗"
        ref = (r["reference"] or "").replace("|", "/")[:70]
        sr = r.get("slideRef") or "—"
        w(
            f"| {r['exam']} | {r['id']} | {r['kind']} | {ext} | `{sr}` | {parsed} | {match} | {ref} |"
        )
    w("")

    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    manifest = build_manifest()
    MANIFEST = ROOT / "data" / "manifests" / "lectures.json"
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {MANIFEST.name}")

    rows, errors = apply_to_exams(manifest)
    write_report(rows, errors, manifest)
    print(f"Wrote {REPORT_PATH.name}")
    print(f"Applied slideRef to {sum(1 for r in rows if r['ok'])}/{len(rows)} questions")
    if errors:
        raise SystemExit(f"{len(errors)} errors — see report")


if __name__ == "__main__":
    main()
