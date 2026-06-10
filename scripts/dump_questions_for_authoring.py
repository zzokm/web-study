#!/usr/bin/env python3
"""Dump question details for explanation authoring (stdout or file)."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAT_PATH = ROOT / "web" / "public" / "data" / "catalog.json"


def is_backend(q: dict) -> bool:
    return any(t.startswith("be-") for t in (q.get("relatedTopics") or []))


def parse_key(key: str) -> tuple[str, str]:
    if key.startswith("written:"):
        return "written", key.split(":", 1)[1]
    parts = key.split(":")
    return parts[0], parts[-1]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", choices=["2021", "2024", "2025", "written", "all"], default="all")
    parser.add_argument("-o", "--output", type=Path)
    args = parser.parse_args()

    cat = json.loads(CAT_PATH.read_text(encoding="utf-8"))
    rows = []
    for q in cat["questions"]:
        year, qid = parse_key(q["questionKey"])
        if args.year != "all" and year != args.year:
            continue
        if is_backend(q):
            continue

        opts = [
            {"id": o["id"], "content": o["content"][:200]}
            for o in q.get("options", [])
        ]
        rows.append(
            {
                "questionKey": q["questionKey"],
                "year": year,
                "qid": qid,
                "type": q.get("type"),
                "topics": q.get("relatedTopics", []),
                "questionText": q.get("questionText", ""),
                "contextCode": (q.get("context") or {}).get("code"),
                "correctAnswerId": q.get("correctAnswerId"),
                "correctOption": next(
                    (o["content"] for o in q.get("options", []) if o["id"] == q.get("correctAnswerId")),
                    q.get("correctAnswerId"),
                ),
                "options": opts,
                "currentExplanation": q.get("explanation", ""),
            }
        )

    rows.sort(key=lambda r: r["questionKey"])
    text = json.dumps(rows, indent=2, ensure_ascii=False)
    if args.output:
        args.output.write_text(text + "\n", encoding="utf-8")
        print(f"Wrote {len(rows)} questions to {args.output}")
    else:
        print(text)


if __name__ == "__main__":
    main()
