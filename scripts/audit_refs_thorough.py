"""
Thorough reference audit across all exam questions.
Read-only; prints JSON summary and writes REFERENCE_AUDIT_FULL.md

True/False questions are excluded from "answer phrase not found" scans
(searching for "True"/"False" in PDFs is meaningless).
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import _bootstrap  # noqa: F401

from slide_ref import ROOT, get_lecture_manifest

EXAM_FILES = [
    "data/exams/2019.json",
    "data/exams/2021.json",
    "data/exams/2024.json",
    "data/exams/2025.json",
]
OUT = ROOT / "docs" / "audits" / "reference-audit-full.md"

NOT_FOUND_FLAG = "Correct answer phrase not found on any slide (PDF text search)"
TF_CITED_FLAG = (
    "True/False — explanation keywords not on cited slides "
    "(answer True/False is not searched; support may be paraphrased or negated on a diagram)"
)

IN_CH = re.compile(
    r"\b(?:in|from|defined in|found in|listed on|outlined in)\s+Chapter\s+(\d+)\b",
    re.I,
)
REF_CH_SLIDE = re.compile(r"Chapter\s+(\d+)[^.;]{0,140}?\bSlide\s+(\d+)", re.I)
PREFIX_CH = re.compile(r"^Chapter\s+(\d+)", re.I)

_cache: dict[tuple[str, int], str] = {}


def norm(t: str) -> str:
    t = (t or "").lower()
    t = re.sub(r"[^\w\s]", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def page_text(pdf: Path, p: int) -> str:
    k = (str(pdf), p)
    if k not in _cache:
        from pypdf import PdfReader

        _cache[k] = PdfReader(str(pdf)).pages[p - 1].extract_text() or ""
    return _cache[k]


def score(needle: str, hay: str) -> float:
    n, h = norm(needle), norm(hay)
    if not n or not h:
        return 0.0
    if len(n) < 5:
        return 1.0 if n in h else 0.0
    if n in h:
        return 1.0
    words = [w for w in n.split() if len(w) > 3]
    if not words:
        return 0.0
    return sum(1 for w in words if w in h) / len(words)


def answer_text(q: dict) -> str:
    aid = (q.get("correctAnswerId") or "").strip().lower()
    for o in q.get("options") or []:
        if str(o.get("id", "")).strip().lower() == aid:
            return o.get("content") or ""
    return ""


def is_tf(q: dict) -> bool:
    opts = q.get("options") or []
    if len(opts) != 2:
        return False
    return {norm(o.get("content", "")) for o in opts} <= {"true", "false"}


def explanation_phrases(q: dict) -> list[str]:
    """Phrases from explanation for T/F support checks (never True/False)."""
    expl = q.get("explanation") or ""
    phrases: list[str] = []
    for m in re.finditer(r"'([^']{12,})'|\"([^\"]{12,})\"", expl):
        phrases.append(m.group(1) or m.group(2))
    for m in re.finditer(r'"([^"]{10,})"', expl):
        phrases.append(m.group(1))
    # Long clause from question stem (often what the slide supports)
    qt = (q.get("questionText") or "").strip()
    if len(qt) > 20:
        phrases.append(qt)
    return phrases[:5]


def audit_one(exam: str, q: dict, manifest: dict) -> dict | None:
    parsed = q.get("slideRefParsed") or {}
    kind = parsed.get("kind", "")
    slide_ref = q.get("slideRef") or ""
    slide_ch = parsed.get("chapterNumber")
    pages = parsed.get("pages") or []
    lid = parsed.get("lectureId")
    ref = q.get("reference") or ""
    expl = q.get("explanation") or ""
    ans = answer_text(q)
    tf = is_tf(q)
    flags: list[str] = []
    severity = "info"
    suggested = None

    # A–C) Chapter / reference consistency (all question types)
    m = IN_CH.search(expl)
    if m and slide_ch and int(m.group(1)) != slide_ch:
        flags.append(f"Explanation sources Chapter {m.group(1)}; slideRef is {slide_ref}")
        severity = "high"

    for rc, rs in REF_CH_SLIDE.findall(ref):
        if slide_ch and int(rc) != slide_ch:
            flags.append(f"Reference names Ch{rc} Slide {rs}; slideRef is {slide_ref}")
            severity = "high"

    pm = PREFIX_CH.match(ref)
    if pm and slide_ch:
        pch = int(pm.group(1))
        ref_chs = {int(x) for x in re.findall(r"Chapter\s+(\d+)", ref, re.I)}
        if pch != slide_ch and slide_ch not in ref_chs:
            flags.append(f"Reference prefix Chapter {pch} but slideRef is ch{slide_ch}")
            severity = "high"

    if kind != "slides" or not pages:
        if flags:
            return _result(exam, q, flags, severity, suggested, ans, tf)
        return None

    pdf = ROOT / parsed.get("pdfPath", "")
    cited_text = "\n".join(page_text(pdf, p) for p in pages)
    cited_len = len(norm(cited_text))

    if cited_len < 80:
        flags.append(
            f"Cited slide(s) {pages} have little extractable text ({cited_len} chars) — may be image-only"
        )

    # True/False: do not search for "True"/"False" anywhere
    if tf:
        phrases = explanation_phrases(q)
        if phrases:
            best_phrase = max(phrases, key=len)
            cited_best = max(score(best_phrase, cited_text), 0.0)
            if cited_best < 0.45:
                flags.append(TF_CITED_FLAG)
                severity = max(severity, "review", key=_sev_index)
        if not flags:
            return None
        return _result(exam, q, flags, severity, suggested, ans, tf, question_type="true_false")

    if len(norm(ans)) < 10:
        if flags:
            return _result(exam, q, flags, severity, suggested, ans, tf)
        return None

    check_text = ans
    locs = all_locations(check_text, manifest)
    if not locs:
        flags.append(NOT_FOUND_FLAG)
        severity = max(severity, "review", key=_sev_index)
        return _result(
            exam,
            q,
            flags,
            severity,
            suggested,
            ans,
            tf,
            top_matches=[],
            not_found=True,
        )

    cited_set = {(lid, p) for p in pages}
    cited_best = max(
        (loc["score"] for loc in locs if (loc["lid"], loc["page"]) in cited_set),
        default=0.0,
    )
    best = locs[0]
    best_key = (best["lid"], best["page"])

    if best_key not in cited_set and best["score"] >= 0.85:
        if cited_best < 0.5 or best["score"] - cited_best >= 0.35:
            flags.append(
                f"Answer best on {best['lid']}:s{best['page']} (score {best['score']}); "
                f"cited pages score {cited_best:.2f}"
            )
            suggested = f"{best['lid']}:s{best['page']}"
            severity = "high" if best["score"] >= 0.95 and cited_best < 0.3 else "review"

    same_lec = [loc for loc in locs if loc["lid"] == lid and loc["score"] >= 0.9]
    if same_lec and (same_lec[0]["lid"], same_lec[0]["page"]) not in cited_set:
        sp = same_lec[0]
        if cited_best < 0.4:
            alt = f"{sp['lid']}:s{sp['page']}"
            if alt != suggested:
                flags.append(
                    f"Within {lid}, answer fits slide {sp['page']} better than cited {pages}"
                )
                suggested = suggested or alt
                severity = max(severity, "review", key=_sev_index)

    generic = norm(ans) in {
        "both a and b",
        "both (a) and (b)",
        "all of these",
        "all of the above",
        "none of the options is correct",
    }
    if generic and best["score"] >= 0.9:
        flags.append(
            f"Generic answer '{ans}' — PDF match may be false positive (word '{norm(ans)}' elsewhere)"
        )
        severity = "info"

    if not flags:
        return None

    return _result(
        exam,
        q,
        flags,
        severity,
        suggested,
        ans,
        tf,
        top_matches=locs[:5],
        cited_score=cited_best,
    )


def all_locations(text: str, manifest: dict, min_s: float = 0.7) -> list[dict]:
    hits = []
    for lid, lec in manifest.items():
        pdf = ROOT / lec["pdfPath"]
        for p in range(1, lec["pageCount"] + 1):
            s = score(text, page_text(pdf, p))
            if s >= min_s:
                hits.append({"lid": lid, "page": p, "score": round(s, 3)})
    hits.sort(key=lambda x: (-x["score"], x["lid"], x["page"]))
    return hits


def _sev_index(s: str) -> int:
    return ["info", "review", "high"].index(s)


def _result(
    exam: str,
    q: dict,
    flags: list[str],
    severity: str,
    suggested: str | None,
    ans: str,
    tf: bool,
    *,
    top_matches: list | None = None,
    cited_score: float | None = None,
    not_found: bool = False,
    question_type: str = "mcq",
) -> dict:
    return {
        "exam": exam,
        "id": q["id"],
        "topic": q.get("topic"),
        "slideRef": q.get("slideRef"),
        "answer": ans[:100],
        "flags": flags,
        "severity": severity,
        "suggested": suggested,
        "topMatches": top_matches or [],
        "citedScore": cited_score,
        "not_found": not_found,
        "is_tf": tf,
        "question_type": question_type,
    }


def _write_entry(lines: list[str], r: dict) -> None:
    lines.append(f"### {r['exam']} · {r['id']}")
    lines.append(f"- Topic: {r.get('topic', '')}")
    lines.append(f"- slideRef: `{r.get('slideRef', '')}`")
    qtype = "True/False" if r.get("is_tf") else "MCQ / other"
    lines.append(f"- Type: {qtype}")
    lines.append(f"- Answer: {r.get('answer', '')}")
    for f in r["flags"]:
        lines.append(f"- {f}")
    if r.get("suggested"):
        lines.append(f"- **Suggested:** `{r['suggested']}`")
    if r.get("topMatches"):
        tm = ", ".join(
            f"{x['lid']}:s{x['page']}({x['score']})" for x in r["topMatches"][:3]
        )
        lines.append(f"- Top PDF matches: {tm}")
    lines.append("")


def main() -> None:
    manifest = get_lecture_manifest()
    results: list[dict] = []
    tf_total = 0

    for exam in EXAM_FILES:
        for q in json.loads((ROOT / exam).read_text(encoding="utf-8")):
            if is_tf(q):
                tf_total += 1
            r = audit_one(exam, q, manifest)
            if r:
                results.append(r)

    high = [r for r in results if r["severity"] == "high"]
    review_all = [r for r in results if r["severity"] == "review"]

    # Manual review: MCQ "answer not found" only (excludes T/F answer-phrase noise)
    review_not_found_mcq = [
        r
        for r in review_all
        if r.get("not_found") and NOT_FOUND_FLAG in r["flags"] and not r.get("is_tf")
    ]
    review_other = [
        r
        for r in review_all
        if r not in review_not_found_mcq
    ]

    info = [r for r in results if r["severity"] == "info"]

    lines = [
        "# Full reference audit (read-only)",
        "",
        "Generated by `python audit_refs_thorough.py`.",
        "",
        f"- **Questions scanned:** 192",
        f"- **True/False questions:** {tf_total} (answer text `True`/`False` is **not** searched in PDFs)",
        f"- **Total flagged:** {len(results)} (high: {len(high)}, review: {len(review_all)}, info: {len(info)})",
        f"- **Review — answer phrase not found (MCQ only):** {len(review_not_found_mcq)}",
        f"- **Review — other (T/F cited support, image-only slides, etc.):** {len(review_other)}",
        "",
        "For True/False items, the report checks explanation/question wording on **cited slides only**. "
        "A miss may still be valid if the slide uses different wording or negation.",
        "",
    ]

    if high:
        lines.append(f"## High confidence — likely wrong slideRef ({len(high)})")
        lines.append("")
        for r in high:
            _write_entry(lines, r)

    if review_not_found_mcq:
        lines.append(
            f"## Review — verify manually — answer not found in any PDF ({len(review_not_found_mcq)})"
        )
        lines.append("")
        lines.append(
            "MCQ (and non–True/False) questions where the **correct answer wording** does not appear "
            "in extractable text on any lecture slide. May be paraphrased on a diagram or a data error."
        )
        lines.append("")
        for r in review_not_found_mcq:
            _write_entry(lines, r)

    if review_other:
        lines.append(f"## Review — other ({len(review_other)})")
        lines.append("")
        lines.append("Includes True/False cited-slide checks, sparse/image slides, and weak cross-slide matches.")
        lines.append("")
        for r in review_other:
            _write_entry(lines, r)

    if info:
        lines.append(f"## Info ({len(info)})")
        lines.append("")
        for r in info:
            _write_entry(lines, r)

    if not results:
        lines.append("No issues flagged.")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(
        json.dumps(
            {
                "total_flagged": len(results),
                "high": len(high),
                "review_all": len(review_all),
                "review_not_found_mcq": len(review_not_found_mcq),
                "review_other": len(review_other),
                "info": len(info),
                "tf_questions": tf_total,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
