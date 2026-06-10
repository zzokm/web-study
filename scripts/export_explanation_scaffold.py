#!/usr/bin/env python3
"""Export frontend/written questions into explanation overlay JSON for editing."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAT_PATH = ROOT / "web" / "public" / "data" / "catalog.json"
OUT_PATH = ROOT / "data" / "explanations" / "frontend-explanations.json"
BACKEND_PATH = ROOT / "data" / "explanations" / "backend-explanations.json"


def is_backend(q: dict) -> bool:
    return any(t.startswith("be-") for t in (q.get("relatedTopics") or []))


def parse_key(key: str) -> tuple[str, str]:
    parts = key.split(":")
    return parts[0], parts[-1]


def backend_keys(expl: dict) -> set[tuple[str, str]]:
    keys: set[tuple[str, str]] = set()
    for section, items in expl.items():
        year = "written" if section == "written" else section
        for qid in items:
            keys.add((year, qid))
    return keys


def main() -> None:
    cat = json.loads(CAT_PATH.read_text(encoding="utf-8"))
    backend = json.loads(BACKEND_PATH.read_text(encoding="utf-8"))
    covered = backend_keys(backend)

    out: dict[str, dict[str, str]] = {"2021": {}, "2024": {}, "2025": {}, "written": {}}
    skipped_backend = 0

    for q in cat["questions"]:
        key = q["questionKey"]
        if key.startswith("written:"):
            year, qid = "written", key.split(":", 1)[1]
        else:
            year, qid = parse_key(key)

        if (year, qid) in covered:
            skipped_backend += 1
            continue
        if is_backend(q):
            continue

        expl = (q.get("explanation") or "").strip()
        if not expl:
            expl = ""
        out.setdefault(year, {})[qid] = expl

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps(out, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    total = sum(len(v) for v in out.values())
    print(f"Wrote {OUT_PATH}")
    print(f"  entries: {total} (skipped {skipped_backend} backend-covered)")
    for year in ("2021", "2024", "2025", "written"):
        print(f"  {year}: {len(out.get(year, {}))}")


if __name__ == "__main__":
    main()
