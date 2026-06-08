"""
Find questions whose explanation text suggests the stored correctAnswerId might be wrong.
"""
import json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent

SUSPECT_PATTERNS = [
    re.compile(r"let me adjust", re.I),
    re.compile(r"let me re-verify", re.I),
    re.compile(r"\bwait[!,]?\s+", re.I),
    re.compile(r"answer should be", re.I),
    re.compile(r"should (?:have been|be)\s+['\"`]?[a-d]", re.I),
    re.compile(r"correct(?:ly)?\s+(?:is|would be)\s+['\"`]?[a-d]", re.I),
    re.compile(r"(?:is incorrect|is wrong)", re.I),
    re.compile(r"(?:actually|instead)\s+['\"`]?[a-d]['\"`]?\s+(?:is|would)", re.I),
]

for year in ["2021", "2024", "2025"]:
    data = json.load(open(ROOT / "data" / "exams" / f"{year}.json", encoding="utf-8"))
    for b in data:
        for q in b.get("questions", []):
            expl = q.get("explanation") or ""
            cid = q.get("correctAnswerId", "")
            for pat in SUSPECT_PATTERNS:
                m = pat.search(expl)
                if m:
                    print(f"SUSPECT {year}/{q['id']} (correct={cid}) | matched: '{m.group()[:30]}'")
                    print(f"  q: {q['questionText'][:80]}")
                    print(f"  expl: {expl[:200]}")
                    print()
                    break
