#!/usr/bin/env python3
"""Sync exam JSON from data/exams/originals/{year}original.txt."""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

from exam_original_paths import ROOT, read_original_txt


@dataclass
class ParsedQuestion:
    stem: str
    options: dict[str, str] = field(default_factory=dict)
    is_true_false: bool = False


def _split_block(body: str, option_letters: str) -> ParsedQuestion:
    pat = re.compile(rf"^([{option_letters}])\.\s+(.+)$", re.I)
    opts: dict[str, str] = {}
    stem_lines: list[str] = []
    for line in body.splitlines():
        m = pat.match(line.strip())
        if m:
            opts[m.group(1).lower()] = m.group(2).strip()
        elif line.strip():
            stem_lines.append(line.rstrip())
    pq = ParsedQuestion(stem="\n".join(stem_lines).strip(), options=opts)
    if opts and set(opts.keys()) <= {"a", "b"} and all(
        v in ("True", "False", "Yes", "No") for v in opts.values()
    ):
        pq.is_true_false = True
    return pq


def _parse_sequential(
    text: str,
    option_letters: str,
    start_num: int = 1,
    end_num: int | None = None,
) -> dict[int, ParsedQuestion]:
    lines = text.splitlines()
    expected = start_num
    end_num = end_num or 999
    current_num: int | None = None
    current_lines: list[str] = []
    results: dict[int, ParsedQuestion] = {}
    in_context_skip = False

    def flush() -> None:
        nonlocal current_num, current_lines
        if current_num is None:
            return
        body = "\n".join(current_lines).strip()
        results[current_num] = _split_block(body, option_letters)
        current_lines = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith(("Use the following", "Based on the following", "Note:")):
            in_context_skip = True
            continue
        if stripped.startswith(("<", "<!DOCTYPE")):
            in_context_skip = True
            continue

        m = re.match(r"^(\d+)\.\s+(.*)$", line)
        if m:
            num = int(m.group(1))
            if start_num <= num <= end_num and num == expected:
                flush()
                in_context_skip = False
                current_num = num
                rest = m.group(2)
                current_lines = [rest] if rest else []
                expected = num + 1
                continue
            if in_context_skip:
                continue

        if in_context_skip:
            continue

        if current_num is not None:
            current_lines.append(line.rstrip())

    flush()
    return results


def parse_2021(orig: str) -> tuple[dict[int, ParsedQuestion], dict[int, ParsedQuestion]]:
    mcq_start = orig.index("Question ONE:")
    tf_start = orig.index("Question TWO")
    mcq_text = orig[mcq_start:tf_start]
    tf_text = orig[tf_start:]
    mcq = _parse_sequential(mcq_text, "ABCD", 1, 73)
    tf = _parse_sequential(tf_text, "ABCD", 74, 80)
    # TF questions have no ABCD - reparse as statement only
    tf_stmts: dict[int, ParsedQuestion] = {}
    current: int | None = None
    buf: list[str] = []
    for line in tf_text.splitlines():
        m = re.match(r"^(\d+)\.\s+(.*)$", line)
        if m:
            if current is not None:
                tf_stmts[current] = ParsedQuestion(
                    stem="\n".join(buf).strip(), is_true_false=True
                )
            current = int(m.group(1))
            buf = [m.group(2)]
        elif current and line.strip():
            buf.append(line.rstrip())
    if current is not None:
        tf_stmts[current] = ParsedQuestion(
            stem="\n".join(buf).strip(), is_true_false=True
        )
    return tf_stmts, mcq


def parse_2024(orig: str) -> dict[int, ParsedQuestion]:
    start = orig.index("1. Django is based")
    end = orig.index("End of Question")
    return _parse_sequential(orig[start:end], "abcd", 1, 90)


def parse_2025(orig: str) -> tuple[dict[int, ParsedQuestion], dict[int, ParsedQuestion]]:
    tf_start = orig.index("Question One:")
    mcq_start = orig.index("Question Two:")
    part_two = orig.index("Part Two:")
    tf_stmts: dict[int, ParsedQuestion] = {}
    current: int | None = None
    buf: list[str] = []
    for line in orig[tf_start:mcq_start].splitlines():
        m = re.match(r"^(\d+)\.\s+(.*)$", line)
        if m:
            if current is not None:
                tf_stmts[current] = ParsedQuestion(
                    stem="\n".join(buf).strip(), is_true_false=True
                )
            current = int(m.group(1))
            buf = [m.group(2)]
        elif current and line.strip():
            buf.append(line.rstrip())
    if current is not None:
        tf_stmts[current] = ParsedQuestion(
            stem="\n".join(buf).strip(), is_true_false=True
        )
    mcq = _parse_sequential(
        orig[mcq_start:part_two], "abcd", 35, 80
    )
    return tf_stmts, mcq


