#!/usr/bin/env python3
"""Compare data/exams/2025.json against data/exams/originals/2025original.txt."""

import json
import re
from pathlib import Path

from exam_original_paths import ROOT, read_original_txt


def parse_original(orig_text: str):
    mcq_start = orig_text.find("Question Two:")
    tf_section = orig_text[orig_text.find("Question One:") : mcq_start]
    mcq_section = orig_text[mcq_start : orig_text.find("Part Two:")]

    tf_items: dict[int, str] = {}
    for m in re.finditer(
        r"^(\d+)\.\s+(.+?)(?=^\d+\.\s+|\nQuestion Two:)",
        tf_section,
        re.M | re.S,
    ):
        tf_items[int(m.group(1))] = re.sub(r"\s+", " ", m.group(2).strip())

    mcq_items: dict[int, str] = {}
    current = None
    buf: list[str] = []
    for line in mcq_section.splitlines():
        m = re.match(r"^(\d+)\.\s+(.+)", line)
        if m:
            if current is not None:
                mcq_items[current] = "\n".join(buf).strip()
            current = int(m.group(1))
            buf = [m.group(2)]
        elif current is not None and line.strip():
            buf.append(line)
    if current is not None:
        mcq_items[current] = "\n".join(buf).strip()

    return tf_items, mcq_items


def parse_options(text: str):
    opts: dict[str, str] = {}
    for m in re.finditer(r"^([a-d])\.\s+(.+)$", text, re.M):
        opts[m.group(1)] = m.group(2).strip()
    stem = re.split(r"\n[a-d]\.\s+", text)[0].strip()
    return stem, opts


def main():
    orig_text = read_original_txt(2025)
    data = json.loads((ROOT / "data/exams/2025.json").read_text(encoding="utf-8"))

    tf_items, mcq_items = parse_original(orig_text)

    json_qs: dict[str, dict] = {}
    for block in data:
        for q in block["questions"]:
            json_qs[q["id"]] = q

    id_to_num: dict[str, int] = {}
    for qid, q in json_qs.items():
        m = re.match(r"^(\d+)", q["questionText"].strip())
        if m:
            id_to_num[qid] = int(m.group(1))
        elif qid == "q22_23a":
            id_to_num[qid] = 22
        elif qid == "q23b":
            id_to_num[qid] = 23

    issues: list[tuple] = []
    for qid in sorted(json_qs, key=lambda x: id_to_num.get(x, 999)):
        q = json_qs[qid]
        num = id_to_num.get(qid)
        if num is None:
            issues.append((qid, "no_number"))
            continue

        if num <= 34:
            orig = tf_items.get(num)
            if not orig:
                issues.append((qid, "tf_missing", num))
                continue
            stem = re.sub(r"^\d+\.\s*", "", q["questionText"].strip())
            stem_norm = re.sub(r"\s+", " ", stem.replace("\n", " "))
            if stem_norm != orig:
                issues.append((qid, "stem", num, stem_norm, orig))
        else:
            orig = mcq_items.get(num)
            if not orig:
                issues.append((qid, "mcq_missing", num))
                continue
            stem, orig_opts = parse_options(orig)
            jstem = re.sub(r"^\d+\.\s*", "", q["questionText"].strip())
            if jstem != stem:
                issues.append((qid, "stem", num, jstem[:120], stem[:120]))
            for opt in q["options"]:
                oid = opt["id"]
                jcontent = opt["content"]
                ocontent = orig_opts.get(oid, "MISSING")
                if jcontent != ocontent:
                    issues.append((qid, f"opt_{oid}", num, jcontent, ocontent))

    print(f"TF items: {len(tf_items)}, MCQ items: {len(mcq_items)}, JSON: {len(json_qs)}")
    print(f"Issues: {len(issues)}")
    for item in issues:
        print(item)


if __name__ == "__main__":
    main()
