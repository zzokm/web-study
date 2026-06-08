"""
audit_missing_code.py
=====================
Finds questions that reference code (in their text, explanation, or options)
but have no code actually attached or visible to the student.

A question has NO visible code when:
  - The block context has no code
  - The questionText has no embedded code lines (no newline + code-like content)

Then we flag it if the questionText mentions "this code", "following code",
"the code", "the above code", "output of", "following python/javascript/html/css",
or any similar phrase that implies code should be present.

Usage:
    python scripts/audit_missing_code.py
"""
from __future__ import annotations
import json
import re
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
EXAMS = ["2021", "2024", "2025"]

# ── Phrases that imply code must be visible ──────────────────────────────────

CODE_REFERENCE_PATTERNS = [
    re.compile(r"\bthis\s+(?:python\s+|javascript\s+|html\s+|css\s+)?code\b", re.I),
    re.compile(r"\bthe\s+following\s+(?:python\s+|javascript\s+|html\s+|css\s+|html\s+page\s+)?code\b", re.I),
    re.compile(r"\bfollowing\s+(?:python|javascript|js|html|css)\s+(?:code|script|program|page)\b", re.I),
    re.compile(r"\bthe\s+above\s+(?:python\s+|javascript\s+|html\s+|css\s+)?code\b", re.I),
    re.compile(r"\bthe\s+above\s+html\s+page\b", re.I),
    re.compile(r"\bthe\s+following\s+html\s+page\b", re.I),
    re.compile(r"\boutput\s+of\s+(?:the\s+)?(?:following\s+)?(?:python\s+|javascript\s+)?code\b", re.I),
    re.compile(r"\bwhat\s+(?:does\s+)?(?:this|the)\s+(?:code|program|script)\s+(?:do|print|output|return|produce)\b", re.I),
    re.compile(r"\bwhat\s+will\s+(?:the\s+)?(?:following\s+)?(?:python\s+|javascript\s+|html\s+|css\s+)?code\s+(?:print|output|return|produce|do)\b", re.I),
    re.compile(r"\bwhich\s+of\s+the\s+following\s+(?:is\s+)?(?:correct|wrong|invalid)\s+(?:in|for)\s+(?:this|the)\s+(?:python\s+|javascript\s+)?code\b", re.I),
    re.compile(r"\bidentify\s+the\s+(?:error|bug|mistake)\s+in\b", re.I),
    re.compile(r"\bconsider\s+the\s+following\s+(?:python\s+|javascript\s+|html\s+|css\s+)?code\b", re.I),
    re.compile(r"\bgiven\s+the\s+(?:following\s+)?(?:python\s+|javascript\s+|html\s+|css\s+)?code\b", re.I),
    re.compile(r"\bfor\s+the\s+(?:following\s+)?(?:next\s+(?:two|three|few)\s+)?questions?,\s+consider\b", re.I),
    re.compile(r"\bbased\s+on\s+the\s+(?:following\s+)?(?:above\s+)?(?:html\s+page|code)\b", re.I),
]

# ── Detect embedded code in question text ────────────────────────────────────
# Code-like patterns (mirrors parseQuestionText logic in the mjs parser)

CODE_LINE_PATTERNS = [
    re.compile(r"^(var|let|const|function|print|def|import|class|if|for|while|try|catch|return|async|await|console\.|document\.)", re.M),
    re.compile(r"<!DOCTYPE|<html|<head|<body", re.I),
    re.compile(r"[;{}]$", re.M),
    re.compile(r"=\s*[\[{(\"'0-9]", re.M),
    re.compile(r"^\s{4,}", re.M),  # indented lines (4+ spaces)
]


def has_code_in_text(text: str) -> bool:
    if "\n" not in text:
        return False
    for pat in CODE_LINE_PATTERNS:
        if pat.search(text):
            return True
    return False


def references_code(text: str) -> bool:
    for pat in CODE_REFERENCE_PATTERNS:
        if pat.search(text):
            return True
    return False


def audit() -> list[dict]:
    issues = []

    for year in EXAMS:
        path = ROOT / "data" / "exams" / f"{year}.json"
        data = json.load(open(path, encoding="utf-8"))

        for block in data:
            ctx = block.get("context") or {}
            block_has_code = bool(ctx.get("code"))

            for q in block.get("questions", []):
                qtext = q.get("questionText", "")

                # Skip if the block already provides code context
                if block_has_code:
                    continue

                # Does the question text itself have embedded code?
                if has_code_in_text(qtext):
                    continue

                # Does any part of the question reference code?
                all_text = " ".join([
                    qtext,
                    q.get("explanation", "") or "",
                    " ".join(o.get("content", "") for o in q.get("options", [])),
                ])

                if references_code(all_text):
                    issues.append({
                        "year": year,
                        "block": block["id"],
                        "qid": q["id"],
                        "questionText": qtext[:100],
                    })

    return issues


if __name__ == "__main__":
    issues = audit()
    if not issues:
        print("OK - no missing-code questions found.")
        sys.exit(0)

    print(f"Found {len(issues)} questions that reference code but have none visible:\n")
    for iss in issues:
        print(f"  {iss['year']}/{iss['block']}/{iss['qid']}: {iss['questionText']}")

    sys.exit(1)