# --- year-specific context HTML/code overrides (block id -> fields) ---

CONTEXT_BY_YEAR: dict[str, dict[str, dict]] = {
    "2024": {
        "block_dom_html_79": {
            "text": "Based on the following HTML page, answer the following questions:",
            "code": """<!DOCTYPE html>
<html>
<head>
</head>
<body>
<h2 id="id1">Hello World</h2>
<p>Welcome</p>
<div>
<p>Paragraph 1.</p>
<p>Paragraph 2.</p>
<section><p>Paragraph 3.</p></section>
</div>
<p>Paragraph 4.</p>
<p>Paragraph 5.</p>
<script>
const my = document.getElementsByTagName("p");
document.getElementById("id1").innerHTML = my.length;
</script>
</body>
</html>""",
            "codeLanguage": "html",
        },
        "block_css_html_85": {
            "text": "Based on the following HTML page, answer the following questions",
            "code": """<!DOCTYPE html>
<html>
<head>
<style>
a[target=_blank] {
background-color: yellow;
}
p:first-child { color: red; }
</style>
</head>
<body>
<h2>CSS Selector</h2>
<p>Hello I am Here: P1</p>
<p>Hello I am Here: Paragraph 2</p>
<p>Hello I am Here: P3</p>
<a href="https://www.w3schools.com">w3schools.com</a>
<a href="http://www.disney.com" target="_blank">disney.com</a>
<a href="http://www.wikipedia.org" target="_top">wikipedia.org</a>
</body>
</html>""",
            "codeLanguage": "html",
        },
    },
    "2021": {
        "block_while_code": {
            "text": "For the next two questions, consider the following code:",
            "code": "var x = 20;\nwhile (x < 10) {\n  print(\"Hello\");\n  x *= 2;\n}",
            "codeLanguage": "javascript",
        },
        "block_run_code": {
            "text": "Use the following code, answer questions from 62-64: When the function run() is called.",
            "code": """function run() {
  var X = "X";
  let Y = "Y";
  console.log (X, Y);
  {
    var X = "X*";
    let Y = "Y*";
  console.log (X, Y);
  }
  console.log(X);
  console.log(Y);
}
run();""",
            "codeLanguage": "javascript",
        },
        "block_func_code": {
            "text": "Use the following code, answer questions from 65-68:",
            "code": """function func(x)
{
  console.log(typeof x, arguments.length);
}""",
            "codeLanguage": "javascript",
        },
        "block_const_code": {
            "text": "Use the following code, answer questions from 69-73:",
            "code": """const x = {name:"Ali", address: "Giza"};
x = {name:"Neamat"};
x.name = "Neamat";
const y = 23;
y = 44;
console.log(x.name);
console.log(y);""",
            "codeLanguage": "javascript",
        },
    },
}

BLOCK_ID_CONTEXT_KEY: dict[str, dict[str, str]] = {
    "2021": {
        "block_4": "block_while_code",
        "block_13": "block_run_code",
        "block_14": "block_func_code",
        "block_15": "block_const_code",
    },
    "2024": {
        "block_4": "block_dom_html_79",
        "block_5": "block_css_html_85",
    },
}

ANSWER_FIXES: dict[str, dict[str, str]] = {
    "2024": {
        "q1": "c",
        "q9": "d",
        "q10": "d",
        "q18": "a",
        "q22": "c",
        "q29": "b",
        "q31": "b",
        "q32": "a",
        "q41": "a",
        "q49": "c",
        "q53": "c",
        "q54": "c",
        "q55": "c",
        "q60": "d",
        "q64": "c",
        "q74": "d",
        "q79": "d",
        "q80": "c",
        "q81": "c",
        "q86": "d",
    },
    "2021": {
        "q3": "d",
        "q13": "c",
        "q19": "a",
        "q20": "b",
        "q32": "c",
        "q35": "a",
        "q45": "d",
        "q58": "c",
        "q61": "c",
        "q63": "a",
        "q64": "a",
        "q65": "c",
        "q66": "c",
        "q67": "c",
        "q73": "d",
        "q74": "false",
        "q75": "true",
        "q76": "false",
        "q77": "true",
        "q78": "false",
        "q79": "false",
        "q80": "false",
    },
    "2025": {
        "q53": "c",
        "q65": "d",
        "q76": "d",
        "q79": "d",
    },
}

