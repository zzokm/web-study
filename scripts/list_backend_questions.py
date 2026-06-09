#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
cat = json.loads((ROOT / "web/public/data/catalog.json").read_text(encoding="utf-8"))


def is_backend(q: dict) -> bool:
    return any(t.startswith("be-") for t in (q.get("relatedTopics") or []))


def main() -> None:
    items = sorted(
        [q for q in cat["questions"] if is_backend(q)],
        key=lambda q: q["questionKey"],
    )
    print(f"total={len(items)}")
    for q in items:
        cid = q.get("correctAnswerId")
        opt = next((o["content"] for o in q.get("options", []) if o["id"] == cid), cid)
        topics = ",".join(t for t in q.get("relatedTopics", []) if t.startswith("be-"))
        stem = q["questionText"][:80].replace("\n", " ")
        expl_len = len(q.get("explanation") or "")
        print(f"{q['questionKey']}\t{topics}\t{cid}\t{expl_len}\t{stem}")


if __name__ == "__main__":
    main()
