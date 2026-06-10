#!/usr/bin/env python3
"""List frontend-only catalog questions for explanation authoring."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAT_PATH = ROOT / "web" / "public" / "data" / "catalog.json"


def is_backend(q: dict) -> bool:
    return any(t.startswith("be-") for t in (q.get("relatedTopics") or []))


def fe_topics(q: dict) -> str:
    return ",".join(t for t in q.get("relatedTopics", []) if t.startswith("fe-"))


def main() -> None:
    cat = json.loads(CAT_PATH.read_text(encoding="utf-8"))
    items = sorted(
        [q for q in cat["questions"] if not is_backend(q) and not q["questionKey"].startswith("written:")],
        key=lambda q: q["questionKey"],
    )
    print(f"total={len(items)}")
    for q in items:
        cid = q.get("correctAnswerId")
        opt = next((o["content"] for o in q.get("options", []) if o["id"] == cid), cid)
        stem = q["questionText"][:90].replace("\n", " ")
        expl_len = len(q.get("explanation") or "")
        print(f"{q['questionKey']}\t{fe_topics(q)}\t{cid}\t{expl_len}\t{stem}")


if __name__ == "__main__":
    main()