EXPLANATION_FIXES: dict[str, dict[str, str]] = {
    "2024": {
        "q1": "Django uses the MVT (Model-View-Template) pattern, matching option c.",
        "q9": "The `innerHTML` property sets or returns the HTML content inside an element.",
        "q10": "`makemigrations` only creates migration files; applying them requires `migrate`, which is not listed.",
        "q18": "`10 + 20` is `30`, then `30 + \"5\"` concatenates to `\"305\"`.",
        "q22": "`reduce` with subtraction gives `170 - 50 - 25 = 95`.",
        "q29": "`cars.company` is `undefined` after delete; `cars[\"color\"]` is `\"white\"`.",
        "q31": "`filter()` returns an array; `typeof` an array is `\"object\"`.",
        "q32": "`lastIndexOf(10)` is 2, `indexOf(30)` is 3, sum is 5.",
        "q41": "Use `<del>` for deleted text and `<ins>` for inserted text; `<cut>` is not valid HTML.",
        "q49": "`index(3)` returns the first occurrence at index 2.",
        "q53": "`dict.keys()` reflects live changes; after adding `color`, there are four keys.",
        "q54": "Sets use `update()`; lists use `extend()` when adding from another collection.",
        "q55": "Both `copy()` and `dict()` can shallow-copy a dictionary.",
        "q60": "With string operands, `+` concatenates to `2010` and `-` coerces to numbers giving `10`.",
        "q64": "Valid arrow syntax; `f(4, 5)` returns `14`.",
        "q74": "Division in Python 3 returns a float: `100 / 20` is `5.0`.",
        "q79": "Accessing the text node uses `firstChild.nodeValue`; the listed shortcuts are incorrect.",
        "q80": "The script writes the paragraph count (6) into the `h2` element.",
        "q81": "Six `<p>` elements exist in the page, so the collection length is 6.",
        "q86": "No `<p>` element is the first child of its parent, so none match `:first-child`.",
    },
    "2021": {
        "q3": "HTTP 304 is Not Modified; Not Found is 404, so 304 - Not Found is the odd pair.",
        "q13": "The deprecated `<center>` tag maps to the `text-align` CSS property. The exam option misspelled it as `align`.",
        "q19": "With `x = 20`, `x < 10` is false immediately, so the loop never runs and nothing is printed.",
        "q20": "With `x = 5`, the loop prints once, then `x` becomes 10 and the condition fails.",
        "q22": "The printed exam snippet is truncated, but the complete function returns the numeric counter `ct`.",
        "q32": "`forloop.counter` is valid in Django templates; attributes are not called with parentheses.",
        "q35": "Create a project with `django-admin startproject <name>`, not the bare word `Project`.",
        "q45": "HTTP 200 with authorization means the user is authorized to see the response.",
        "q58": "The unindented `print` runs once; the `if` body is skipped because `2 < 1` is false.",
        "q68": "No arguments means `typeof` is `\"undefined\"` (lowercase) and `arguments.length` is 0.",
        "q61": "`100 / 20` evaluates to `5`.",
        "q63": "Inside the block, `var X` becomes `X*` and inner `let Y` is `Y*`, so the log is `X*, Y*`.",
        "q64": "After the block, `X` remains `X*` while outer `Y` is restored, so the logs are `X*` then `Y`.",
        "q65": "`typeof` reports `number` for the first argument and `arguments.length` is 2.",
        "q66": "The first argument is a string, so `typeof` is `string` with one argument.",
        "q67": "Four arguments are supplied, so `arguments.length` is 4.",
        "q73": "Reassigning `const y` throws before `console.log(y)` can run.",
        "q74": "JavaScript is dynamically typed.",
        "q75": "Loose equality coerces types; `200` equals `\"200\"`, but `===` does not.",
        "q76": "`isNaN(\"Hello\")` is true, but `isNaN(undefined)` is also true in JavaScript, so the second part of the statement is wrong.",
        "q77": "An empty list is falsy in Python boolean context.",
        "q78": "Sets are unordered and unindexed, not indexed.",
        "q79": "`pop()` on a set removes an arbitrary element; for `{1,2,3}` the removed item is not guaranteed to be 3 (sets are unordered). The statement as written about list behavior is false for sets — exam answer is False.",
        "q80": "Parentheses define a tuple, not a list.",
    },
    "2025": {
        "q65": "Python 3 prints `{1, 2, 3, 5}` with spaces; option c's `{1,2,3,5}` does not match exactly.",
        "q76": "Duplicates are removed, so the values are `{1, 2, 3, 5}`, but Python 3 prints sets with curly braces, not `set([1,2,3,5])`.",
        "q79": "`.flat(2)` yields `[1, 2, 3, 4, 5, 6, 7, 8]`, and `console.log` prints brackets; option c omits them.",
    },
}

