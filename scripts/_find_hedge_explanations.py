"""
Find explanations that contain hedge/uncertainty language suggesting the data needs cleanup.
"""
import json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent

HEDGE_PATTERNS = [
    re.compile(r"lenient\s+exam", re.I),
    re.compile(r"might expect", re.I),
    re.compile(r"could be\s+(?:either|argued)", re.I),
    re.compile(r"\bunclear\b", re.I),
    re.compile(r"\bambiguous\b", re.I),
    re.compile(r"though\s+(?:some|a\s+lenient|the\s+exam)", re.I),
    re.compile(r"depending on\s+(?:the\s+)?(?:exam|interpretation)", re.I),
    re.compile(r"may\s+(?:also\s+)?(?:accept|consider)\s+['\"]?[a-d]", re.I),
    re.compile(r"technically\s+(?:correct\s+)?(?:but|though)", re.I),
    re.compile(r"however,?\s+(?:some|if)\s+(?:the|a)\s+exam", re.I),
]

for year in ["2021", "2024", "2025"]:
    data = json.load(open(ROOT / "data" / "exams" / f"{year}.json", encoding="utf-8"))
    for b in data:
        for q in b.get("questions", []):
            expl = q.get("explanation") or ""
            cid = q.get("correctAnswerId", "")
            for pat in HEDGE_PATTERNS:
                m = pat.search(expl)
                if m:
                    print(f"{year}/{q['id']} (correct={cid}) | hedge: '{m.group()[:40]}'")
                    print(f"  q: {q['questionText'][:80]}")
                    print(f"  expl: {expl[:300]}")
                    print()
                    break
