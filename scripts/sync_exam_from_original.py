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
                body = "\n".join(buf).strip()
                pq = _split_block(body, "ab")
                if not pq.options:
                    pq.is_true_false = True
                tf_stmts[current] = pq
            current = int(m.group(1))
            buf = [m.group(2)]
        elif current and line.strip():
            buf.append(line.rstrip())
    if current is not None:
        body = "\n".join(buf).strip()
        pq = _split_block(body, "ab")
        if not pq.options:
            pq.is_true_false = True
        tf_stmts[current] = pq
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
        "q30": "d",
        "q31": "b",
        "q36": "b",
        "q37": "c",
        "q32": "a",
        "q35": "d",
        "q40": "b",
        "q41": "a",
        "q42": "b",
        "q62": "a",
        "q49": "c",
        "q53": "c",
        "q54": "c",
        "q55": "c",
        "q60": "d",
        "q64": "c",
        "q74": "d",
        "q77": "c",
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
        "q74": "b",
        "q75": "a",
        "q76": "b",
        "q77": "a",
        "q78": "b",
        "q79": "b",
        "q80": "b",
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
        "q30": "`eval(\"x * y\")` returns the number `200`, not the string `\"200\"`.",
        "q31": "`filter()` returns an array; `typeof` an array is `\"object\"`.",
        "q36": "`(*k,) = (1, 2, 3, 4)` sets `k` to `[1, 2, 3, 4]`, matching option b.",
        "q37": "`(x, *k, y) = (1, 2, 3, 4)` sets `k` to `[2, 3]`, matching option c.",
        "q32": "`lastIndexOf(10)` is 2, `indexOf(30)` is 3, sum is 5.",
        "q35": "The semicolon after the `for` loop leaves an empty body; `document.write(a)` runs once and prints `5`.",
        "q40": "H₂O needs `<sub>` for the 2; option B is `<p>H<sub>2</sub>O</p>`.",
        "q41": "Use `<del>` for deleted text and `<ins>` for inserted text; `<cut>` is not valid HTML.",
        "q42": "The `<img>` tag uses the `src` attribute to specify the image path.",
        "q62": "`<div>` is a structural container for grouping sections, not for styling, headings, or titles by itself.",
        "q49": "`index(3)` returns the first occurrence at index 2.",
        "q53": "`dict.keys()` reflects live changes; after adding `color`, there are four keys.",
        "q54": "Sets use `update()`; lists use `extend()` when adding from another collection.",
        "q17": "JavaScript is case-sensitive. `X` (uppercase) is the global variable `10`; `x` (lowercase) is a separate `let` inside `myfunc`, which is never called. `document.write(X)` outputs `10`.",
        "q55": "Both `copy()` and `dict()` can shallow-copy a dictionary. Option a shows `Copy()` with a capital C; Python is case-sensitive, so that is a typo for `copy()`.",
        "q60": "With string operands, `+` concatenates to `2010`. The `-` operator coerces the strings to numbers, giving `10`.",
        "q65": "The `map()` method transforms every element and requires a callback function. Option A supplies a valid arrow function.",
        "q66": "The `filter()` method keeps elements that pass a callback test. Option B supplies a valid arrow function.",
        "q75": "Python requires an indented block under `if`. The second `print` is not indented into the `if` body, so this raises an `IndentationError`.",
        "q64": "Valid arrow syntax; `f(4, 5)` returns `14`.",
        "q74": "Division in Python 3 returns a float: `100 / 20` is `5.0`.",
        "q77": "`x[7:]` starts at index 7 (the first `l` in `Lovely`), yielding `ly Bird!`.",
        "q79": "Text inside an element lives in a child text node. The correct approach is `document.getElementById(\"id1\").firstChild.nodeValue`. `innerHTML` is not equivalent; `.text` is not a standard element property; and `nodeValue` on the element itself is `null`.",
        "q80": "The script sets `h2` innerHTML to `my.length`, the count of `<p>` elements (6).",
        "q82": "The child combinator `>` selects only direct `<p>` children of `<div>`: Paragraph 1 and Paragraph 2. Paragraph 3 is inside `<section>`, not a direct child of `<div>`.",
        "q83": "The general sibling combinator `~` selects `<p>` siblings that follow `<div>` at the same level: Paragraph 4 and Paragraph 5.",
        "q81": "Six `<p>` elements exist in the page, so the collection length is 6.",
        "q86": "`:first-child` matches only when an element is the first child of its parent. Under `<body>`, `<h2>` is the first child, not any `<p>`, so none match.",
    },
    "2021": {
        "q3": "HTTP 304 is Not Modified; Not Found is 404, so 304 - Not Found is the odd pair.",
        "q13": "The deprecated `<center>` tag centered inline content. The CSS equivalent is the `text-align` property (e.g., `text-align: center`).",
        "q19": "With `x = 20`, the condition `x < 10` is false immediately, so the `while` loop body never runs and \"Hello\" is printed 0 times.",
        "q20": "With `x = 5`, the loop runs once (`5 < 10`), prints \"Hello\", then `x` becomes 10. On the next check, `10 < 10` is false, so the loop stops after exactly 1 print.",
        "q22": "The full function increments `ct` and returns it, so the return value is always a number. It may be 0 when no element is >= 70.",
        "q32": "`forloop.counter` is valid in Django templates; attributes are not called with parentheses.",
        "q35": "Create a project with `django-admin startproject <name>`, not the bare word `Project`.",
        "q45": "HTTP 200 with authorization means the user is authorized to see the response.",
        "q58": "`2 < 1` is false, so the indented `print` under `if` is skipped. The second, unindented `print` still runs once.",
        "q59": "Dictionaries forbid duplicate keys; the last `mobile` value wins.",
        "q61": "`100 / 20` evaluates to `5.0` in Python 3. Option C is the intended answer.",
        "q63": "Inside the block, `var X` becomes `X*` and inner `let Y` is `Y*`, so the log is `X*, Y*`.",
        "q64": "After the block, function-scoped `X` stays `X*` while outer `Y` is restored, so the logs are `X*` then `Y`.",
        "q65": "`typeof` reports `number` for the first argument and `arguments.length` is 2.",
        "q66": "The first argument is a string, so `typeof` is `string` with one argument passed.",
        "q67": "Four arguments are supplied, so `arguments.length` is 4.",
        "q68": "With no arguments, `x` is `undefined` and `arguments.length` is 0.",
        "q72": "Without the errors, `x.name` is updated to `\"Neamat\"` and logged successfully.",
        "q73": "Reassigning `const y` throws before `console.log(y)` can run.",
        "q74": "JavaScript is dynamically typed.",
        "q75": "Loose equality (`==`) coerces types; `200` equals `\"200\"`, but strict equality (`===`) compares value and type.",
        "q76": "`isNaN(\"Hello\")` is true, but `isNaN(undefined)` is also true, so the second part of the statement is incorrect.",
        "q77": "An empty list evaluates as falsy in a Python boolean context.",
        "q78": "Sets are inherently unordered and explicitly unindexed.",
        "q79": "Running `pop()` on a set removes an arbitrary element; it is not guaranteed to be 3.",
        "q80": "Parentheses define a Python tuple, not a list (`[]`).",
    },
    "2025": {
        "q65": "Duplicates are removed, so the values are `{1, 2, 3, 5}`, but Python 3 prints sets with spaces after commas (e.g. `{1, 2, 3, 5}`). Option c omits those spaces, so none of the options match exactly.",
        "q76": "Duplicates are removed, so the values are `{1, 2, 3, 5}`, but Python 3 prints sets with curly braces (e.g. `{1, 2, 3, 5}`), not `set([1,2,3,5])`. None of the listed formats match exactly.",
        "q79": "`.flat(2)` yields `[1, 2, 3, 4, 5, 6, 7, 8]`, and `console.log` prints array brackets and spaces. Option c omits brackets, so it does not match the actual console output.",
        "q80": "`f()` starts the async function, then `console.log('first!')` runs immediately. After about one second the awaited promise resolves and `done!` is logged. Because both strings appear, the answer is \"Something else.\"",
    },
}

