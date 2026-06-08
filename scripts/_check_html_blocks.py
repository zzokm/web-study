import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

for year in ["2021", "2024", "2025"]:
    data = json.load(open(ROOT / "data" / "exams" / f"{year}.json", encoding="utf-8"))
    for b in data:
        ctx = b.get("context") or {}
        txt = (ctx.get("text") or "").lower()
        if "html page" in txt or "based on" in txt:
            print(f"\n=== {year} / block {b['id']} ===")
            print(f"  context: {ctx.get('text')}")
            for q in b.get("questions", []):
                topics = q.get("relatedTopics", [])
                correct = q.get("correctAnswerId")
                opts = [o["id"] for o in q.get("options", [])]
                ok = correct in opts
                print(f"  {q['id']}: topics={topics} correct={correct}({'OK' if ok else 'MISSING'}) q={q['questionText'][:70]}")
