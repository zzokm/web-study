#!/usr/bin/env python3
"""Normalize 2025 original: TF bubble options, A/B answer keys, minor stem cleanup."""

from __future__ import annotations

import re
from pathlib import Path

from exam_original_paths import ROOT, original_txt_path


def fix_tf_section(tf_part: str) -> str:
    lines = tf_part.splitlines()
    out: list[str] = []
    for line in lines:
        m = re.match(r"^ANSWER:\s*(True|False)\s*$", line.strip())
        if m:
            recent = [l.strip() for l in out if l.strip()][-2:]
            if not any(l.startswith("a. True") for l in recent):
                out.append("a. True")
                out.append("b. False")
            letter = "A" if m.group(1) == "True" else "B"
            out.append(f"ANSWER: {letter}")
            continue
        out.append(line)
    return "\n".join(out)


def main() -> None:
    path = original_txt_path("2025")
    text = path.read_text(encoding="utf-8")
    tf_start = text.index("Question One:")
    mcq_start = text.index("Question Two:")
    part_two = text.index("Part Two:")

    tf_part = fix_tf_section(text[tf_start:mcq_start])
    mcq_part = text[mcq_start:part_two]
    tail = text[part_two:]

    replacements = [
        (r"Print\s*\(", "print("),
        (r"Print\s*\(", "print("),
        ("myNumbers =[1,2,3]", "myNumbers = [1,2,3]"),
        ('"document.getElementById("id1").firstChild.nodeName;"', "`document.getElementById(\"id1\").firstChild.nodeName;`"),
        ("Print(y)", "print(Y)"),
        (
            "{'name': 'Ahmed', 'id': '1', 'mobile': 123456789, 'mobile': 987654321}.",
            "{'name': 'Ahmed', 'id': '1', 'mobile': 123456789, 'mobile': 987654321}",
        ),
        (
            "EXPLANATION: Your snippet should render the sentence with strike-through on \"English\" and underline on \"Arabic\", include a button labeled \"Style\", and apply green 14px Arial styling to the paragraph when clicked. Any valid HTML/CSS/JS approach works as long as the outcome matches. See the model answer below.",
            "EXPLANATION: The snippet properly renders the sentence with strike-through on \"English\" (using the `<s>` or `<del>` tag) and underline on \"Arabic\" (using the `<u>` or `<ins>` tag). It includes a `<button>` labeled \"Style\" attached to an `onclick` event listener. The paired JavaScript function targets the paragraph by its ID and applies green, 14px, Arial styling when clicked.",
        ),
    ]
    body = tf_part + "\n" + mcq_part
    for old, new in replacements:
        body = body.replace(old, new)

    path.write_text(text[:tf_start] + body + tail, encoding="utf-8")
    print(f"Normalized {path}")


if __name__ == "__main__":
    main()
