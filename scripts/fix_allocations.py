"""
fix_allocations.py
==================
Applies all confirmed relatedTopics fixes to exam JSON files.

Changes
-------
2021 exam:
  q3  : be-4 only         → [fe-1, be-4]   (status codes in both lectures)
  q2  : fe-1 only         → [fe-1, be-4]   (HTTP methods)
  q5  : fe-1 only         → [fe-1, be-4]   (HTTP request/response line structure)
  q6  : fe-1 only         → [fe-1, be-4]   (HTTP request contents)
  q7  : fe-1 only         → [fe-1, be-4]   (POST vs GET)
  q37 : fe-1 only         → [fe-1, be-4]   (cookies)
  q42 : fe-1 only         → [fe-1, be-4]   (HTTP response structure)
  q45 : fe-1 only         → [fe-1, be-4]   (status 200)
  q46 : fe-1 only         → [fe-1, be-4]   (HTTPS/TLS)
  q62 : [fe-5]            → [fe-5, fe-6]   (let block scope = ES6)
  q63 : [fe-5]            → [fe-5, fe-6]   (let block scope = ES6)
  q64 : [fe-5]            → [fe-5, fe-6]   (let block scope = ES6)
  q69 : [fe-5]            → [fe-5, fe-6]   (const = ES6)
  q70 : [fe-5]            → [fe-5, fe-6]   (const mutation = ES6)
  q71 : [fe-5]            → [fe-5, fe-6]   (const TypeError = ES6)
  q72 : [fe-5]            → [fe-5, fe-6]   (const = ES6)
  q73 : [fe-5]            → [fe-5, fe-6]   (const = ES6)

2024 exam:
  q30 : [fe-5]            → [fe-5, fe-6]   (let variables = ES6)
  q90 : [fe-2,fe-1,be-4]  → [fe-2, fe-1]  (reduce to max 2: HTML links + URL protocols)

2025 exam:
  q45 : [fe-5]            → [fe-5, fe-6]   (const = ES6)
  q68 : [fe-5]            → [fe-5, fe-6]   (rest parameter = ES6; typeof = fe-5)
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXAMS_DIR = ROOT / "data" / "exams"

# ── Patch definitions ────────────────────────────────────────────────────────
# Format: { "year": { "qid": ["new", "topics", "list"] } }

PATCHES: dict[str, dict[str, list[str]]] = {
    "2021": {
        "q3":  ["fe-1", "be-4"],
        "q2":  ["fe-1", "be-4"],
        "q5":  ["fe-1", "be-4"],
        "q6":  ["fe-1", "be-4"],
        "q7":  ["fe-1", "be-4"],
        "q37": ["fe-1", "be-4"],
        "q42": ["fe-1", "be-4"],
        "q45": ["fe-1", "be-4"],
        "q46": ["fe-1", "be-4"],
        "q62": ["fe-5", "fe-6"],
        "q63": ["fe-5", "fe-6"],
        "q64": ["fe-5", "fe-6"],
        "q69": ["fe-5", "fe-6"],
        "q70": ["fe-5", "fe-6"],
        "q71": ["fe-5", "fe-6"],
        "q72": ["fe-5", "fe-6"],
        "q73": ["fe-5", "fe-6"],
    },
    "2024": {
        "q30": ["fe-5", "fe-6"],
        "q58": ["fe-1", "be-4"],
        "q90": ["fe-2", "fe-1"],
    },
    "2025": {
        "q45": ["fe-5", "fe-6"],
        "q68": ["fe-5", "fe-6"],
    },
}


def apply_patches(dry_run: bool = False) -> None:
    total_changed = 0

    for year, qid_map in PATCHES.items():
        path = EXAMS_DIR / f"{year}.json"
        with open(path, encoding="utf-8") as f:
            blocks = json.load(f)

        changed_in_file: list[tuple[str, list, list]] = []

        for block in blocks:
            for q in block.get("questions", []):
                qid = q["id"]
                if qid in qid_map:
                    old = list(q.get("relatedTopics", []))
                    new = qid_map[qid]
                    if old != new:
                        if not dry_run:
                            q["relatedTopics"] = new
                        changed_in_file.append((qid, old, new))

        if changed_in_file:
            print(f"\n[{year}]  {len(changed_in_file)} changes:")
            for qid, old, new in changed_in_file:
                print(f"  {qid}: {old!r} -> {new!r}")
            total_changed += len(changed_in_file)

            if not dry_run:
                with open(path, "w", encoding="utf-8") as f:
                    json.dump(blocks, f, indent=2, ensure_ascii=False)
                    f.write("\n")

    print(f"\nTotal: {total_changed} relatedTopics updated"
          + (" (DRY RUN - no files written)" if dry_run else " - files saved"))


if __name__ == "__main__":
    import sys
    dry = "--dry" in sys.argv
    apply_patches(dry_run=dry)
