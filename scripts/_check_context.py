import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
EXAMS = ROOT / "data" / "exams"

for year in ["2021", "2024", "2025"]:
    data = json.load(open(EXAMS / f"{year}.json", encoding="utf-8"))
    for b in data:
        ctx = b.get("context") or {}
        ctx_code = ctx.get("code")
        if not ctx_code:
            continue
        for q in b.get("questions", []):
            qt = q.get("questionText", "")
            lo = qt.lower()
            if "based on the following" in lo or "answer the following" in lo:
                print(f"{year}/{q['id']}: questionText=\"{qt[:80]}\"")

    # Also look for questions whose context field is null but block has context
    for b in data:
        ctx = b.get("context") or {}
        ctx_code = ctx.get("code")
        if not ctx_code:
            continue
        for q in b.get("questions", []):
            # Check if the question-level context is missing (if stored that way)
            q_ctx = q.get("context")
            if q_ctx is None:
                pass  # normal - context lives at block level
