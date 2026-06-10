#!/usr/bin/env python3
"""Merge all explanation overlay sources into all-explanations.json."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_PATH = ROOT / "data" / "explanations" / "all-explanations.json"

SOURCES = [
    ROOT / "data" / "explanations" / "backend-explanations.json",
    ROOT / "data" / "explanations" / "frontend-explanations.json",
]


def merge_dict(target: dict, source: dict, name: str) -> int:
    changes = 0
    for section, items in source.items():
        target.setdefault(section, {})
        for qid, text in items.items():
            if qid in target[section] and target[section][qid] != text:
                raise ValueError(f"Conflict {section}/{qid} in {name}")
            if qid not in target[section]:
                changes += 1
            target[section][qid] = text
    return changes


def main() -> None:
    merged: dict = {}
    for path in SOURCES:
        if not path.exists():
            print(f"skip missing {path.name}")
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        n = merge_dict(merged, data, path.name)
        print(f"{path.name}: {n} new keys")

    OUT_PATH.write_text(
        json.dumps(merged, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    total = sum(len(v) for v in merged.values())
    print(f"Wrote {OUT_PATH} with {total} explanations")


if __name__ == "__main__":
    main()
