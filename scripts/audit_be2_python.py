#!/usr/bin/env python3
"""Audit be-2 Python code questions from catalog."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
cat = json.loads((ROOT / "web/public/data/catalog.json").read_text(encoding="utf-8"))


def is_code_question(q: dict) -> bool:
    if q.get("origin") == "written":
        return True
    if "be-2" not in (q.get("relatedTopics") or []):
        return False
    segs = q.get("questionSegments") or []
    if any(s["type"] == "code" for s in segs):
        return True
    stem = q.get("questionText", "")
    if re.search(
        r"(myNumbers|print\(|def f|lambda|Y=\{|car\s*=|newtuple|fruits|thistuple|"
        r'b = "Hello|x = "My|lst =|class Name|if \d|< 1|< 2)',
        stem,
    ):
        return True
    return False


def main() -> None:
    items = [q for q in cat["questions"] if is_code_question(q)]
    items.sort(key=lambda q: (q["origin"], q.get("questionKey", "")))
    print(f"count={len(items)}")
    for q in items:
        cid = q["correctAnswerId"]
        opt = next((o for o in q["options"] if o["id"] == cid), None)
        ans = opt["content"] if opt else cid
        code = "\n".join(
            s["content"] for s in (q.get("questionSegments") or []) if s["type"] == "code"
        )
        print("=" * 60)
        print(q["questionKey"])
        print("STEM:", q["questionText"][:300])
        if code:
            print("CODE:", code[:300])
        print("ANS:", cid, ans)
        print("OPTS:", [f"{o['id']}:{o['content'][:50]}" for o in q.get("options", [])])
        print("EXPL:", q.get("explanation", "")[:200])


if __name__ == "__main__":
    main()
