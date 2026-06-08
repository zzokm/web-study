"""
audit_allocations.py
====================
Scans all three exam JSON files and reports every suspicious
relatedTopics allocation.  Run from any directory – uses paths relative
to the script's own location.

Checks performed
----------------
A. JS code/keywords inside a question (text / options) whose relatedTopics
   contains only be-* (Python/Django) lectures  → JS in Python slot
B. Python code/keywords inside a question whose relatedTopics contains
   only fe-* (frontend) lectures  → Python in JS/HTML/CSS slot
C. ES6-specific JS features (const/let/arrow/rest/class/promise/await)
   tagged ONLY to fe-5 and not fe-6  → should also include fe-6
D. HTTP / status-code questions that mention both client-server protocol
   concepts but are missing one of {fe-1, be-4}
E. Python OOP / class / inheritance / super / file-handling content tagged
   to be-2 instead of (or without) be-3
F. Django-template-specific content tagged outside {be-7}
G. Django-model / ORM / migration content tagged outside {be-8}
H. Django setup / MVT / project-creation content tagged outside {be-5, be-6}
I. Questions whose relatedTopics array is empty
J. Questions with more than 2 relatedTopics  (extreme cases only)
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXAMS_DIR = ROOT / "data" / "exams"

EXAM_FILES = ["2021.json", "2024.json", "2025.json"]

# ── Language detection helpers ──────────────────────────────────────────────

JS_PATTERNS = [
    r"\bdocument\s*\.\s*\w+",          # document.getElementById etc.
    r"\bwindow\s*\.\s*\w+",            # window.location etc.
    r"\bconsole\s*\.\s*log\b",
    r"\bdocument\.write",
    r"\binnerHTML\b",
    r"\bvar\s+\w+\s*=",
    r"\bfunction\s+\w+\s*\(",          # function foo(
    r"\btypeof\s*[\(\s]",              # typeof x / typeof(x)
    r"\binstanceof\b",
    r"\bnull\b(?!\s*pointer)",         # JS null (Python uses None)
    r"\bundefined\b",
    r"\bNaN\b",
    r"\.forEach\s*\(",
    r"\.filter\s*\(",
    r"\.map\s*\(",
    r"\.reduce\s*\(",
    r"\.find\s*\(",
    r"\.flat\s*\(",
    r"\.indexOf\s*\(",
    r"\.lastIndexOf\s*\(",
    r"\.concat\s*\(",
    r"\.includes\s*\(",
    r"\.padStart\s*\(",
    r"\.padEnd\s*\(",
    r"\bJSON\s*\.\s*(parse|stringify)\b",
    r"=>",                              # arrow function
    r"\.\.\.\w+",                       # rest / spread
    r"\bPromise\b",
    r"\basync\b",
    r"\bawait\b",
    r"\beval\s*\(",
    r"\b(let|const)\s+\w+",
    r"XMLHttpRequest",
    r"\bAJAX\b",
]

PYTHON_PATTERNS = [
    r"\bprint\s*\(",
    r"\bdef\s+\w+\s*\(",
    r"\blambda\s+\w+\s*:",
    r"\bself\s*\.",
    r"__init__\s*\(",
    r"\brange\s*\(",
    r"\btype\s*\(",
    r"\blen\s*\(",
    r"\bNone\b",
    r"\bTrue\b",
    r"\bFalse\b",
    r"\belif\b",
    r"\.append\s*\(",
    r"\.extend\s*\(",
    r"\.update\s*\(",
    r"\.items\s*\(\)",
    r"\.keys\s*\(\)",
    r"\.values\s*\(\)",
    r"\bimport\s+\w+",
    r"from\s+\w+\s+import\b",
    r"\bsuper\s*\(\s*\)",
    r"\bclass\s+\w+\s*[:\(]",          # Python class (colon or parent class)
    r"f['\"].*\{",                     # f-string
    r"\bdict\s*\(",
    r"\bset\s*\(",
    r"\blist\s*\(",
    r"\btuple\s*\(",
    r"\bwith\s+open\s*\(",
    r"\.strip\s*\(",
    r"\.split\s*\(",
    r"\.format\s*\(",
    r"\bIndentationError\b",
    r"\bValueError\b",
]

ES6_PATTERNS = [
    r"\blet\s+\w+",
    r"\bconst\s+\w+",
    r"=>",
    r"\.\.\.\w+",
    r"\bPromise\b",
    r"\basync\b",
    r"\bawait\b",
    r"\bclass\s+\w+\s*(extends\b|\{)",
    r"\.flat\s*\(",
    r"\.flatMap\s*\(",
    r"\.includes\s*\(",
    r"\.padStart\s*\(",
    r"\.padEnd\s*\(",
    r"\bJSON\s*\.",                     # ES5 JSON object (fe-6)
    r"\bforEach\b",                     # ES5 array method (fe-6 coverage)
    r"\.reduce\s*\(",
    r"\.map\s*\(",
    r"\.filter\s*\(",
    r"\.find\s*\(",
    r"\.findIndex\s*\(",
    r"XMLHttpRequest",
]

HTTP_PATTERNS = [
    r"\bHTTP\b",
    r"\bstatus\s*(code)?\b",
    r"\bGET\b",
    r"\bPOST\b",
    r"\bPUT\b",
    r"\bDELETE\b",
    r"\bPATCH\b",
    r"\bcaching\b",
    r"\bheader\b",
    r"\bcookie\b",
    r"\bURL\b",
    r"\bport\s*\d+",
    r"\bTCP\b",
    r"\bHTTPS\b",
    r"\bTLS\b",
    r"\b403\b", r"\b404\b", r"\b200\b", r"\b301\b", r"\b500\b",
]

OOP_PATTERNS = [
    r"\bclass\b.*[:\(]",
    r"\binherit\b",
    r"\bsuper\s*\(",
    r"\boverrid\b",
    r"__init__",
    r"\bself\b",
    r"\binstanc\b",
]

FILE_IO_PATTERNS = [
    r"\bopen\s*\(",
    r"\bread\s*\(",
    r"\bwrite\s*\(",
    r"\.readlines\b",
    r"\bjson\.(dump|load)\b",
    r"with\s+open",
]

DJANGO_TEMPLATE_PATTERNS = [
    r"\{\{.*\}\}",              # {{ variable }}
    r"\{%.*%\}",               # {% tag %}
    r"\bforloop\b",
    r"\bextends\b.*\btemplat\b",
    r"\bblock\b.*\btemplat\b",
]

DJANGO_MODEL_PATTERNS = [
    r"\bmodels\.Model\b",
    r"\bForeignKey\b",
    r"\bManyToMany\b",
    r"\bOneToOne\b",
    r"\bmakemigrations\b",
    r"\b\.migrate\b",
    r"\.objects\.",
    r"\.filter\s*\((?!.*value)",    # Django ORM .filter( vs array filter
    r"\.create\s*\(",
    r"\badmin\.site\.register\b",
    r"createsuperuser",
    r"\bmodelAdmin\b",
]

DJANGO_SETUP_PATTERNS = [
    r"\bMVT\b",
    r"\bdjango-admin\s+startproject\b",
    r"\bstartapp\b",
    r"\bINSTALLED_APPS\b",
    r"\bsettings\.py\b",
    r"\bwsgi\b",
    r"\basgi\b",
    r"\bvirtualenv\b",
    r"\bpip\s+install\s+django\b",
]


def text_of(q: dict) -> str:
    """Concatenate all text from a question into one string for pattern matching."""
    parts = [q.get("questionText", ""), q.get("explanation", "")]
    for opt in q.get("options", []):
        parts.append(opt.get("content", ""))
    return " ".join(parts)


def matches_any(text: str, patterns: list) -> list:
    return [p for p in patterns if re.search(p, text, re.IGNORECASE)]


def is_js(text: str) -> bool:
    return bool(matches_any(text, JS_PATTERNS))


def is_python(text: str) -> bool:
    return bool(matches_any(text, PYTHON_PATTERNS))


def has_es6(text: str) -> bool:
    return bool(matches_any(text, ES6_PATTERNS))


def load_exam(year: str) -> list:
    path = EXAMS_DIR / year
    with open(path, encoding="utf-8") as f:
        return json.load(f)


# ── Main audit ──────────────────────────────────────────────────────────────

def audit():
    issues = []

    for year_file in EXAM_FILES:
        year = year_file.replace(".json", "")
        blocks = load_exam(year_file)

        for block in blocks:
            ctx_code = (block.get("context") or {}).get("code", "") or ""
            ctx_lang = (block.get("context") or {}).get("codeLanguage", "") or ""

            for q in block.get("questions", []):
                qid = q["id"]
                topics = q.get("relatedTopics", [])
                q_text = text_of(q) + " " + ctx_code
                full_id = f"{year}/{qid}"

                be_only = all(t.startswith("be-") for t in topics) if topics else False
                fe_only = all(t.startswith("fe-") for t in topics) if topics else False
                has_fe5 = "fe-5" in topics
                has_fe6 = "fe-6" in topics
                has_fe1 = "fe-1" in topics
                has_be4 = "be-4" in topics
                has_be2 = "be-2" in topics
                has_be3 = "be-3" in topics
                has_be5 = "be-5" in topics
                has_be7 = "be-7" in topics
                has_be8 = "be-8" in topics

                # A. JS code in be-* only questions
                if be_only and is_js(q_text):
                    matched = matches_any(q_text, JS_PATTERNS)[:3]
                    issues.append({
                        "type": "A",
                        "desc": "JS code/keywords in be-* only question",
                        "id": full_id,
                        "topics": topics,
                        "matched": matched,
                        "text_snippet": q["questionText"][:120],
                    })

                # B. Python code in fe-* only questions
                if fe_only and is_python(q_text):
                    matched = matches_any(q_text, PYTHON_PATTERNS)[:3]
                    issues.append({
                        "type": "B",
                        "desc": "Python code/keywords in fe-* only question",
                        "id": full_id,
                        "topics": topics,
                        "matched": matched,
                        "text_snippet": q["questionText"][:120],
                    })

                # C. ES6 features only in fe-5 (not fe-6)
                if has_fe5 and not has_fe6 and has_es6(q_text):
                    matched = matches_any(q_text, ES6_PATTERNS)[:3]
                    issues.append({
                        "type": "C",
                        "desc": "ES6 feature tagged fe-5 only (missing fe-6)",
                        "id": full_id,
                        "topics": topics,
                        "matched": matched,
                        "text_snippet": q["questionText"][:120],
                    })

                # D. HTTP/protocol content missing fe-1 or be-4
                if matches_any(q_text, HTTP_PATTERNS):
                    if has_fe1 and not has_be4 and not any(t.startswith("fe-") and t not in ("fe-1",) for t in topics):
                        issues.append({
                            "type": "D",
                            "desc": "HTTP topic has fe-1 but possibly missing be-4",
                            "id": full_id,
                            "topics": topics,
                            "text_snippet": q["questionText"][:120],
                        })

                # E. Python OOP/file-IO in be-2 only (should mention be-3)
                if has_be2 and not has_be3:
                    if matches_any(q_text, OOP_PATTERNS) or matches_any(q_text, FILE_IO_PATTERNS):
                        issues.append({
                            "type": "E",
                            "desc": "Python OOP/file-IO content in be-2 only (missing be-3?)",
                            "id": full_id,
                            "topics": topics,
                            "text_snippet": q["questionText"][:120],
                        })

                # F. Django template content not tagged be-7
                if matches_any(q_text, DJANGO_TEMPLATE_PATTERNS) and not has_be7:
                    issues.append({
                        "type": "F",
                        "desc": "Django template content missing be-7",
                        "id": full_id,
                        "topics": topics,
                        "text_snippet": q["questionText"][:120],
                    })

                # G. Django model/ORM/migration content not tagged be-8
                if matches_any(q_text, DJANGO_MODEL_PATTERNS) and not has_be8:
                    issues.append({
                        "type": "G",
                        "desc": "Django model/ORM/admin/migration content missing be-8",
                        "id": full_id,
                        "topics": topics,
                        "text_snippet": q["questionText"][:120],
                    })

                # H. Django setup (MVT/project) content not tagged be-5
                if matches_any(q_text, DJANGO_SETUP_PATTERNS) and not has_be5:
                    issues.append({
                        "type": "H",
                        "desc": "Django setup/MVT content missing be-5",
                        "id": full_id,
                        "topics": topics,
                        "text_snippet": q["questionText"][:120],
                    })

                # I. Empty relatedTopics
                if not topics:
                    issues.append({
                        "type": "I",
                        "desc": "Empty relatedTopics",
                        "id": full_id,
                        "topics": topics,
                        "text_snippet": q["questionText"][:120],
                    })

                # J. More than 2 relatedTopics (edge case)
                if len(topics) > 2:
                    issues.append({
                        "type": "J",
                        "desc": f"More than 2 relatedTopics ({len(topics)})",
                        "id": full_id,
                        "topics": topics,
                        "text_snippet": q["questionText"][:120],
                    })

    return issues


if __name__ == "__main__":
    issues = audit()

    # Group by type
    by_type: dict[str, list] = {}
    for issue in issues:
        by_type.setdefault(issue["type"], []).append(issue)

    print(f"\n{'='*70}")
    print(f"ALLOCATION AUDIT REPORT  –  {len(issues)} issues found")
    print(f"{'='*70}\n")

    for t in sorted(by_type):
        grp = by_type[t]
        print(f"── Check {t} ({len(grp)} issues) {'─'*40}")
        for iss in grp:
            print(f"  [{iss['id']}]  topics={iss['topics']}")
            print(f"    {iss['desc']}")
            if "matched" in iss:
                print(f"    matched patterns: {iss['matched']}")
            print(f"    Q: {iss['text_snippet'].strip()!r}")
            print()

    if not issues:
        print("✓ No issues found.")
    print(f"{'='*70}\n")
