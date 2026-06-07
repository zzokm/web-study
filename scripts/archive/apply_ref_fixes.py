"""Apply verified slideRef fixes from REFERENCE_MISMATCH_REPORT."""
from __future__ import annotations

import json
from pathlib import Path

from slide_ref import parse_slide_ref

ROOT = Path(__file__).resolve().parent

# (exam_file, question_id, new_slide_ref, new_reference)
FIXES: list[tuple[str, str, str, str]] = [
    (
        "final21.json",
        "Q26",
        "ch1:s11",
        "Chapter 1: Introduction - Slide 11 lists controlling common mistakes; "
        '"not monitoring progress in carrying out plans" is the controlling error.',
    ),
    (
        "final21.json",
        "Q36",
        "ch1:s20",
        "Chapter 1: Introduction - Slide 20 (management skills) lists physical skills "
        "among qualifications in a job specification.",
    ),
    (
        "final24.json",
        "Q17",
        "ch21:s4",
        "Chapter 21: Controlling Fundamentals - Slide 4 states planning and control are "
        'the "Siamese twins of management."',
    ),
    (
        "final24.json",
        "Q53",
        "ch8:s16",
        "Chapter 8: Making Decisions - Slide 16 covers selecting the most beneficial alternative.",
    ),
    (
        "final25.json",
        "Q33",
        "ch13:s26",
        "Chapter 13: Human Resource Management - Slide 26 defines selection in the HRM process.",
    ),
    (
        "final25.json",
        "Q43",
        "ch8:s16",
        "Chapter 8: Making Decisions - Slide 16 covers selecting the most beneficial alternative.",
    ),
    # Planning process — avoid ch7:s8/s10 (blank diagrams); see CH7_BLOCKED_SLIDE_PAGES
    (
        "final24.json",
        "Q40",
        "ch7:s4",
        "Chapter 7: Principles of Planning - Answer supported by the definition of planning on Slide 4 "
        "(analyzing, evaluating, and selecting among opportunities).",
    ),
    (
        "final25.json",
        "Q20",
        "ch7:s4",
        "Chapter 7: Principles of Planning - Answer supported by the definition of planning on Slide 4 "
        "(selecting among opportunities to reach objectives).",
    ),
    (
        "final24.json",
        "Q42",
        "ch8:s16",
        "Chapter 8: Making Decisions - Slide 16 covers evaluating alternatives and selecting "
        "the most beneficial alternative.",
    ),
    (
        "final25.json",
        "Q24",
        "ch8:s16",
        "Chapter 8: Making Decisions - Slide 16 covers evaluating alternatives before selection.",
    ),
    (
        "final24.json",
        "Q47",
        "ch7:s4",
        "Chapter 7: Principles of Planning - Answer supported by the definition of planning on Slide 4 "
        "(future-oriented analysis and assumptions for action programs).",
    ),
    (
        "final24.json",
        "Q57",
        "ch7:s4",
        "Chapter 7: Principles of Planning - Answer supported by the planning definition on Slide 4 "
        "(assumptions about foreseen opportunities / future conditions).",
    ),
    (
        "final25.json",
        "Q27",
        "ch7:s4",
        "Chapter 7: Principles of Planning - Answer supported by the definition of planning on Slide 4 "
        "(assumptions about future conditions for action programs).",
    ),
]

POOL_FILES = list((ROOT / "question-pools-by-lecture").glob("*.json"))
REPETITIVE_PATH = ROOT / "repetitive-questions.json"


def main() -> None:
    from slide_ref import load_manifest

    manifest = load_manifest()
    for exam, qid, slide_ref, reference in FIXES:
        path = ROOT / exam
        data = json.loads(path.read_text(encoding="utf-8"))
        for q in data:
            if q.get("id") == qid:
                q["reference"] = reference
                q["slideRef"] = slide_ref
                q["slideRefParsed"] = parse_slide_ref(slide_ref, manifest)
                print(f"Fixed {exam} {qid} -> {slide_ref}")
                break
        else:
            print(f"MISSING {exam} {qid}")
            continue
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    for pool_path in POOL_FILES:
        if pool_path.name.startswith("_"):
            continue
        pool = json.loads(pool_path.read_text(encoding="utf-8"))
        changed = False
        for q in pool.get("questions", []):
            for exam, qid, slide_ref, reference in FIXES:
                if (
                    q.get("sourceFile") == exam
                    and (q.get("sourceQuestionId") or q.get("id")) == qid
                ):
                    q["reference"] = reference
                    q["slideRef"] = slide_ref
                    q["slideRefParsed"] = parse_slide_ref(slide_ref, manifest)
                    changed = True
                    print(f"Pool {pool_path.name}: {qid} -> {slide_ref}")
        if changed:
            pool_path.write_text(
                json.dumps(pool, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
            )

    # Sync repetitive-questions.json stems when origin matches a fixed exam question
    if REPETITIVE_PATH.exists():
        repetitive = json.loads(REPETITIVE_PATH.read_text(encoding="utf-8"))
        lookup = {(exam, qid): (slide, ref) for exam, qid, slide, ref in FIXES}
        changed_rep = False
        for rq in repetitive.get("questions", []):
            key = (rq.get("sourceFile"), rq.get("sourceQuestionId") or rq.get("id"))
            if key in lookup:
                slide, ref = lookup[key]
                rq["reference"] = ref
                rq["slideRef"] = slide
                rq["slideRefParsed"] = parse_slide_ref(slide, manifest)
                changed_rep = True
                print(f"Repetitive stem {rq.get('id')} ({key[0]} {key[1]}) -> {slide}")
        if changed_rep:
            REPETITIVE_PATH.write_text(
                json.dumps(repetitive, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )


if __name__ == "__main__":
    main()
