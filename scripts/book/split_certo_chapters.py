"""Split Certo 12th ed. PDF into chapter PDFs by book page numbers (1-based, inclusive)."""

import json
from pathlib import Path

from pypdf import PdfReader, PdfWriter

MGMT_ROOT = Path(__file__).resolve().parents[2]
BOOK_DIR = MGMT_ROOT / "assets" / "book"
SOURCE = BOOK_DIR / "Modern Management - Certo book 12th edition.pdf"
MANIFEST_PATH = MGMT_ROOT / "data" / "manifests" / "book.json"

# chapter number -> (first page, last page) in the printed book
CHAPTERS: dict[int, tuple[int, int]] = {
    1: (23, 46),
    2: (47, 70),
    3: (71, 100),
    7: (179, 200),
    8: (201, 222),
    11: (269, 292),
    13: (315, 338),
    15: (365, 388),
    18: (445, 470),
    21: (521, 546),
}

# Answer sheet appended to the end of every chapter PDF
ANSWER_SHEET_PAGE = 577


def extract_chapter(reader: PdfReader, chapter: int, start: int, end: int) -> Path:
    if start < 1 or end > len(reader.pages) or start > end:
        raise ValueError(
            f"Chapter {chapter}: pages {start}-{end} invalid for PDF ({len(reader.pages)} pages)"
        )
    if ANSWER_SHEET_PAGE < 1 or ANSWER_SHEET_PAGE > len(reader.pages):
        raise ValueError(
            f"Answer sheet page {ANSWER_SHEET_PAGE} invalid for PDF ({len(reader.pages)} pages)"
        )

    writer = PdfWriter()
    for page_num in range(start, end + 1):
        writer.add_page(reader.pages[page_num - 1])
    writer.add_page(reader.pages[ANSWER_SHEET_PAGE - 1])

    out_path = BOOK_DIR / f"chapter-{chapter:02d}.pdf"
    with out_path.open("wb") as f:
        writer.write(f)
    return out_path


def write_manifest(page_counts: dict[int, int]) -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    file_by_num = {num: f"chapter-{num:02d}.pdf" for num in CHAPTERS}
    for chapter_num, page_count in page_counts.items():
        chapter_id = f"ch{chapter_num}"
        entry = manifest["chapters"].get(chapter_id)
        if not entry:
            continue
        entry["sourceFile"] = file_by_num[chapter_num]
        entry["pageCount"] = page_count
        entry.pop("webSourceFile", None)
        entry.pop("contentPageCount", None)
    manifest.pop("answerSheetFile", None)
    manifest.pop("answerSheetPage", None)
    MANIFEST_PATH.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    if not SOURCE.is_file():
        raise SystemExit(f"Missing source PDF: {SOURCE}")
    if not MANIFEST_PATH.is_file():
        raise SystemExit(f"Missing manifest: {MANIFEST_PATH}")

    reader = PdfReader(str(SOURCE))
    total = len(reader.pages)
    print(f"Source: {SOURCE.name} ({total} pages)")

    page_counts: dict[int, int] = {}
    for chapter, (start, end) in sorted(CHAPTERS.items()):
        out = extract_chapter(reader, chapter, start, end)
        out_reader = PdfReader(str(out))
        page_counts[chapter] = len(out_reader.pages)
        n = page_counts[chapter]
        print(
            f"  chapter-{chapter:02d}.pdf  pages {start}-{end} + answer p.{ANSWER_SHEET_PAGE}  ({n} pages)"
        )

    write_manifest(page_counts)
    print(f"Updated {MANIFEST_PATH.name}")
    print("Done.")


if __name__ == "__main__":
    main()