OPTION_FIXES: dict[str, dict[str, dict[str, str]]] = {
    "2021": {
        "q13": {"c": "text-align"},
        "q32": {"c": "forloop.counter"},
        "q35": {"a": "django-admin startproject"},
        "q59": {"d": "Error!"},
        "q63": {"a": "X*, Y*"},
        "q64": {"a": "X*, Y"},
        "q74": {"a": "True", "b": "False"},
        "q75": {"a": "True", "b": "False"},
        "q76": {"a": "True", "b": "False"},
        "q77": {"a": "True", "b": "False"},
        "q78": {"a": "True", "b": "False"},
        "q79": {"a": "True", "b": "False"},
        "q80": {"a": "True", "b": "False"},
    },
    "2024": {
        "q38": {"c": "Both a and b."},
        "q65": {"a": "myNumbers.map((value) => value * 4);"},
        "q66": {"b": "myNumbers.filter((value) => value < 10);"},
        "q74": {"d": "5.0"},
        "q79": {
            "a": 'document.getElementById("id1").innerHTML',
            "c": 'document.getElementById("id1").nodeValue',
        },
        "q80": {"c": "6"},
        "q86": {"d": "None of the above"},
    },
    "2025": {
        "q77": {
            "a": "{'name': 'Ahmed', 'id': '1', 'mobile': 123456789, 'mobile': 987654321}",
        },
    },
}

