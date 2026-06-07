"""
Find exam questions where cited slideRef pages do not contain the correct answer,
but another slide in the course does (strong signal of wrong reference).

Writes docs/audits/reference-mismatch-report.md
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path

import _bootstrap  # noqa: F401

from slide_ref import ROOT, get_lecture_manifest, resolve_pdf

EXAM_FILES = [
    "data/exams/2019.json",
    "data/exams/2021.json",
    "data/exams/2024.json",
    "data/exams/2025.json",
]
REPORT_PATH = ROOT / "docs" / "audits" / "reference-mismatch-report.md"

IN_CHAPTER_RE = re.compile(
    r"\b(?:in|from|defined in|found in|listed on)\s+Chapter\s+(\d+)\b",
    re.I,
)
REF_CHAPTER_SLIDE_RE = re.compile(
    r"Chapter\s+(\d+)[^.;]{0,120}?\bSlide\s+(\d+)",
    re.I,
)

_pdf_page_cache: dict[tuple[str, int], str] = {}


def normalize(text: str) -> str:
    t = (text or "").lower()
    t = re.sub(r"[^\w\s]", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def get_correct_answer_text(q: dict) -> str:
    aid = (q.get("correctAnswerId") or "").strip()
    for opt in q.get("options") or []:
        if str(opt.get("id", "")).strip().lower() == aid.lower():
            return opt.get("content") or ""
    return ""


def text_match_score(needle: str, haystack: str) -> float:
    n = normalize(needle)
    h = normalize(haystack)
    if not n or not h:
        return 0.0
    if len(n) < 6:
        return 1.0 if n in h else 0.0
    if n in h:
        return 1.0
    words = [w for w in n.split() if len(w) > 3]
    if not words:
        return 0.0
    hits = sum(1 for w in words if w in h)
    return hits / len(words)


def page_text(pdf_path: Path, page: int) -> str:
    key = (str(pdf_path), page)
    if key not in _pdf_page_cache:
        from pypdf import PdfReader

        reader = PdfReader(str(pdf_path))
        _pdf_page_cache[key] = reader.pages[page - 1].extract_text() or ""
    return _pdf_page_cache[key]


def find_answer_locations(answer: str, manifest: dict, min_score: float = 0.72) -> list[dict]:
    """Return [{lectureId, page, score}] sorted by score desc."""
    hits: list[dict] = []
    for lid, lec in manifest.items():
        pdf_path = ROOT / lec["pdfPath"]
        for page in range(1, lec["pageCount"] + 1):
            score = text_match_score(answer, page_text(pdf_path, page))
            if score >= min_score:
                hits.append({"lectureId": lid, "page": page, "score": round(score, 3)})
    hits.sort(key=lambda x: (-x["score"], x["lectureId"], x["page"]))
    return hits


def cited_locations(parsed: dict) -> list[tuple[str, int]]:
    lid = parsed.get("lectureId")
    pages = parsed.get("pages") or []
    return [(lid, p) for p in pages]


def is_true_false(q: dict) -> bool:
    opts = q.get("options") or []
    if len(opts) != 2:
        return False
    contents = {normalize(o.get("content", "")) for o in opts}
    return contents <= {"true", "false"}


@dataclass
class Finding:
    exam: str
    qid: str
    topic: str
    slide_ref: str
    correct_answer: str
    issues: list[str] = field(default_factory=list)
    suggested: str | None = None


def analyze_question(exam: str, q: dict, manifest: dict) -> Finding | None:
    parsed = q.get("slideRefParsed") or {}
    kind = parsed.get("kind") or ""
    slide_ref = q.get("slideRef") or ""
    answer = get_correct_answer_text(q)
    explanation = q.get("explanation") or ""
    reference = q.get("reference") or ""

    finding = Finding(
        exam=exam,
        qid=q.get("id") or "?",
        topic=q.get("topic") or "",
        slide_ref=slide_ref,
        correct_answer=(answer[:100] + "…") if len(answer) > 100 else answer,
    )

    # Chapter cited in explanation vs slide deck
    m = IN_CHAPTER_RE.search(explanation)
    slide_ch = parsed.get("chapterNumber")
    if m and slide_ch and int(m.group(1)) != slide_ch:
        finding.issues.append(
            f"Explanation cites Chapter {m.group(1)} but slideRef is `{slide_ref}`."
        )

    for ref_ch, ref_slide in REF_CHAPTER_SLIDE_RE.findall(reference):
        if slide_ch and int(ref_ch) != slide_ch:
            finding.issues.append(
                f"Reference names Chapter {ref_ch} Slide {ref_slide}; slideRef uses ch{slide_ch}."
            )

    if kind not in ("slides",) or not parsed.get("pages"):
        return finding if finding.issues else None

    if is_true_false(q):
        return finding if finding.issues else None

    if len(normalize(answer)) < 10:
        return finding if finding.issues else None

    # Where does the answer actually appear?
    locations = find_answer_locations(answer, manifest)
    if not locations:
        return finding if finding.issues else None

    cited = set(cited_locations(parsed))
    cited_scores = [
        loc["score"]
        for loc in locations
        if (loc["lectureId"], loc["page"]) in cited
    ]
    best = locations[0]
    best_key = (best["lectureId"], best["page"])

    if cited_scores and max(cited_scores) >= 0.72:
        return finding if finding.issues else None

    # Answer is on a different slide than cited
    if best_key not in cited:
        finding.issues.append(
            f"Correct answer not on cited pages {parsed.get('pages')}; "
            f"best match: {best['lectureId']}:s{best['page']} (score {best['score']})."
        )
        finding.suggested = f"{best['lectureId']}:s{best['page']}"

    return finding if finding.issues else None


def main() -> None:
    manifest = get_lecture_manifest()
    findings: list[Finding] = []

    for name in EXAM_FILES:
        questions = json.loads((ROOT / name).read_text(encoding="utf-8"))  # name is repo-relative
        for q in questions:
            f = analyze_question(name, q, manifest)
            if f:
                findings.append(f)

    lines = [
        "# Reference / answer mismatch report",
        "",
        "Generated by `validate_answer_refs.py`. Compares correct-answer text on cited PDF pages vs where it actually appears in lecture decks.",
        "",
        f"**Flagged:** {len(findings)} question(s)",
        "",
    ]

    for f in findings:
        lines.append(f"## {f.exam} · {f.qid}")
        lines.append(f"- **Topic:** {f.topic}")
        lines.append(f"- **slideRef:** `{f.slide_ref}`")
        lines.append(f"- **Correct answer:** {f.correct_answer}")
        for issue in f.issues:
            lines.append(f"- {issue}")
        if f.suggested:
            lines.append(f"- **Suggested slideRef:** `{f.suggested}`")
        lines.append("")

    if not findings:
        lines.append("No mismatches detected.")

    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"Flagged {len(findings)} -> {REPORT_PATH}")
    for f in findings:
        print(f"  {f.exam} {f.qid}: {f.suggested or f.issues[0]}")


if __name__ == "__main__":
    main()
