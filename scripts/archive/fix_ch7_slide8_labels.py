"""Redraw Ch.7 slide 8 planning-step labels on top (white, highest z-order)."""

from __future__ import annotations

import shutil
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "assets" / "lectures" / "Chapter 7 - Principles of Planning.pdf"
OUT = ROOT / "assets" / "lectures" / "Chapter 7 - Principles of Planning (labels-fixed).pdf"
CALIBRI = Path(r"C:\Windows\Fonts\calibri.ttf")
SLIDE_INDEX = 7  # slide 8 (1-based)
TITLE_Y_MAX = 120.0


def collect_step_labels(page: fitz.Page) -> list[tuple[str, fitz.Rect, float]]:
    labels: list[tuple[str, fitz.Rect, float]] = []
    for block in page.get_text("dict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            spans = line["spans"]
            text = "".join(s["text"] for s in spans).strip()
            if not text:
                continue
            color = spans[0].get("color")
            if color != 0xFFFFFF:
                continue
            rect = fitz.Rect(line["bbox"])
            if rect.y0 < TITLE_Y_MAX:
                continue
            size = float(spans[0].get("size", 18))
            labels.append((text, rect, size))
    return labels


def main() -> None:
    if not SRC.is_file():
        raise SystemExit(f"Missing source PDF: {SRC}")
    if not CALIBRI.is_file():
        raise SystemExit(f"Missing Calibri font: {CALIBRI}")

    shutil.copy2(SRC, OUT)
    doc = fitz.open(OUT)
    page = doc[SLIDE_INDEX]
    labels = collect_step_labels(page)
    if not labels:
        raise SystemExit("No step labels found on slide 8.")

    for text, rect, size in labels:
        # Draw last in content stream so labels sit above diagram vectors.
        baseline_y = rect.y1 - max(2.0, size * 0.12)
        page.insert_text(
            (rect.x0, baseline_y),
            text,
            fontname="calibri",
            fontfile=str(CALIBRI),
            fontsize=size,
            color=(1, 1, 1),
            render_mode=0,
            overlay=True,
        )

    doc.saveIncr()
    doc.close()
    print(f"Wrote {len(labels)} labels on slide 8 -> {OUT}")


if __name__ == "__main__":
    main()