QUESTION_TEXT_FIXES: dict[str, dict[str, str]] = {
    "2021": {
        "q15": "15. With which tag do you write the style rules directly within the document found within the head of the document?",
        "q18": "18. Which of the following lines of JavaScript code will change the HTML inside of an element with the attribute id=\"myElement\" to \"CS 105\"?",
        "q19": "19. If the function print() has been defined that prints the value passed in as the parameter to it, how many times is \"Hello\" printed?",
        "q20": "20. If the initial value of x (set on Line #1) is now 5 instead of 20, how many times is \"Hello\" printed?",
        "q75": "75. var a = 200; var b = \"200\"; a == b will return true while a === b will return false?",
        "q79": "79. In the following statement: myNumbers = {1, 2, 3}; x = myNumbers.pop(); The removed item will be 3.",
    },
    "2024": {
        "q17": "17. What will be the value of X?",
        "q60": "60. What is the output of the following JavaScript snippet?\nx = \"20\";\ny = \"10\";\ndocument.writeln(x+y, x-y);",
        "q68": "68. In the following statement: myNumbers = [1, 2, 3]; x = myNumbers.pop();\nThe removed item will be 1",
        "q73": "73. def f(**person):\nprint(\"Person's name is \" + person[\"name\"])\nf(name=\"Ahmed\", age=10)\nThe above statement will return:",
        "q75": "75. In the following Python statements:\nif 1 < 2:\nprint(\"One is less than Two!\")\nprint(\"One is less than Two!\")",
        "q76": "76. The output of the following statement in python is:\nx = \"My Lovely Bird!\"\nprint(x[:7])",
        "q82": "82. By using this CSS selector div > p { color: red; }, how many p elements will be styled?",
        "q83": "83. By using this CSS selector div ~ p { color: blue; }, the number of p elements that will be styled is",
    },
    "2025": {
        "q21": "21. In the following statement:\nmyNumbers = [1,2,3]\nx = myNumbers.pop()\nThe removed item will be 1.",
        "q22": "22. In the following statement:\nmyNumbers = [1,2,3]\nx = myNumbers.pop()\nThe removed item will be 3.",
        "q26": "26. The output of the following statements is Hello, My\nb = \"Hello, My Friend\"\nprint(b[:8])",
        "q28": "28. The output of the following Python statements is ['a', 'b', 'C']\nX = ['C','b','a']\nX.sort()\nprint(X)",
        "q32": "32. The output of the following Python statements is ['a', 'b', 'c']\nX = ['C','b','A']\nX.sort(key = str.lower)\nprint(X)",
        "q53": "53. What will be the output of `document.getElementById(\"id1\").firstChild.nodeName;`?",
        "q70": "70. What will be the output of the following python code?\nnewtuple = (1,2,3,4)\n(*k,) = newtuple\nprint(k)",
        "q71": "71. What will be the output of the following Python code?\nnewtuple=(1,2,3)\n(x, *k, y, z, m) = newtuple\nprint(k)",
        "q75": "75. In the following Python statements:\nY = set((\"a\",\"b\",\"c\"))\nprint(Y)\nThe output will be:",
        "q77": "77. The following python code:\nx={\n\"name\": \"Ahmed\",\n\"id\": \"1\",\n\"mobile\": 123456789,\n\"mobile\": 987654321\n}\nprint(x)\nThe above print will return:",
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
    question_text_fixes = QUESTION_TEXT_FIXES.get(year, {})

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

            new_text = question_text_fixes.get(qid, f"{num}. {parsed.stem}")
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
