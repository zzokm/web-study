#!/usr/bin/env python3
"""Normalize backend explanations with topic-based sections (no Answer/Explanation labels)."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = [
    ROOT / "data" / "explanations" / "be2-python-explanations.json",
    ROOT / "data" / "explanations" / "backend-other-explanations.json",
    ROOT / "data" / "explanations" / "frontend-explanations.json",
]

TRAP_PREFIXES = (
    "Exam trap:",
    "Common trap:",
    "Exam trick:",
    "Exam tip:",
    "Common mistake:",
)


def normalize_dashes(text: str) -> str:
    text = text.replace("\u2014", "; ")
    text = text.replace("\u2013", " to ")
    text = re.sub(r";\s+", "; ", text)
    return text


def normalize_bullets(text: str) -> str:
    text = re.sub(r"- \*\*([A-D])\*\*\s*:\s*", r"- \1: ", text)
    text = re.sub(r"- \*\*([A-D])\*\*\s+", r"- \1: ", text)
    return text


def looks_like_code(inner: str) -> bool:
    return bool(re.search(r'[{[\(=]|def |class |print|import|lambda|#', inner))


def fix_inline_code_quotes(text: str) -> str:
    def repl(match: re.Match[str]) -> str:
        inner = match.group(1)
        if "**" in inner or not looks_like_code(inner):
            return f"`{inner}`"
        return f"`{inner.replace(chr(39), chr(34))}`"

    return re.sub(r"`([^`]+)`", repl, text)


def capitalize_first(text: str) -> str:
    text = text.strip()
    return text[0].upper() + text[1:] if text else text


def split_sentences(text: str) -> list[str]:
    """Split on sentence boundaries without breaking quoted periods like (\"a. and b.\")."""
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z*`\"(])", text.strip())
    return [p.strip() for p in parts if p.strip()]


def format_option_line(sent: str) -> str:
    if sent.startswith("- "):
        return sent
    wrong = re.match(r"^Option ([A-D])\s+is\s+wrong\s+because\s+(.+)$", sent, re.I)
    if wrong:
        return f"- {wrong.group(1)}: {capitalize_first(wrong.group(2))}"
    plain = re.match(r"^Option ([A-D])\s+(.+)$", sent, re.I)
    if plain:
        return f"- {plain.group(1)}: {capitalize_first(plain.group(2))}"
    options_plural = re.match(r"^Options ([A-D].+)$", sent, re.I)
    if options_plural:
        return f"- {options_plural.group(1)}"
    return f"- {sent}"


def peel_trap(text: str) -> tuple[str, str | None]:
    lower = text.lower()
    for prefix in TRAP_PREFIXES:
        idx = lower.find(prefix.lower())
        if idx != -1:
            main = text[:idx].strip().rstrip(".")
            trap = text[idx + len(prefix) :].strip()
            return main, trap
    return text, None


def peel_options(text: str) -> tuple[str, list[str]]:
    sentences = split_sentences(text)
    main: list[str] = []
    options: list[str] = []
    for sent in sentences:
        if re.match(r"^Option[s]? [A-D]\b", sent, re.I):
            options.append(sent)
        elif re.match(r"^- [A-D]:", sent):
            options.append(sent)
        else:
            main.append(sent)
    return " ".join(main), options


def is_code_trace(text: str) -> bool:
    return bool(
        re.search(
            r"(?:print|append|pop|sort|lambda|unpack|slice|\[:|\[7:|step by step|trace the state)",
            text,
            re.I,
        )
    )


def paragraph_chunks(text: str, max_sentences: int = 3) -> str:
    sentences = split_sentences(text)
    if not sentences:
        return text
    chunks: list[str] = []
    for i in range(0, len(sentences), max_sentences):
        chunks.append(" ".join(sentences[i : i + max_sentences]))
    return "\n\n".join(chunks)


def build_output(main: str, options: list[str], trap: str | None) -> str:
    parts: list[str] = []

    if main.strip():
        header = "**Step by step**" if is_code_trace(main) else "**How it works**"
        parts.append(f"{header}\n\n{paragraph_chunks(main)}")

    if options:
        bullets = "\n".join(format_option_line(o) for o in options)
        parts.append(f"**Why the others fail**\n\n{bullets}")

    if trap:
        parts.append(f"**Common mistake**\n\n{capitalize_first(trap)}")

    body = "\n\n".join(parts)
    body = re.sub(r"\n{3,}", "\n\n", body)
    body = re.sub(r"(?<!\n\n)(\*\*[^*\n]+\*\*)", r"\n\n\1", body)
    return body.strip()


def reformat_explanation(text: str) -> str:
    text = normalize_dashes(text)
    text = normalize_bullets(text)
    text = fix_inline_code_quotes(text)

    main, trap = peel_trap(text)
    main, options = peel_options(main)
    return build_output(main, options, trap)


def process_file(path: Path) -> int:
    data = json.loads(path.read_text(encoding="utf-8"))
    changes = 0
    for items in data.values():
        for qid, expl in list(items.items()):
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
