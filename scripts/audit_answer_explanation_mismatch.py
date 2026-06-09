"""Flag exam questions where explanation likely disagrees with correctAnswerId."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

SKIP_TOKENS = {
    "div",
    "p",
    "a",
    "for",
    "if",
    "true",
    "false",
    "none",
    "object",
    "string",
    "number",
    "undefined",
    "null",
    "yes",
    "no",
}


def audit_year(year: str) -> list[dict]:
    data = json.loads((ROOT / "data" / "exams" / f"{year}.json").read_text(encoding="utf-8"))
    issues: list[dict] = []

    for block in data:
        for q in block["questions"]:
            qid = q["id"]
            aid = (q.get("correctAnswerId") or "").lower()
            expl = q.get("explanation") or ""
            opts = {o["id"].lower(): o["content"] for o in q.get("options", [])}
            if not aid or aid not in opts:
                continue

            num_m = re.match(r"^(\d+)", q["questionText"])
            num = num_m.group(1) if num_m else qid
            correct = opts[aid]

            def add(kind: str, implied: str, detail: str) -> None:
                if implied.lower() == aid:
                    return
                issues.append(
                    {
                        "year": year,
                        "num": num,
                        "qid": qid,
                        "answer": aid,
                        "implied": implied.lower(),
                        "kind": kind,
                        "detail": detail,
                        "correct_option": correct[:80],
                        "implied_option": opts.get(implied.lower(), "")[:80],
                    }
                )

            for m in re.finditer(
                r"[Oo]ption\s+([A-Da-d])\b[^.]{0,100}?(?:is\s+)?correct", expl
            ):
                add("expl_option_correct", m.group(1), m.group(0)[:120])

            for m in re.finditer(
                r"correct(?:\s+choice)?\s+is\s+(?:option\s+)?([A-Da-d])\b", expl, re.I
            ):
                add("expl_correct_is", m.group(1), m.group(0)[:120])

            for m in re.finditer(
                r"matching\s+option\s+([A-Da-d])\b", expl, re.I
            ):
                add("matching_option", m.group(1), m.group(0)[:120])

            for m in re.finditer(r"`([^`]{2,})`", expl):
                tok = m.group(1).strip()
                if tok.lower() in SKIP_TOKENS:
                    continue
                matches = [
                    letter
                    for letter, content in opts.items()
                    if tok.lower() in content.lower() or content.lower() in tok.lower()
                ]
                if len(matches) == 1:
                    add("unique_token", matches[0], tok[:100])

            # Output/value patterns: explanation states result that matches one option exactly
            for letter, content in opts.items():
                if len(content) < 3 or len(content) > 60:
                    continue
                if content in expl and letter != aid:
                    # ignore if mentioned as wrong option
                    if re.search(
                        rf"option\s+{letter.upper()}\b[^.{{0,80}}]*(wrong|incorrect|not|invalid)",
                        expl,
                        re.I,
                    ):
                        continue
                    if expl.count(content) == 1:
                        add("option_text_in_expl", letter, content[:80])

    return issues


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    all_issues: list[dict] = []
    for year in ("2021", "2024", "2025"):
        all_issues.extend(audit_year(year))

    seen: set[tuple] = set()
    unique: list[dict] = []
    for item in all_issues:
        key = (item["year"], item["num"], item["qid"], item["implied"], item["kind"])
        if key not in seen:
            seen.add(key)
            unique.append(item)

    print(f"Flagged: {len(unique)}\n")
    for item in sorted(unique, key=lambda x: (x["year"], int(x["num"]))):
        print(
            f"{item['year']} Q{item['num']} ({item['qid']}): answer={item['answer'].upper()} "
            f"implied={item['implied'].upper()} [{item['kind']}]"
        )
        print(f"  detail: {item['detail']}")
        print(f"  answer option: {item['correct_option']}")
        print(f"  implied option: {item['implied_option']}")
        print()


def audit_stated_results() -> list[dict]:
    """Find explanations that state a concrete result matching a different option."""
    result_patterns = [
        re.compile(
            r"(?:Therefore|So|Thus|result is|output is|yields|prints|becomes|is)\s+`([^`]+)`",
            re.I,
        ),
    ]
    issues: list[dict] = []

    for year in ("2021", "2024", "2025"):
        data = json.loads((ROOT / "data" / "exams" / f"{year}.json").read_text(encoding="utf-8"))
        for block in data:
            for q in block["questions"]:
                aid = (q.get("correctAnswerId") or "").lower()
                expl = q.get("explanation") or ""
                opts = {o["id"].lower(): o["content"].strip() for o in q.get("options", [])}
                if not aid or aid not in opts:
                    continue
                num_m = re.match(r"^(\d+)", q["questionText"])
                num = num_m.group(1) if num_m else q["id"]
                correct = opts[aid]

                for pat in result_patterns:
                    for m in pat.finditer(expl):
                        val = m.group(1).strip()
                        if len(val) < 2:
                            continue
                        for letter, content in opts.items():
                            if letter == aid:
                                continue
                            normalized = content.strip().strip('"')
                            if val == content or val == normalized or val in content:
                                issues.append(
                                    {
                                        "year": year,
                                        "num": num,
                                        "qid": q["id"],
                                        "answer": aid,
                                        "implied": letter,
                                        "stated": val,
                                        "correct_option": correct[:80],
                                        "implied_option": content[:80],
                                    }
                                )
    return issues


if __name__ == "__main__":
    main()
    print("\n--- Stated result mismatches ---\n")
    stated = audit_stated_results()
    seen: set[tuple] = set()
    for item in stated:
        key = (item["year"], item["num"], item["implied"], item["stated"])
        if key in seen:
            continue
        seen.add(key)
        print(
            f"{item['year']} Q{item['num']}: answer={item['answer'].upper()} "
            f"stated `{item['stated']}` -> option {item['implied'].upper()}"
        )
        print(f"  answer option: {item['correct_option']}")
        print(f"  implied option: {item['implied_option']}")
        print()
