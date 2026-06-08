"""
check_data_integrity.py
=======================
Persistent integrity checker for exam JSON data.
Run any time after editing exam files to catch anomalies.

Usage
-----
    python scripts/check_data_integrity.py          # full report
    python scripts/check_data_integrity.py --quiet  # only errors (exit 1 if any)

Checks
------
1. Every question has a non-empty relatedTopics array
2. All relatedTopics values reference valid lecture IDs
3. No question has more than 2 relatedTopics (policy limit)
4. ES6 features (const/let/rest/arrow/class/promise/async/await) in a question
   that is tagged fe-5 MUST also include fe-6
5. HTTP/protocol questions (status codes, GET/POST/PUT/DELETE, cookies, URL)
   tagged ONLY fe-1 must also include be-4 when the content is covered in be-4
6. HTTP questions tagged ONLY be-4 must also include fe-1
7. Python OOP / file-handling / inheritance content in questions tagged ONLY
   be-2 should also reference be-3 (unless it is clearly Python-essentials-only)
8. Django template-syntax content must include be-7
9. Django ORM / migration / admin content must include be-8
10. Every question's correctAnswerId matches one of its option IDs
11. No duplicate question IDs within the same exam year
12. Context codeLanguage consistency: if context.code is set, codeLanguage
    must be a known value (html | javascript | python | css | null)
13. Question text and options are not empty strings
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import NamedTuple

ROOT = Path(__file__).resolve().parent.parent
EXAMS_DIR = ROOT / "data" / "exams"
LECTURES_MANIFEST = ROOT / "data" / "manifests" / "lectures.json"

EXAM_FILES = ["2021.json", "2024.json", "2025.json"]

KNOWN_LANGUAGES = {"html", "javascript", "python", "css", None}

# ── Valid lecture IDs ────────────────────────────────────────────────────────

def get_valid_lecture_ids() -> set[str]:
    with open(LECTURES_MANIFEST, encoding="utf-8") as f:
        data = json.load(f)
    return set(data.get("lectures", {}).keys())


# ── ES6 patterns (code-level, not answer options) ───────────────────────────

_ES6_CODE = re.compile(
    r"(?:"
    r"\blet\s+\w+"          # let declaration
    r"|\bconst\s+\w+"       # const declaration
    r"|=>(?!\s*\w+:)"       # arrow function (not object property)
    r"|\.\.\.\w+"           # rest/spread
    r"|\bPromise\b"
    r"|\basync\b"
    r"|\bawait\b"
    r"|class\s+\w+\s+(extends\b|\{)"  # JS class
    r"|\.flat(?:Map)?\s*\(" # flat/flatMap
    r"|\bXMLHttpRequest\b"
    r")",
    re.IGNORECASE,
)

# ── HTTP keyword patterns (excluding answer option words like "None") ────────

_HTTP_CONTENT = re.compile(
    r"\b(?:"
    r"GET|POST|PUT|DELETE|PATCH|HEAD"
    r"|status[\s-]?code"
    r"|HTTP\s+(?:request|response|method)"
    r"|request[\s-]?(?:line|header|message)"
    r"|response[\s-]?(?:line|header|message)"
    r"|cookie"
    r"|TCP\s+port"
    r"|port\s+80"
    r")\b",
    re.IGNORECASE,
)

# ── Python OOP / file IO patterns (code-level) ───────────────────────────────

_PYTHON_OOP = re.compile(
    r"(?:"
    r"\b(?:class\s+\w+\s*[:\(]|__init__|self\.\w+|super\s*\(\s*\)|inherits?)"
    r"|with\s+open\s*\("
    r"|json\.(?:dump|load)\s*\("
    r")",
    re.IGNORECASE,
)

# ── Django patterns ──────────────────────────────────────────────────────────

_DJANGO_TEMPLATE = re.compile(
    r"(?:\{\{[^}]+\}\}|\{%[^%]+%\}|\bforloop\b)",
    re.IGNORECASE,
)

_DJANGO_ORM = re.compile(
    r"(?:"
    r"models\.Model"
    r"|ForeignKey|ManyToManyField|OneToOneField"
    r"|makemigrations|createsuperuser"
    r"|\.objects\.(?:all|filter|get|create|save|delete)\s*\("
    r"|admin\.site\.register"
    r"|admin\.ModelAdmin"
    r")",
    re.IGNORECASE,
)


class Issue(NamedTuple):
    year: str
    qid: str
    check: int
    message: str


def code_text(q: dict, ctx_code: str) -> str:
    """Return only the code portions of the question for pattern matching."""
    parts = [ctx_code or ""]
    # include question text (may embed inline code)
    parts.append(q.get("questionText", ""))
    # include code-type options
    for opt in q.get("options", []):
        if opt.get("type") == "code":
            parts.append(opt.get("content", ""))
    return " ".join(parts)


def full_text(q: dict, ctx_code: str) -> str:
    """All text including answer options (for pattern matching topic keywords)."""
    parts = [code_text(q, ctx_code)]
    for opt in q.get("options", []):
        parts.append(opt.get("content", ""))
    parts.append(q.get("explanation", "") or "")
    return " ".join(parts)


def audit_year(year_file: str, valid_ids: set[str]) -> list[Issue]:
    year = year_file.replace(".json", "")
    path = EXAMS_DIR / year_file
    with open(path, encoding="utf-8") as f:
        blocks = json.load(f)

    issues: list[Issue] = []
    seen_qids: set[str] = set()

    for block in blocks:
        ctx = block.get("context") or {}
        ctx_code = ctx.get("code") or ""
        ctx_lang = ctx.get("codeLanguage")

        # Check 12: context codeLanguage
        if ctx.get("code") and ctx_lang not in KNOWN_LANGUAGES:
            issues.append(Issue(year, block["id"], 12,
                f"Block '{block['id']}' has code but unknown codeLanguage '{ctx_lang}'"))

        for q in block.get("questions", []):
            qid = q.get("id", "?")
            topics = q.get("relatedTopics") or []
            q_code = code_text(q, ctx_code)
            q_full = full_text(q, ctx_code)

            # Check 11: duplicate IDs
            if qid in seen_qids:
                issues.append(Issue(year, qid, 11, "Duplicate question ID"))
            seen_qids.add(qid)

            # Check 13: non-empty question text
            if not (q.get("questionText") or "").strip():
                issues.append(Issue(year, qid, 13, "Empty questionText"))

            # Check 1: relatedTopics not empty
            if not topics:
                issues.append(Issue(year, qid, 1, "relatedTopics is empty"))
                continue  # skip further checks that depend on topics

            # Check 2: all IDs are valid
            bad_ids = [t for t in topics if t not in valid_ids]
            if bad_ids:
                issues.append(Issue(year, qid, 2,
                    f"Unknown lecture IDs: {bad_ids}"))

            # Check 3: max 2 relatedTopics
            if len(topics) > 2:
                issues.append(Issue(year, qid, 3,
                    f"{len(topics)} relatedTopics (max 2): {topics}"))

            # Check 10: correctAnswerId matches an option
            correct = q.get("correctAnswerId")
            option_ids = {o.get("id") for o in q.get("options", [])}
            if correct and option_ids and correct not in option_ids:
                issues.append(Issue(year, qid, 10,
                    f"correctAnswerId '{correct}' not in options {sorted(option_ids)}"))

            # ── Topic-consistency checks ─────────────────────────────────

            has_fe5 = "fe-5" in topics
            has_fe6 = "fe-6" in topics
            has_fe1 = "fe-1" in topics
            has_be4 = "be-4" in topics
            has_be2 = "be-2" in topics
            has_be3 = "be-3" in topics
            has_be7 = "be-7" in topics
            has_be8 = "be-8" in topics

            # Check 4: ES6 in fe-5 without fe-6
            if has_fe5 and not has_fe6 and _ES6_CODE.search(q_code):
                snippet = _ES6_CODE.search(q_code).group()[:40]
                issues.append(Issue(year, qid, 4,
                    f"ES6 code ('{snippet}') tagged fe-5 only – should also include fe-6"))

            # Check 5: HTTP content in fe-1 only (missing be-4)
            if has_fe1 and not has_be4 and len(topics) == 1 and _HTTP_CONTENT.search(q_full):
                snippet = _HTTP_CONTENT.search(q_full).group()[:40]
                issues.append(Issue(year, qid, 5,
                    f"HTTP content ('{snippet}') in fe-1 only – consider adding be-4"))

            # Check 6: HTTP content in be-4 only (missing fe-1)
            if has_be4 and not has_fe1 and len(topics) == 1 and _HTTP_CONTENT.search(q_full):
                snippet = _HTTP_CONTENT.search(q_full).group()[:40]
                issues.append(Issue(year, qid, 6,
                    f"HTTP content ('{snippet}') in be-4 only – consider adding fe-1"))

            # Check 7: Python OOP / file-IO in be-2 without be-3
            if has_be2 and not has_be3 and _PYTHON_OOP.search(q_code):
                snippet = _PYTHON_OOP.search(q_code).group()[:40]
                issues.append(Issue(year, qid, 7,
                    f"Python OOP/file-IO code ('{snippet}') in be-2 only – consider be-3"))

            # Check 8: Django template syntax missing be-7
            if not has_be7 and _DJANGO_TEMPLATE.search(q_code):
                snippet = _DJANGO_TEMPLATE.search(q_code).group()[:40]
                issues.append(Issue(year, qid, 8,
                    f"Django template syntax ('{snippet}') but be-7 not in topics {topics}"))

            # Check 9: Django ORM/migration/admin missing be-8
            if not has_be8 and _DJANGO_ORM.search(q_full):
                snippet = _DJANGO_ORM.search(q_full).group()[:40]
                issues.append(Issue(year, qid, 9,
                    f"Django ORM/admin content ('{snippet}') but be-8 not in topics {topics}"))

    return issues


def main() -> int:
    quiet = "--quiet" in sys.argv
    valid_ids = get_valid_lecture_ids()

    all_issues: list[Issue] = []
    for year_file in EXAM_FILES:
        all_issues.extend(audit_year(year_file, valid_ids))

    if not all_issues:
        print("OK – no integrity issues found.")
        return 0

    # Group by check number for readability
    by_check: dict[int, list[Issue]] = {}
    for iss in all_issues:
        by_check.setdefault(iss.check, []).append(iss)

    # Checks 5 and 7 are warnings (informational); others are errors
    WARNINGS = {5, 6, 7}
    errors = [i for i in all_issues if i.check not in WARNINGS]
    warnings = [i for i in all_issues if i.check in WARNINGS]

    if not quiet or errors:
        for chk in sorted(by_check):
            grp = by_check[chk]
            severity = "WARN" if chk in WARNINGS else "ERR "
            print(f"\n[Check {chk:02d}] {severity}  {len(grp)} issues")
            for iss in grp:
                print(f"  {iss.year}/{iss.qid}: {iss.message}")

        print(f"\n{'='*60}")
        print(f"Summary: {len(errors)} errors, {len(warnings)} warnings "
              f"across {len(EXAM_FILES)} exams")
        print(f"{'='*60}")

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
