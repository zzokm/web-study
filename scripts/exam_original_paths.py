"""Paths to exam source text files (scripts only — not used by the web app)."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORIGINALS_DIR = ROOT / "data" / "exams" / "originals"


def original_txt_path(year: str | int) -> Path:
    return ORIGINALS_DIR / f"{year}original.txt"


def _strip_annotation_lines(lines: list[str], year: str | int) -> list[str]:
    out: list[str] = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith(("ANSWER:", "EXPLANATION:")):
            continue
        if stripped == "Answer:":
            continue
        out.append(line)

    if str(year) == "2025":
        marker = "Font family to Arial [1 mark]"
        for index, line in enumerate(out):
            if marker in line:
                return out[: index + 1]
    return out


def read_original_txt(year: str | int) -> str:
    """Load source text without ANSWER/EXPLANATION annotation lines (for parsers/sync)."""
    lines = original_txt_path(year).read_text(encoding="utf-8").splitlines()
    body = _strip_annotation_lines(lines, year)
    return "\n".join(body) + ("\n" if body else "")
