#!/usr/bin/env python3
"""Append ANSWER: and EXPLANATION: lines to data/exams/originals/{year}original.txt."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from exam_original_paths import ROOT, original_txt_path

CONTEXT_MARKERS = ("Use the following", "Based on the following", "Note:")
WRITTEN_2025_END_MARKER = "Font family to Arial [1 mark]"


def format_answer(question: dict) -> str:
    answer_id = question["correctAnswerId"]
    options = {opt["id"]: opt["content"] for opt in question["options"]}
    if answer_id in ("true", "false"):
        return "A" if answer_id == "true" else "B"
    if len(options) == 2 and set(options.values()) <= {"True", "False"}:
        return answer_id.upper()
    return answer_id.upper()


def load_exam_annotations(year: str) -> tuple[dict[int, str], dict[int, str]]:
    exam_path = ROOT / "data" / "exams" / f"{year}.json"
    data = json.loads(exam_path.read_text(encoding="utf-8"))
    answers: dict[int, str] = {}
    explanations: dict[int, str] = {}
    for block in data:
        for question in block["questions"]:
            match = re.match(r"^(\d+)", question["questionText"].strip())
            if not match:
                continue
            num = int(match.group(1))
            answers[num] = format_answer(question)
            explanation = (question.get("explanation") or "").strip()
            if explanation:
                explanations[num] = explanation
    return answers, explanations


def load_2025_written_annotation() -> tuple[list[str], str] | None:
    path = ROOT / "data" / "written-questions" / "questions.json"
    payload = json.loads(path.read_text(encoding="utf-8"))
    for question in payload.get("questions", []):
        placement = question.get("examPlacement") or {}
        if placement.get("year") == "2025":
            answer = (question.get("expectedAnswer") or "").strip()
            explanation = (question.get("explanation") or "").strip()
            if answer and explanation:
                return answer.splitlines(), explanation
    return None


def strip_annotation_lines(lines: list[str], year: str) -> list[str]:
    out: list[str] = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith(("ANSWER:", "EXPLANATION:")):
            continue
        if stripped == "Answer:":
            continue
        out.append(line)

    if year == "2025":
        for index, line in enumerate(out):
            if WRITTEN_2025_END_MARKER in line:
                return out[: index + 1]
    return out


def last_non_blank(lines: list[str], end: int) -> int:
    while end >= 0 and not lines[end].strip():
        end -= 1
    return end


def find_line_index(lines: list[str], needle: str, start: int = 0) -> int:
    for index in range(start, len(lines)):
        if needle in lines[index]:
            return index
    raise ValueError(f"Could not find {needle!r} in file")


def scan_mcq_section(
    lines: list[str],
    sec_start: int,
    sec_end: int,
    q_start_num: int,
    q_end_num: int,
) -> list[tuple[int, int]]:
    expected = q_start_num
    in_context_skip = False
    current_q: int | None = None
    insertions: list[tuple[int, int]] = []

    def finish(end_index: int) -> None:
        nonlocal current_q
        if current_q is None:
            return
        insert_at = last_non_blank(lines, end_index)
        if insert_at >= sec_start:
            insertions.append((insert_at, current_q))
        current_q = None

    for index in range(sec_start, sec_end):
        stripped = lines[index].strip()
        if not stripped:
            continue

        if stripped.startswith(CONTEXT_MARKERS):
            finish(index - 1)
            in_context_skip = True
            continue
        if stripped.startswith(("<", "<!DOCTYPE")):
            finish(index - 1)
            in_context_skip = True
            continue

        match = re.match(r"^(\d+)\.\s+", lines[index])
        if match:
            num = int(match.group(1))
            if q_start_num <= num <= q_end_num and num == expected:
                finish(index - 1)
                in_context_skip = False
                current_q = num
                expected = num + 1
                continue
            if in_context_skip:
                continue

        if in_context_skip:
            continue

    finish(sec_end - 1)
    return insertions


def scan_tf_section(
    lines: list[str],
    sec_start: int,
    sec_end: int,
    q_start_num: int,
    q_end_num: int,
) -> list[tuple[int, int]]:
    insertions: list[tuple[int, int]] = []
    current_q: int | None = None

    for index in range(sec_start, sec_end):
        match = re.match(r"^(\d+)\.\s+", lines[index])
        if not match:
            continue
        num = int(match.group(1))
        if current_q is not None and q_start_num <= current_q <= q_end_num:
            insert_at = last_non_blank(lines, index - 1)
            insertions.append((insert_at, current_q))
        if q_start_num <= num <= q_end_num:
            current_q = num
        else:
            current_q = None

    if current_q is not None:
        insert_at = last_non_blank(lines, sec_end - 1)
        insertions.append((insert_at, current_q))

    return insertions


def detect_insertions(year: str, lines: list[str]) -> list[tuple[int, int]]:
    if year == "2021":
        q1 = find_line_index(lines, "Question ONE:")
        q2 = find_line_index(lines, "Question TWO")
        return scan_mcq_section(lines, q1, q2, 1, 73) + scan_tf_section(
            lines, q2, len(lines), 74, 80
        )

    if year == "2024":
        start = find_line_index(lines, "1. Django is based")
        end = find_line_index(lines, "End of Question")
        return scan_mcq_section(lines, start, end, 1, 90)

    if year == "2025":
        q1 = find_line_index(lines, "Question One:")
        q2 = find_line_index(lines, "Question Two:")
        part_two = find_line_index(lines, "Part Two:")
        return scan_tf_section(lines, q1, q2, 1, 34) + scan_mcq_section(
            lines, q2, part_two, 35, 80
        )

    raise SystemExit(f"Unsupported year: {year}")


def apply_annotations(
    lines: list[str],
    insertions: list[tuple[int, int]],
    answers: dict[int, str],
    explanations: dict[int, str],
) -> list[str]:
    insert_map = {insert_at: num for insert_at, num in insertions}
    missing = sorted({num for _, num in insertions if num not in answers})
    if missing:
        raise SystemExit(f"Missing answers for questions: {missing}")

    output: list[str] = []
    for index, line in enumerate(lines):
        output.append(line)
        if index not in insert_map:
            continue
        num = insert_map[index]
        output.append(f"ANSWER: {answers[num]}")
        if num in explanations:
            output.append(f"EXPLANATION: {explanations[num]}")
    return output


def append_2025_written_section(output: list[str]) -> list[str]:
    written = load_2025_written_annotation()
    if not written:
        return output
    answer_lines, explanation = written
    output.append("ANSWER:")
    output.extend(answer_lines)
    output.append(f"EXPLANATION: {explanation}")
    return output


def annotate_year(year: str) -> int:
    original_path = original_txt_path(year)
    answers, explanations = load_exam_annotations(year)
    lines = strip_annotation_lines(
        original_path.read_text(encoding="utf-8").splitlines(),
        year,
    )
    insertions = detect_insertions(year, lines)
    updated = apply_annotations(lines, insertions, answers, explanations)
    if year == "2025":
        updated = append_2025_written_section(updated)
    original_path.write_text("\n".join(updated) + "\n", encoding="utf-8")
    print(f"{year}: annotated {len(insertions)} questions")
    return len(insertions)


def main() -> None:
    years = sys.argv[1:] or ["2021", "2024", "2025"]
    for year in years:
        annotate_year(year)


if __name__ == "__main__":
    main()
