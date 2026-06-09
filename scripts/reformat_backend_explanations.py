#!/usr/bin/env python3
"""Normalize structure, dashes, and bullets in backend explanation JSON files."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = [
    ROOT / "data" / "explanations" / "be2-python-explanations.json",
    ROOT / "data" / "explanations" / "backend-other-explanations.json",
]

TRAP_MARKERS = (
    "exam trap:",
    "common trap:",
    "exam trick:",
    "exam tip:",
)


def normalize_dashes(text: str) -> str:
    text = text.replace("\u2014", ": ")  # em dash
    text = text.replace("\u2013", " to ")  # en dash
    text = re.sub(r"\s+:\s+", ": ", text)
    text = re.sub(r" to to ", " to ", text)
    return text


def normalize_bullets(text: str) -> str:
    text = re.sub(r"- \*\*([A-D])\*\*\s*:\s*", r"- \1: ", text)
    text = re.sub(r"- \*\*([A-D])\*\*\s+", r"- \1: ", text)
    return text


def fix_inline_code_quotes(text: str) -> str:
    """Prefer double quotes inside backtick spans to avoid display/parser issues."""
    def repl(match: re.Match[str]) -> str:
        inner = match.group(1).replace("'", '"')
        return f"`{inner}`"

    return re.sub(r"`([^`]+)`", repl, text)


def split_sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p for p in parts if p]


def chunk_sentences(sentences: list[str], size: int = 2) -> list[str]:
    chunks: list[str] = []
    buf: list[str] = []
    for sent in sentences:
        buf.append(sent)
        if len(buf) >= size:
            chunks.append(" ".join(buf))
            buf = []
    if buf:
        chunks.append(" ".join(buf))
    return chunks


def repair_broken_headers(text: str) -> str:
    """Fix headers split as **Title\\n\\n** by earlier formatting passes."""
    text = re.sub(r"\*\*([^*\n]+)\n+\*\*", r"**\1**", text)
    return text


def ensure_section_spacing(text: str) -> str:
    text = repair_broken_headers(text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"(?<!\n\n)(\*\*[^*\n]+\*\*)", r"\n\n\1", text)
    return text.strip()


def extract_trap(text: str) -> tuple[str, str | None]:
    lower = text.lower()
    for marker in TRAP_MARKERS:
        idx = lower.find(marker)
        if idx != -1:
            main = text[:idx].strip().rstrip(".")
            trap = text[idx + len(marker) :].strip()
            return main, trap
    return text, None


def has_sections(text: str) -> bool:
    return text.count("**") >= 2


def structure_plain(text: str) -> str:
    main, trap = extract_trap(text)
    sentences = split_sentences(main)
    if not sentences:
        return text

    chunks = chunk_sentences(sentences, size=2)
    sections = [f"**Answer**\n\n{chunks[0]}"]
    if len(chunks) > 1:
        sections.append(f"**Explanation**\n\n" + "\n\n".join(chunks[1:]))
    if trap:
        sections.append(f"**Exam tip**\n\n{trap}")
    return "\n\n".join(sections)


def reformat_explanation(text: str) -> str:
    text = normalize_dashes(text)
    text = normalize_bullets(text)
    text = fix_inline_code_quotes(text)
    if has_sections(text):
        return ensure_section_spacing(text)
    return ensure_section_spacing(structure_plain(text))


def process_file(path: Path) -> int:
    data = json.loads(path.read_text(encoding="utf-8"))
    changes = 0
    for year, items in data.items():
        for qid, expl in items.items():
            new = reformat_explanation(expl)
            if new != expl:
                items[qid] = new
                changes += 1
    if changes:
        path.write_text(
            json.dumps(data, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
    print(f"{path.name}: {changes} updated")
    return changes


def main() -> None:
    total = 0
    for path in SOURCES:
        if path.exists():
            total += process_file(path)
    print(f"Total: {total}")


if __name__ == "__main__":
    main()
