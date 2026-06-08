"""
Find questions where code is embedded inline in the question text
(e.g. "...the statement: const f = ..." or "...the expression: x = y + 1")
but not on its own line, so the parser won't render it as a code block.
"""
import json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Match "the following X: <code>" or "the statement: <code>" at end of text
# where <code> looks like actual code
INLINE_CODE_RE = re.compile(
    r"(?:statement|expression|line|code|syntax)[:\s]+([^\n]+[;=\(\)\[\]{}][^\n]*)$",
    re.I,
)

JS_CODE_RE = re.compile(
    r"\b(const|let|var|function|=>|\.filter|\.map|\.forEach|\.reduce|console\.)\b"
)
PY_CODE_RE = re.compile(
    r"\b(def |lambda |print\(|\.append|\.sort\(|range\()\b"
)

for year in ["2021", "2024", "2025"]:
    data = json.load(open(ROOT / "data" / "exams" / f"{year}.json", encoding="utf-8"))
    for b in data:
        ctx = b.get("context") or {}
        for q in b.get("questions", []):
            qtext = q.get("questionText", "")
            # Already has multiline code - skip
            if "\n" in qtext:
                continue
            m = INLINE_CODE_RE.search(qtext)
            if m:
                code_part = m.group(1)
                if JS_CODE_RE.search(code_part) or PY_CODE_RE.search(code_part):
                    print(f"  {year}/{b['id']}/{q['id']}: {qtext[:100]}")
