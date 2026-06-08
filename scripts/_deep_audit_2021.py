"""
Deep audit of 2021 exam - print all blocks with their context and question texts
to spot any missing code that wasn't caught by pattern matching.
"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
data = json.load(open(ROOT / "data" / "exams" / "2021.json", encoding="utf-8"))

for b in data:
    ctx = b.get("context") or {}
    ctx_text = ctx.get("text") or "(none)"
    ctx_code = ctx.get("code")
    has_ctx_code = bool(ctx_code)
    
    print(f"\n{'='*60}")
    print(f"Block: {b['id']} | topic: {b.get('topic','?')}")
    print(f"Context text: {ctx_text[:80]}")
    print(f"Context code: {'YES' if has_ctx_code else 'NULL'}")
    
    for q in b.get("questions", []):
        qtext = q.get("questionText", "")
        has_embedded = "\n" in qtext
        print(f"  {q['id']}: {'[has_code]' if has_embedded else '         '} {qtext[:80]}")