OPTION_FIXES: dict[str, dict[str, dict[str, str]]] = {
    "2021": {
        "q13": {"c": "text-align"},
        "q32": {"c": "forloop.counter"},
        "q35": {"a": "django-admin startproject"},
        "q63": {"a": "X*, Y*"},
        "q64": {"a": "X*, Y"},
    },
}


def question_num(q: dict, qid: str) -> int | None:
    if qid == "q22_23a":
        return 22
    if qid == "q23b":
        return 23
    m = re.match(r"^(\d+)", q["questionText"].strip())
    return int(m.group(1)) if m else None


def remap_answer(
    question: dict, old_options: dict[str, str], new_options: dict[str, str]
) -> str | None:
    old_id = question.get("correctAnswerId")
    if not old_id:
        return None
    old_label = None
    for opt in question["options"]:
        if opt["id"] == old_id:
            old_label = opt["content"]
            break
    if old_label is None:
        return None
    for letter, label in new_options.items():
        if label == old_label:
            return letter
    return None


def apply_context(year: str, block: dict) -> None:
    mapping = BLOCK_ID_CONTEXT_KEY.get(year, {})
    ctx_keys = CONTEXT_BY_YEAR.get(year, {})
    block_id = block.get("id")
    if not block_id:
        return
    key = mapping.get(block_id)
    if not key or key not in ctx_keys:
        return
    ctx = block.setdefault("context", {})
    ctx.update(ctx_keys[key])


def sync_year(year: str) -> int:
    exam_path = ROOT / "data" / "exams" / f"{year}.json"
    orig = read_original_txt(year)
    data = json.loads(exam_path.read_text(encoding="utf-8"))

    tf_items: dict[int, ParsedQuestion] = {}
    mcq_items: dict[int, ParsedQuestion] = {}
    if year == "2021":
        tf_items, mcq_items = parse_2021(orig)
    elif year == "2024":
        mcq_items = parse_2024(orig)
    elif year == "2025":
        tf_items, mcq_items = parse_2025(orig)
    else:
        raise SystemExit(f"Unsupported year: {year}")

    changes = 0
    answer_fixes = ANSWER_FIXES.get(year, {})
    expl_fixes = EXPLANATION_FIXES.get(year, {})
    option_fixes = OPTION_FIXES.get(year, {})

    for block in data:
        apply_context(year, block)
        for question in block["questions"]:
            qid = question["id"]
            num = question_num(question, qid)
            if num is None:
                continue

            if year == "2021" and num >= 74:
                parsed = tf_items.get(num)
            elif year == "2025" and num <= 34:
                parsed = tf_items.get(num)
            else:
                parsed = mcq_items.get(num)

            if not parsed:
                print(f"WARN missing parsed #{num} ({qid})")
                continue

            new_text = f"{num}. {parsed.stem}"
            if question["questionText"] != new_text:
                question["questionText"] = new_text
                changes += 1

            old_opts = {o["id"]: o["content"] for o in question["options"]}
            if parsed.options and not parsed.is_true_false:
                for opt in question["options"]:
                    letter = opt["id"]
                    if letter in parsed.options and opt["content"] != parsed.options[letter]:
                        opt["content"] = parsed.options[letter]
                        changes += 1
                remapped = remap_answer(question, old_opts, parsed.options)
                if remapped and remapped != question.get("correctAnswerId"):
                    question["correctAnswerId"] = remapped
                    changes += 1

            for letter, content in option_fixes.get(qid, {}).items():
                for opt in question["options"]:
                    if opt["id"] == letter and opt["content"] != content:
                        opt["content"] = content
                        changes += 1

            if qid in answer_fixes:
                question["correctAnswerId"] = answer_fixes[qid]
                changes += 1
            if qid in expl_fixes:
                question["explanation"] = expl_fixes[qid]
                changes += 1

    exam_path.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"{year}: {changes} changes")
    return changes


def main() -> None:
    years = sys.argv[1:] or ["2021", "2024"]
    for year in years:
        sync_year(year)


if __name__ == "__main__":
    main()
