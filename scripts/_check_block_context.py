"""
Find blocks whose context.text implies code/page but context.code is null,
AND blocks whose questions all seem to reference code from the context but
none of the questions embed their own code either.
"""
import json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent

CTX_IMPLIES_CODE = re.compile(
    r"\b(based on|consider the following|for the (?:next|following)|"
    r"given the following|the following (?:code|program|script|page))\b",
    re.I,
)

for year in ["2021", "2024", "2025"]:
    data = json.load(open(ROOT / "data" / "exams" / f"{year}.json", encoding="utf-8"))
    for b in data:
        ctx = b.get("context") or {}
        ctx_text = ctx.get("text") or ""
        ctx_code = ctx.get("code")
        if CTX_IMPLIES_CODE.search(ctx_text) and not ctx_code:
            print(f"WARN {year}/{b['id']}: context.text implies code but code=null")
            print(f"  text: {ctx_text[:120]}")
            for q in b.get("questions", []):
                print(f"  q: {q['id']} - {q['questionText'][:80]}")
            print()
