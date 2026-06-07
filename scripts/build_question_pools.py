"""Build per-lecture question pools and exam analysis from data/exams/*.json."""
import json
import re
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

import _bootstrap  # noqa: F401

from stem_match import group_repetitive_instances, norm_stem

ROOT = Path(__file__).resolve().parents[1]

EXAMS = {
    "data/exams/2019.json": "2019",
    "data/exams/2021.json": "2021",
    "data/exams/2024.json": "2024",
    "data/exams/2025.json": "2025",
}

ORIGIN_ORDER = {"2019": 0, "2021": 1, "2024": 2, "2025": 3}
TYPE_ORDER = {"true_false": 0, "mcq": 1, "other": 2}
ORIGIN_YEARS = ["2019", "2021", "2024", "2025"]


def norm_text(t: str) -> str:
    return norm_stem(t)


def slug_topic(topic: str) -> str:
    m = re.match(r"Chapter\s+(\d+):\s*(.+)", topic or "")
    if m:
        num, name = m.group(1), m.group(2)
        s = re.sub(r"[^\w\s-]", "", name.lower())
        s = re.sub(r"\s+", "-", s.strip())
        return f"chapter-{num}-{s}"
    s = re.sub(r"[^\w\s-]", "", (topic or "unknown").lower())
    return re.sub(r"\s+", "-", s.strip())


def chapter_num(topic: str) -> int:
    m = re.match(r"Chapter\s+(\d+)", topic or "")
    return int(m.group(1)) if m else 99


def question_id_sort_key(qid: str | None) -> tuple[int, str]:
    """Natural exam order: Q1, Q2, … Q10, Q1.a, Q1.b, …"""
    if not qid:
        return (999_999, "")
    qid = str(qid).strip()
    m = re.match(r"^Q(\d+)(?:\.([a-zA-Z]+))?$", qid, re.I)
    if m:
        return (int(m.group(1)), (m.group(2) or "").lower())
    nums = re.findall(r"\d+", qid)
    return (int(nums[0]) if nums else 999_999, qid.lower())


def question_sort_key(q: dict) -> tuple:
    """T/F first, then MCQ; within each: 2019 → 2021 → 2024 → 2025; then exam question id."""
    return (
        TYPE_ORDER.get(q.get("questionType"), 99),
        ORIGIN_ORDER.get(q.get("origin"), 99),
        *question_id_sort_key(q.get("sourceQuestionId") or q.get("id")),
    )


def sort_questions(questions: list[dict]) -> list[dict]:
    return sorted(questions, key=question_sort_key)


def classify_question(q: dict) -> str:
    opts = q.get("options") or []
    if len(opts) == 2 and all(o.get("content", "").strip() in ("True", "False") for o in opts):
        return "true_false"
    if len(opts) > 2:
        return "mcq"
    return "other"


def load_questions() -> tuple[list[dict], dict[str, list[dict]]]:
    all_q: list[dict] = []
    by_topic: dict[str, list[dict]] = defaultdict(list)
    for fname, origin in EXAMS.items():
        data = json.loads((ROOT / fname).read_text(encoding="utf-8"))
        for q in data:
            entry = {
                **q,
                "origin": origin,
                "sourceFile": fname,
                "sourceQuestionId": q.get("id"),
                "questionType": classify_question(q),
                "poolIndex": len(all_q) + 1,
            }
            topic = entry.get("topic") or "Unknown"
            by_topic[topic].append(entry)
            all_q.append(entry)
    return all_q, by_topic


def write_pools(by_topic: dict[str, list[dict]]) -> list[dict]:
    out_dir = ROOT / "data" / "pools"
    out_dir.mkdir(exist_ok=True)
    meta = []
    for topic in sorted(by_topic.keys(), key=chapter_num):
        slug = slug_topic(topic)
        questions = sort_questions(by_topic[topic])
        for i, q in enumerate(questions, 1):
            q["poolIndex"] = i
        origins_in_topic = Counter(q["origin"] for q in questions)
        payload = {
            "lecture": topic,
            "slug": slug,
            "totalQuestions": len(questions),
            "originsBreakdown": dict(origins_in_topic),
            "questions": questions,
        }
        path = out_dir / f"{slug}.json"
        path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        meta.append(
            {
                "file": path.name,
                "lecture": topic,
                "count": len(questions),
                "origins": dict(origins_in_topic),
            }
        )
    return meta


