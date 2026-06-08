import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Look at HTML context block questions in 2024 for correctness issues
data = json.load(open(ROOT / "data" / "exams" / "2024.json", encoding="utf-8"))
for b in data:
    if b["id"] in ("block_4", "block_5"):
        print(f"\n=== block {b['id']} ===")
        ctx_code = (b.get("context") or {}).get("code", "")
        print(f"Context code:\n{ctx_code}\n")
        for q in b["questions"]:
            opts = {o["id"]: o["content"] for o in q.get("options", [])}
            cid = q.get("correctAnswerId", "")
            print(f"  {q['id']} (correct={cid}): {q['questionText'][:80]}")
            for oid, ocontent in opts.items():
                marker = " <-- CORRECT" if oid == cid else ""
                print(f"    {oid}: {ocontent}{marker}")
            print()
