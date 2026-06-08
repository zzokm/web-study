"""Paths to exam source text files (scripts only — not used by the web app)."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORIGINALS_DIR = ROOT / "data" / "exams" / "originals"


def original_txt_path(year: str | int) -> Path:
    return ORIGINALS_DIR / f"{year}original.txt"


def read_original_txt(year: str | int) -> str:
    """Load source text without ANSWER annotation lines (for parsers/sync)."""
    lines = original_txt_path(year).read_text(encoding="utf-8").splitlines()
    body = [line for line in lines if not line.strip().startswith("ANSWER:")]
    return "\n".join(body) + ("\n" if body else "")
