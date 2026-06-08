#!/usr/bin/env python3
"""Sync data/exams/2025.json from data/exams/originals/2025original.txt."""

from __future__ import annotations

import json
import re
from pathlib import Path

from exam_original_paths import ROOT, read_original_txt
EXAM_PATH = ROOT / "data/exams/2025.json"

JSON_ID_BY_NUM: dict[int, str] = {
    22: "q22_23a",
    23: "q23b",
}

HTML_BLOCK_53 = """<html>
<head>
</head>
<body>
<h2 id="id1">Welcome to my page</h2>
<p>Welcome</p>
<div>
<p>Paragraph 1 </p>
<p>Paragraph 2 </p>
<section>
<p>Paragraph 3 </p>
</section>
<p>Paragraph 4 </p>
</div>
<p class="center">Paragraph 5</p>
<h1 class="center"> Hello Again </h1>
<p class="large">Paragraph 6. </p>
</body>
</html>"""

HTML_BLOCK_59 = """<html>
<body>
<ol>
<li id="1"><p>List 1</p></li>
<li id="2"><p>List 2</p></li>
<li id="3"><p>List 3</p></li>
<li id="4"><p>List 4</p></li>
</ol>
</body>
</html>"""

ANSWER_FIXES: dict[str, str] = {
    "q53": "c",
    "q65": "c",
    "q76": "a",
}

EXPLANATION_FIXES: dict[str, str] = {
    "q53": (
        "The `firstChild` of `<h2 id=\"id1\">` is the text node containing "
        "\"Welcome to my page\". For a text node, `nodeName` returns `#text`."
    ),
    "q58": (
        "Counting the `<p>` elements in the HTML page: Welcome, Paragraph 1, "
        "Paragraph 2, Paragraph 3, Paragraph 4, Paragraph 5, and Paragraph 6 "
        "gives 7 tags. Since 7 is not listed in options a, b, or c, the answer "
        "is None of the previous."
    ),
    "q65": (
        "`Y` is a set, so duplicate values are removed. `print(Y)` outputs "
        "`{1, 2, 3, 5}` (spacing may vary), which matches option c."
    ),
    "q67": (
        "`car.get(\"color\", \"red\")` returns the default string `\"red\"` "
        "because `color` is not in the dictionary. `len(\"red\")` is 3."
    ),
    "q76": (
        "Printing a set removes duplicates. The printed representation is a "
        "set of the unique values 1, 2, 3, and 5, which matches "
        "`set([1,2,3,5])` in the exam options."
    ),
    "q79": (
        "`.flat(2)` flattens nested arrays up to depth 2, producing "
        "`[1, 2, 3, 4, 5, 6, 7, 8]`."
    ),
    "q80": (
        "`f()` starts the async function, then `console.log('first!')` runs "
        "immediately. After about one second the awaited promise resolves and "
        "`done!` is logged. Because both strings appear, the answer is "
        "Something else."
    ),
}


def json_id_for_num(num: int) -> str:
    return JSON_ID_BY_NUM.get(num, f"q{num}")


def parse_true_false(orig_text: str) -> dict[int, str]:
    start = orig_text.index("Question One:")
    end = orig_text.index("Question Two:")
    section = orig_text[start:end]
    lines = section.splitlines()
    items: dict[int, list[str]] = {}
    current: int | None = None
    for line in lines:
        m = re.match(r"^(\d+)\.\s+(.*)$", line)
        if m:
            current = int(m.group(1))
            items[current] = [m.group(2)]
        elif current is not None and line.strip():
            items[current].append(line.rstrip())
    return {num: "\n".join(parts) for num, parts in items.items()}


def parse_mcq(orig_text: str) -> dict[int, dict]:
    start = orig_text.index("Question Two:")
    end = orig_text.index("Part Two:")
    section = orig_text[start:end]
    lines = section.splitlines()

    items: dict[int, list[str]] = {}
    current: int | None = None
    for line in lines:
        if line.startswith("Based on the following HTML page"):
            current = None
            continue
        if line.strip().startswith("<"):
            continue
        m = re.match(r"^(\d+)\.\s+(.*)$", line)
        if m:
            current = int(m.group(1))
            items[current] = [m.group(2)]
        elif current is not None and line.strip():
            items[current].append(line.rstrip())
    parsed: dict[int, dict] = {}
    for num, parts in items.items():
        text = "\n".join(parts)
        stem, opts = split_mcq(text)
        parsed[num] = {"stem": stem, "options": opts}
    return parsed


def split_mcq(text: str) -> tuple[str, dict[str, str]]:
    opts: dict[str, str] = {}
    lines = text.splitlines()
    stem_lines: list[str] = []
    for line in lines:
        m = re.match(r"^([a-d])\.\s+(.+)$", line)
        if m:
            opts[m.group(1)] = m.group(2).strip()
        else:
            stem_lines.append(line)
    return "\n".join(stem_lines).strip(), opts


def format_question_text(num: int, body: str) -> str:
    return f"{num}. {body}"


def main() -> None:
    orig_text = read_original_txt(2025)
    tf_items = parse_true_false(orig_text)
    mcq_items = parse_mcq(orig_text)

    data = json.loads(EXAM_PATH.read_text(encoding="utf-8"))
    updated = 0

    num_by_id: dict[str, int] = {}
    for block in data:
        for question in block["questions"]:
            qid = question["id"]
            m = re.match(r"^(\d+)", question["questionText"].strip())
            if m:
                num_by_id[qid] = int(m.group(1))
            elif qid == "q22_23a":
                num_by_id[qid] = 22
            elif qid == "q23b":
                num_by_id[qid] = 23

    for block in data:
        if block.get("id") == "block_3":
            block["context"]["code"] = HTML_BLOCK_53
        if block.get("id") == "block_4":
            block["context"]["code"] = HTML_BLOCK_59

        for question in block["questions"]:
            qid = question["id"]
            num = num_by_id.get(qid)
            if num is None:
                continue

            if num <= 34:
                body = tf_items.get(num)
                if not body:
                    raise SystemExit(f"Missing TF #{num}")
                new_text = format_question_text(num, body)
            else:
                item = mcq_items.get(num)
                if not item:
                    raise SystemExit(f"Missing MCQ #{num}")
                new_text = format_question_text(num, item["stem"])
                for opt in question["options"]:
                    letter = opt["id"]
                    if letter in item["options"]:
                        opt["content"] = item["options"][letter]

            if question["questionText"] != new_text:
                question["questionText"] = new_text
                updated += 1

            if qid in ANSWER_FIXES:
                question["correctAnswerId"] = ANSWER_FIXES[qid]
                updated += 1

            if qid in EXPLANATION_FIXES:
                question["explanation"] = EXPLANATION_FIXES[qid]
                updated += 1

    EXAM_PATH.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Updated 2025.json ({updated} field changes written)")


if __name__ == "__main__":
    main()
