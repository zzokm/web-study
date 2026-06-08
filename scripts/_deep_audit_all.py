"""Deep scan of 2024 and 2025 for questions that reference code but have none."""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
KEYWORDS = [
    "this code", "following code", "following python", "following javascript",
    "following html", "output of", "above code", "this python", "this javascript",
    "the code below", "the following program", "following script",
]

for year in ["2024", "2025"]:
    data = json.load(open(ROOT / "data" / "exams" / f"{year}.json", encoding="utf-8"))
    print(f"\n==== {year} ====")
    for b in data:
        ctx = b.get("context") or {}
        ctx_code = bool(ctx.get("code"))
        for q in b.get("questions", []):
            qtext = q.get("questionText", "")
            has_embedded = "\n" in qtext
            if ctx_code or has_embedded:
                continue
            low = qtext.lower()
            if any(kw in low for kw in KEYWORDS):
                print(f"  SUSPECT {b['id']}/{q['id']}: {qtext[:90]}")