def write_repetitive_questions(all_q: list[dict]) -> dict:
    """Questions with matching stems + answers appearing 2+ times across exams."""
    raw_groups = group_repetitive_instances(all_q)
    groups: list[dict] = []
    for instances in raw_groups:
        sorted_instances = sort_questions(instances)
        groups.append(
            {
                "instanceCount": len(sorted_instances),
                "questionText": sorted_instances[0].get("questionText"),
                "topic": sorted_instances[0].get("topic"),
                "questionType": sorted_instances[0].get("questionType"),
                "sortKey": question_sort_key(sorted_instances[0]),
                "instances": sorted_instances,
            }
        )

    groups.sort(key=lambda g: (g["instanceCount"], g["sortKey"]))

    questions_out: list[dict] = []
    for rank, group in enumerate(groups, 1):
        instances = group["instances"]
        representative = instances[0]
        origins_seen = sorted(
            {q["origin"] for q in instances},
            key=lambda o: ORIGIN_ORDER.get(o, 99),
        )
        questions_out.append(
            {
                **representative,
                "instanceCount": group["instanceCount"],
                "repetitionGroupRank": rank,
                "origins": origins_seen,
                "appearances": [
                    {
                        "origin": q["origin"],
                        "sourceFile": q["sourceFile"],
                        "sourceQuestionId": q.get("sourceQuestionId") or q.get("id"),
                    }
                    for q in instances
                ],
            }
        )

    by_count = Counter(g["instanceCount"] for g in groups)
    payload = {
        "title": "Repetitive Questions",
        "description": (
            "One entry per repeated stem (normalized match on question text + correct answer, "
            "2+ appearances across exams). Underscores/blanks and light stem variation collapse "
            "when the keyed answer matches; instanceCount and appearances record every exam slot. "
            "Ordered by instanceCount ascending (2, then 3, then 4…); "
            "within the same count: True/False before MCQ, then 2019→2021→2024→2025, "
            "then exam question id (Q1, Q2, Q1.a…)."
        ),
        "generatedOn": str(date.today()),
        "uniqueRepeatedStems": len(groups),
        "totalQuestionEntries": len(questions_out),
        "instanceCountBreakdown": dict(sorted(by_count.items())),
        "questions": questions_out,
    }
    (ROOT / "data" / "repetitive-questions.json").write_text(
        json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    return payload


def analyze(all_q: list[dict], by_topic: dict[str, list[dict]], meta: list[dict]) -> str:
    origin_counts = Counter(q["origin"] for q in all_q)
    type_counts = Counter(q["questionType"] for q in all_q)
    topic_counts = Counter(q.get("topic") or "Unknown" for q in all_q)

    topic_by_origin: dict[str, Counter] = defaultdict(Counter)
    type_by_origin: dict[str, Counter] = defaultdict(Counter)
    for q in all_q:
        topic_by_origin[q["origin"]][q.get("topic") or "Unknown"] += 1
        type_by_origin[q["origin"]][q["questionType"]] += 1

    cross_year = []
    for instances in sorted(
        group_repetitive_instances(all_q),
        key=lambda g: (-len(g), question_sort_key(sort_questions(g)[0])),
    ):
        origins = sorted({q["origin"] for q in instances}, key=lambda o: ORIGIN_ORDER.get(o, 99))
        rep = sort_questions(instances)[0]
        cross_year.append(
            {
                "count": len(instances),
                "origins": origins,
                "topic": rep.get("topic"),
                "text": rep.get("questionText"),
                "questionType": rep.get("questionType"),
                "correctAnswerId": rep.get("correctAnswerId"),
            }
        )

    four_exam_hits = [d for d in cross_year if len(d["origins"]) == 4]
    three_exam_hits = [d for d in cross_year if len(d["origins"]) == 3]

    fill_blank = [q for q in all_q if "____" in (q.get("questionText") or "")]
    negation_tf = [
        q
        for q in all_q
        if q["questionType"] == "true_false"
        and re.search(r"\b(not|never|only|avoid|unlike|incorrect|false)\b", (q.get("questionText") or "").lower())
    ]

    keyword_themes = {
        "Management functions (planning/organizing/influencing/controlling)": r"\b(planning|organizing|influencing|controlling|staffing)\b",
        "Mintzberg / managerial roles": r"\bmintzberg\b",
        "Fayol / classical management": r"\bfayol\b",
        "Decision making & problem solving": r"\b(decision|consensus|intuitive|rational|groupthink|problem)\b",
        "Power & politics": r"\b(power|politics|authority|position power)\b",
        "Groups & teams": r"\b(group|team|groupthink|task group|informal)\b",
        "Communication": r"\b(communication|barrier|macrobarrier|microbarrier)\b",
        "Organizing / structure / span": r"\b(span of management|chain of command|departmentalization|scalar)\b",
        "HR / staffing": r"\b(human resource|staffing|recruitment|wikstrom)\b",
        "Controlling / standards / deviations": r"\b(controlling|deviation|standard|corrective)\b",
        "Ethics": r"\b(ethics|ethical|social responsibility)\b",
        "Skills (technical/human/conceptual)": r"\b(technical skills|human skills|conceptual skills)\b",
    }
    theme_counts = Counter()
    theme_by_origin: dict[str, Counter] = defaultdict(Counter)
    for q in all_q:
        text = (q.get("questionText") or "").lower()
        for theme, pattern in keyword_themes.items():
            if re.search(pattern, text, re.I):
                theme_counts[theme] += 1
                theme_by_origin[theme][q["origin"]] += 1

    lines: list[str] = []
    w = lines.append

    w("# Management Final Exams — Combined Question Pool & Examiner Analysis")
    w("")
    w(f"*Generated: {date.today().isoformat()}*")
    w("")
    w("## Executive summary")
    w("")
    answered = sum(
        1
        for q in all_q
        if q.get("correctAnswerId") is not None and q.get("explanation") and q.get("reference")
    )
    w(
        f"This report merges **{len(all_q)} questions** from four exam JSON sources "
        f"(`final19.json`, `final21.json`, `final24.json`, `final25.json`) into "
        f"**{len(by_topic)} lecture-based pool files** under `question-pools-by-lecture/`. "
        f"Each entry includes **answer keys, explanations, and chapter-prefixed references** "
        f"where available (**{answered}/{len(all_q)}** fully answered)."
    )
    w("")
    w("| Exam origin | Source file | Questions | Answered |")
    w("|-------------|-------------|----------:|---------:|")
    for fname, origin in EXAMS.items():
        subset = [q for q in all_q if q["origin"] == origin]
        ans = sum(
            1
            for q in subset
            if q.get("correctAnswerId") is not None and q.get("explanation") and q.get("reference")
        )
        w(f"| **{origin}** | `{fname}` | {len(subset)} | {ans} |")
    w(f"| **Total** | — | **{len(all_q)}** | **{answered}** |")
    w("")
    w("### Question format mix")
    w("")
    w("| Type | Count | Share |")
    w("|------|------:|------:|")
    for qt, c in type_counts.most_common():
        w(f"| {qt.replace('_', ' ').title()} | {c} | {100*c/len(all_q):.1f}% |")
    w("")
    w("### Highest-yield lectures (by pooled frequency)")
    w("")
    w("| Rank | Lecture | Questions | % of pool |")
    w("|-----:|---------|----------:|----------:|")
    for rank, (topic, c) in enumerate(topic_counts.most_common(), 1):
        w(f"| {rank} | {topic} | {c} | {100*c/len(all_q):.1f}% |")
    w("")

    w("## Combined pool structure")
    w("")
    w("Each lecture file contains every question tagged with:")
    w("")
    w("- `origin` — `2019`, `2021`, `2024`, or `2025`")
    w("- `sourceFile` — original JSON filename")
    w("- `sourceQuestionId` — original question id (e.g. `Q12`, `Q1.a`)")
    w("- `questionType` — `true_false` or `mcq`")
    w("- `correctAnswerId`, `explanation`, `reference` — answer key and study notes (from merged exams)")
    w("- `slideRef`, `slideRefParsed` — programmatic lecture slide locator (`ch18:s9`, `ch13:s36-39`, `ch21:all`, `ch13:course`)")
    w("")
    w("| Pool file | Lecture | Total | 2019 | 2021 | 2024 | 2025 |")
    w("|-----------|---------|------:|-----:|-----:|-----:|-----:|")
    for m in sorted(meta, key=lambda x: chapter_num(x["lecture"])):
        o = m["origins"]
        w(
            f"| `{m['file']}` | {m['lecture']} | {m['count']} | "
            f"{o.get('2019', 0)} | {o.get('2021', 0)} | {o.get('2024', 0)} | {o.get('2025', 0)} |"
        )
    w("")
    w("See `question-pools-by-lecture/_index.json` for machine-readable metadata.")
    w("")

    w("## Cross-exam repetition (normalized stems + matching answers)")
    w("")
    dup_slots = sum(d["count"] - 1 for d in cross_year)
    w(
        f"**{len(cross_year)}** distinct question stems (normalized text + correct answer) appear "
        f"more than once across the four exams "
        f"(**{dup_slots}** duplicate appearances). "
        "These are the strongest signals of examiner priority."
    )
    w("")
    if four_exam_hits:
        w("### Appeared in all four exams (maximum yield)")
        w("")
        for d in four_exam_hits:
            w(f"- **{d['topic']}** ({d['questionType']}): \"{d['text'][:120]}{'…' if len(d['text'])>120 else ''}\"")
        w("")
    if three_exam_hits:
        w("### Appeared in three exams")
        w("")
        for d in three_exam_hits[:12]:
            w(
                f"- [{', '.join(d['origins'])}] **{d['topic']}**: "
                f"\"{d['text'][:100]}{'…' if len(d['text'])>100 else ''}\""
            )
        if len(three_exam_hits) > 12:
            w(f"- *…and {len(three_exam_hits) - 12} more three-exam repeats*")
        w("")

    w("### Top repeated stems (2+ appearances)")
    w("")
    w("| Times | Origins | Ans | Type | Lecture | Question (truncated) |")
    w("|------:|---------|:---:|------|---------|----------------------|")
    for d in cross_year[:30]:
        origins = ", ".join(d["origins"])
        text = d["text"].replace("|", "/")[:80]
        ans = d.get("correctAnswerId") or "—"
        w(f"| {d['count']} | {origins} | {ans} | {d['questionType']} | {d['topic']} | {text} |")
    w("")

    w("## Lecture-level trends by exam year")
    w("")
    for origin in ORIGIN_YEARS:
        w(f"### {origin}")
        w("")
        w("| Lecture | Count | T/F | MCQ |")
        w("|---------|------:|----:|----:|")
        topics = topic_by_origin[origin].most_common()
        for topic, c in topics:
            tf = sum(1 for q in all_q if q["origin"] == origin and q.get("topic") == topic and q["questionType"] == "true_false")
            mcq = c - tf
            w(f"| {topic} | {c} | {tf} | {mcq} |")
        w("")

    w("## Thematic / conceptual high-yield map")
    w("")
    w("Keyword-based tagging across all stems (one question may match multiple themes):")
    w("")
    w("| Theme | Matches | 2019 | 2021 | 2024 | 2025 |")
    w("|-------|--------:|-----:|-----:|-----:|-----:|")
    for theme, c in theme_counts.most_common():
        ob = theme_by_origin[theme]
        w(
            f"| {theme} | {c} | {ob.get('2019',0)} | {ob.get('2021',0)} | {ob.get('2024',0)} | "
            f"{ob.get('2025',0)} |"
        )
    w("")

    w("## Item-type patterns")
    w("")
    w(f"- **True/False items:** {type_counts['true_false']} ({100*type_counts['true_false']/len(all_q):.1f}%)")
    w(f"- **Multiple choice (4–5 options):** {type_counts['mcq']}")
    w(f"- **Fill-in-the-blank stems** (contain `____`): {len(fill_blank)}")
    w(f"- **T/F with negation/trap wording** (not, never, only, unlike, avoid, etc.): {len(negation_tf)} "
      f"({100*len(negation_tf)/max(type_counts['true_false'],1):.0f}% of all T/F)")
    w("")
    w("### Format evolution by year")
    w("")
    w("| Origin | True/False | MCQ | T/F share |")
    w("|--------|----------:|----:|----------:|")
    for origin in ORIGIN_YEARS:
        tc = type_by_origin[origin]
        total = sum(tc.values())
        tf = tc.get("true_false", 0)
        mcq = tc.get("mcq", 0)
        w(f"| {origin} | {tf} | {mcq} | {100*tf/total:.0f}% |")
    w("")
    w(
        "**Trend:** 2021 is evenly split T/F vs MCQ (50/50). 2024 and 2025 shift heavily toward MCQ (~77–75% MCQ). "
        "The **2019** sample (`final19.json`) is small (18 items) and MCQ-heavy—likely a condensed "
        "or alternate final blueprint."
    )
    w("")

    w("## Psychological profile of the question writer")
    w("")
    w(
        "The following is an *inferred* profile from item design across four papers—not a claim about any "
        "individual instructor. It describes **recurring psychometric habits** visible in the pool."
    )
    w("")
    w("### 1. Stability bias — recycle high-value concepts")
    w("")
    w(
        "The examiner reuses identical or near-identical stems across years (25 exact duplicates). "
        "Favorites include **groups vs teams**, **planning advantages**, **division of labor**, **communication barriers**, "
        "and **controlling fundamentals**. This suggests preparation should prioritize **recognition memory** "
        "on classic definitions, not only novel application."
    )
    w("")
    w("### 2. Definition-truth testing (especially in 2021)")
    w("")
    w(
        "True/False items often pair a term with a *plausible but swapped* definition—e.g. confusing "
        "**influencing vs organizing**, **human vs conceptual skills**, **planning vs long-term horizon**. "
        "The writer tests whether students can **reject attractive false definitions**, not merely recall keywords."
    )
    w("")
    w("### 3. Negation and contrast traps")
    w("")
    tf_total = max(type_counts["true_false"], 1)
    w(
        f"At least **{len(negation_tf)}** T/F stems ({100*len(negation_tf)/tf_total:.0f}% of T/F) use explicit "
        "negation or contrast cues (not, never, only, unlike, avoid, etc.)—and many more flip definitions without "
        "those keywords. The pattern rewards careful reading: **\"unlike technical skills\"**, "
        "**\"does not highlight deviations\"**, **\"avoid doing personal favors\"**. "
        "Under time pressure, students who pattern-match positive definitions will systematically miss these."
    )
    w("")
    w("### 4. Textbook-faithful, chapter-aligned sampling")
    w("")
    w(
        "Topics map cleanly to textbook chapters (1, 3, 7, 8, 11, 13, 15, 18, 21 dominate; Chapter 2 barely appears). "
        "The writer appears to **sample proportionally from assigned chapters** rather than invent scenario-heavy cases. "
        "Expect **term-definition** and **list-advantage/disadvantage** MCQs over integrative case studies."
    )
    w("")
    w("### 5. Classical management canon as anchor")
    w("")
    w(
        "Repeated references to **Fayol**, **bureaucracy**, **division of labor**, **scalar chain**, and **Mintzberg-style roles** "
        "show a **canonical theory** bias—modern agile/startup framing is largely absent."
    )
    w("")
    w("### 6. Escalating MCQ sophistication (2024–2025)")
    w("")
    w(
        "Later exams add more **fill-in-blank MCQs** (sentence completion with five options) and longer stems. "
        "Difficulty moves from binary truth judgments to **discriminating among similar phrases** "
        "(e.g. types of groups, control steps, HR techniques)."
    )
    w("")
    w("### 7. Controlling and organizing as \"terminal\" chapters")
    w("")
    w(
        "Chapters **21 (Controlling)** and **11 (Organizing)** together account for ~30% of the pool—the highest share. "
        "Groups/teams (Ch. 18) and Planning (Ch. 7) follow. **Chapter 2 (History)** is essentially ignored—"
        "low ROI for cramming."
    )
    w("")
    w("### 8. Fair but punitive on common student misconceptions")
    w("")
    w(
        "Items target known confusions: **consensus = slow but committed**, **intuitive ≠ systematic**, "
        "**task group vs informal group**, **implementation as last decision step**. "
        "The writer assumes students have **read chapter summaries** and lecture slides, not deep industry experience."
    )
    w("")

    w("## Study strategy derived from this analysis")
    w("")
    w("1. **Master the repeat list** — drill all exact cross-year duplicates first (see table above).")
    w("2. **Chapter weighting** — prioritize Ch. 21 → 7 → 18 → 11 → 15 → 8 → 13 → 1; skim Ch. 2.")
    w("3. **T/F drill** — practice negation-heavy stems; always identify *which function or skill* is named.")
    w("4. **MCQ drill** — for 2024/2025 style, practice **advantage/disadvantage** and **\"which is NOT\"** lists.")
    w("5. **Use lecture pool files** — study one JSON per chapter; filter by `origin` to simulate a specific year.")
    w("6. **Functions map** — one-page chart: Planning / Organizing / Influencing / Controlling definitions and synonyms.")
    w("")

    w("## Appendix: fill-in-the-blank MCQ stems")
    w("")
    if fill_blank:
        for q in fill_blank[:20]:
            w(f"- [{q['origin']}] {q.get('topic')}: \"{q.get('questionText', '')[:110]}…\"")
        if len(fill_blank) > 20:
            w(f"- *…{len(fill_blank) - 20} additional fill-in-blank items in pool files*")
    else:
        w("*None detected.*")
    w("")

    w("## Data files produced")
    w("")
    w("```")
    w("question-pools-by-lecture/")
    w("  _index.json")
    for m in sorted(meta, key=lambda x: chapter_num(x["lecture"])):
        w(f"  {m['file']}")
    w("repetitive-questions.json")
    w("lectures_manifest.json")
    w("SLIDE_REF_VALIDATION.md")
    w("slide_ref.py / apply_slide_refs.py")
    w("EXAM_QUESTION_ANALYSIS.md  (this file)")
    w("```")

    return "\n".join(lines)


def main() -> None:
    all_q, by_topic = load_questions()
    meta = write_pools(by_topic)
    repetitive = write_repetitive_questions(all_q)
    index = {
        "generatedOn": str(date.today()),
        "totalQuestions": len(all_q),
        "examSources": EXAMS,
        "lectureFiles": meta,
    }
    (ROOT / "data" / "pools" / "_index.json").write_text(
        json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    analysis = analyze(all_q, by_topic, meta)
    (ROOT / "data" / "analysis" / "exam-question-analysis.md").write_text(
        analysis, encoding="utf-8"
    )
    print(
        f"Done: {len(all_q)} questions, {len(meta)} lecture files, "
        f"{repetitive['uniqueRepeatedStems']} repeated stems ({repetitive['totalQuestionEntries']} entries), "
        "analysis written."
    )


if __name__ == "__main__":
    main()
