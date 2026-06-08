#!/usr/bin/env python3
"""Diff exam JSON against *original.txt sources."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def parse_2021(orig: str) -> tuple[dict[int, str], dict[int, dict]]:
    mcq_start = orig.index("Question ONE:")
    tf_start = orig.index("Question TWO")
    mcq_section = orig[mcq_start:tf_start]
    tf_section = orig[tf_start:]

    mcq = _parse_numbered_section(mcq_section, option_letters="ABCD")
    tf: dict[int, str] = {}
    current: int | None = None
    buf: list[str] = []
    for line in tf_section.splitlines():
        m = re.match(r"^(\d+)\.\s+(.*)$", line)
        if m:
            if current is not None:
                tf[current] = "\n".join(buf).strip()
            current = int(m.group(1))
            buf = [m.group(2)]
        elif current is not None and line.strip():
            buf.append(line.rstrip())
    if current is not None:
        tf[current] = "\n".join(buf).strip()
    return tf, mcq


def parse_2024(orig: str) -> dict[int, dict]:
    start = 0
    for marker in (
        "For each of the following statements",
        "1. Django is based",
    ):
        idx = orig.find(marker)
        if idx >= 0:
            start = idx if marker.startswith("1.") else idx
            if marker.startswith("1."):
                start = idx
            break
    end = orig.index("End of Question")
    section = orig[start:end]
    # strip preamble before q1
    q1 = section.find("1. ")
    if q1 > 0:
        section = section[q1:]
    return _parse_numbered_section(section, option_letters="abcd")


def parse_2025(orig: str) -> tuple[dict[int, str], dict[int, dict]]:
    tf_start = orig.index("Question One:")
    mcq_start = orig.index("Question Two:")
    part_two = orig.index("Part Two:")
    tf = _parse_tf_block(orig[tf_start:mcq_start])
    mcq = _parse_numbered_section(
        orig[mcq_start:part_two],
        option_letters="abcd",
        skip_html=True,
    )
    return tf, mcq


def _parse_tf_block(section: str) -> dict[int, str]:
    items: dict[int, list[str]] = {}
    current: int | None = None
    for line in section.splitlines():
        m = re.match(r"^(\d+)\.\s+(.*)$", line)
        if m:
            current = int(m.group(1))
            items[current] = [m.group(2)]
        elif current is not None and line.strip():
            items[current].append(line.rstrip())
    return {n: "\n".join(parts) for n, parts in items.items()}


def _parse_numbered_section(
    section: str,
    option_letters: str,
    skip_html: bool = False,
) -> dict[int, dict]:
    letters = option_letters.lower()
    pat = re.compile(rf"^([{option_letters}])\.\\s+(.+)$", re.I)
    items: dict[int, list[str]] = {}
    current: int | None = None
    for line in section.splitlines():
        if skip_html and (
            line.startswith("Based on the following HTML page")
            or line.strip().startswith("<")
        ):
            if line.startswith("Based on the following HTML page"):
                current = None
            continue
        if re.match(r"^(Use the following|Based on the following)", line):
            current = None
            continue
        if line.strip().startswith("<") and skip_html:
            continue
        m = re.match(r"^(\d+)\.\s+(.*)$", line)
        if m:
            current = int(m.group(1))
            items[current] = [m.group(2)]
        elif current is not None and line.strip():
            if line.startswith("Note:"):
                continue
            items[current].append(line.rstrip())
    parsed: dict[int, dict] = {}
    for num, parts in items.items():
        text = "\n".join(parts)
        stem, opts = _split_options(text, pat)
        parsed[num] = {"stem": stem, "options": opts}
    return parsed


def _split_options(text: str, pat: re.Pattern[str]) -> tuple[str, dict[str, str]]:
    opts: dict[str, str] = {}
    stem_lines: list[str] = []
    for line in text.splitlines():
        m = pat.match(line)
        if m:
            opts[m.group(1).lower()] = m.group(2).strip()
        else:
            stem_lines.append(line)
    return "\n".join(stem_lines).strip(), opts


def question_num(q: dict) -> int | None:
    qid = q["id"]
    if qid == "q22_23a":
        return 22
    if qid == "q23b":
        return 23
    m = re.match(r"^(\d+)", q["questionText"].strip())
    return int(m.group(1)) if m else None


def diff_year(year: str) -> list[tuple]:
    orig_path = ROOT / f"{year}original.txt"
    exam_path = ROOT / "data" / "exams" / f"{year}.json"
    orig = orig_path.read_text(encoding="utf-8")
    data = json.loads(exam_path.read_text(encoding="utf-8"))

    tf_items: dict[int, str] = {}
    mcq_items: dict[int, dict] = {}
    if year == "2021":
        tf_items, mcq_items = parse_2021(orig)
    elif year == "2024":
        mcq_items = parse_2024(orig)
    elif year == "2025":
        tf_items, mcq_items = parse_2025(orig)

    issues: list[tuple] = []
    for block in data:
        for q in block["questions"]:
            num = question_num(q)
            if num is None:
                issues.append((q["id"], "no_num"))
                continue
            is_tf = year == "2021" and num >= 74
            is_tf = is_tf or (
                year == "2025"
                and num <= 34
                and q["options"][0]["content"] in ("True", "False")
            )
            if year == "2024":
                is_tf = len(q["options"]) == 2 and q["options"][0]["content"] in (
                    "True",
                    "False",
                )

            if is_tf and year == "2021":
                body = tf_items.get(num)
                if not body:
                    issues.append((q["id"], "tf_missing", num))
                    continue
                stem = re.sub(r"^\d+\.\s*", "", q["questionText"]).strip()
                if stem != body:
                    issues.append((q["id"], "stem", num, stem[:80], body[:80]))
            elif is_tf and year == "2025":
                body = tf_items.get(num)
                if not body:
                    issues.append((q["id"], "tf_missing", num))
                    continue
                stem = re.sub(r"^\d+\.\s*", "", q["questionText"]).strip()
                if stem != body:
                    issues.append((q["id"], "stem", num))
            else:
                item = mcq_items.get(num)
                if not item:
                    issues.append((q["id"], "mcq_missing", num))
                    continue
                stem = re.sub(r"^\d+\.\s*", "", q["questionText"]).strip()
                if stem != item["stem"]:
                    issues.append((q["id"], "stem", num))
                for opt in q["options"]:
                    oid = opt["id"]
                    if oid not in item["options"]:
                        if is_tf:
                            continue
                        issues.append((q["id"], "opt_missing", num, oid))
                    elif opt["content"] != item["options"][oid]:
                        issues.append(
                            (
                                q["id"],
                                f"opt_{oid}",
                                num,
                                opt["content"],
                                item["options"][oid],
                            )
                        )
    return issues


def main() -> None:
    years = sys.argv[1:] or ["2021", "2024"]
    for year in years:
        issues = diff_year(year)
        print(f"\n=== {year}: {len(issues)} issues ===")
        for item in issues:
            print(item)


if __name__ == "__main__":
    main()
