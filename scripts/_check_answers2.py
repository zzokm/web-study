import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Check 2025 HTML context block questions
data = json.load(open(ROOT / "data" / "exams" / "2025.json", encoding="utf-8"))
for b in data:
    ctx = b.get("context") or {}
    txt = (ctx.get("text") or "").lower()
    if "html page" in txt or "based on" in txt:
        print(f"\n=== 2025 / block {b['id']} ===")
        ctx_code = ctx.get("code", "")
        print(f"Context code:\n{ctx_code}\n")
        for q in b["questions"]:
            opts = {o["id"]: o["content"] for o in q.get("options", [])}
            cid = q.get("correctAnswerId", "")
            print(f"  {q['id']} (correct={cid}): {q['questionText'][:100]}")
            for oid, ocontent in opts.items():
                marker = " <-- CORRECT" if oid == cid else ""
                print(f"    {oid}: {ocontent}{marker}")
            print()
