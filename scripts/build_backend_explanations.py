#!/usr/bin/env python3
"""Build merged backend-explanations.json from be2 + other backend topics."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BE2_PATH = ROOT / "data" / "explanations" / "be2-python-explanations.json"
OTHER_PATH = ROOT / "data" / "explanations" / "backend-other-explanations.json"
OUT_PATH = ROOT / "data" / "explanations" / "backend-explanations.json"


def main() -> None:
    merged: dict = {}
    for path in (BE2_PATH, OTHER_PATH):
        if not path.exists():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        for year, fixes in data.items():
            merged.setdefault(year, {}).update(fixes)
    OUT_PATH.write_text(
        json.dumps(merged, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    counts = {y: len(v) for y, v in merged.items()}
    print(f"Wrote {OUT_PATH} with {sum(counts.values())} explanations: {counts}")


if __name__ == "__main__":
    main()
