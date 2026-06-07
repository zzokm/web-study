"""
Slide reference syntax and parsing for management exam questions.

Syntax
------
  Slides (slideRef / sourceRefs):  {lectureId}:{slideSpec}
  Textbook (sourceRefs only):        {lectureId},p{pageSpec}

  lectureId   : ch1, ch2, ch3, ch7, ch8, ch11, ch13, ch15, ch18, ch21
  slideSpec   :
    s{N}           single slide (PDF page N, 1-based)
    s{N}-{M}       inclusive range
    s{N},{M}       non-contiguous pages
    s{N}-{M},{P}   combined (e.g. s7-8,24)
    all            entire lecture deck (1..pageCount)
    course         no specific slide; external / course-context only
  pageSpec (book):
    p{N}           printed textbook page (chapter footer number)
    p{N}-{M}       inclusive range
    p{N},{M}       non-contiguous pages

Examples
--------
  ch18:s9
  ch11:s18-19
  ch3:s7,9
  ch3,p52
  ch3,p58
  ch13:course
  ch21:all

Programmatic use
----------------
  from slide_ref import parse_slide_ref, expand_pages, get_lecture_manifest

  pages = expand_pages("ch18:s9")           # -> [9]
  pages = expand_pages("ch13:s36-39")       # -> [36, 37, 38, 39]
  meta = get_lecture_manifest()["ch18"]     # file path, pageCount, etc.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LECTURES_DIR = ROOT / "assets" / "lectures"
MANIFEST_PATH = ROOT / "data" / "manifests" / "lectures.json"
BOOK_MANIFEST_PATH = ROOT / "data" / "manifests" / "book.json"

# Topic substring (after "Chapter N:") -> lecture filename in Lectures/
LECTURE_FILES: dict[int, str] = {
    1: "Chapter 1 - Introduction.pdf",
    2: "Chapter 2  - History and Current Thinking.pdf",
    3: "Chapter 3 - Busniess Ethics.pdf",
    7: "Chapter 7 - Principles of Planning.pdf",
    8: "Chapter 8 - Making Decisions.pdf",
    11: "Chapter 11 - Fundamentals of Organizing.pdf",
    13: "Chapter 13 - Human Resource Management.pdf",
    15: "Chapter 15 - Influencing and Communication.pdf",
    18: "Chapter 18 - Groups and Teams.pdf",
    21: "Chapter 21  - Controlling Fundamentals.pdf",
}

TOPIC_TITLES: dict[int, str] = {
    1: "Introduction",
    2: "History and Current Thinking",
    3: "Business Ethics",
    7: "Principles of Planning",
    8: "Making Decisions",
    11: "Fundamentals of Organizing",
    13: "Human Resource Management",
    15: "Influencing and Communication",
    18: "Groups and Teams",
    21: "Controlling Fundamentals",
}

SLIDE_REF_RE = re.compile(
    r"^ch(\d+):(s[\d,\-]+|all|course)$", re.IGNORECASE
)
BOOK_REF_RE = re.compile(r"^ch(\d+),p([\d,\-]+)$", re.IGNORECASE)

# Slides with empty/unreadable diagrams in the PDF viewer (do not cite or open).
CH7_BLOCKED_SLIDE_PAGES: frozenset[int] = frozenset()


def chapter_from_topic(topic: str | None) -> int | None:
    if not topic:
        return None
    m = re.match(r"Chapter\s+(\d+)\s*:", topic, re.I)
    return int(m.group(1)) if m else None


def lecture_id(chapter: int) -> str:
    return f"ch{chapter}"


def get_page_count(pdf_path: Path) -> int:
    from pypdf import PdfReader

    return len(PdfReader(str(pdf_path)).pages)


def build_manifest() -> dict:
    manifest = {
        "syntax": "ch{N}:s{pages}|all|course — see slide_ref.py docstring",
        "slideEqualsPdfPage": True,
        "lectures": {},
    }
    for ch, filename in sorted(LECTURE_FILES.items()):
        pdf_path = LECTURES_DIR / filename
        if not pdf_path.exists():
            raise FileNotFoundError(f"Lecture PDF missing: {pdf_path}")
        page_count = get_page_count(pdf_path)
        lid = lecture_id(ch)
        manifest["lectures"][lid] = {
            "lectureId": lid,
            "chapterNumber": ch,
            "topic": f"Chapter {ch}: {TOPIC_TITLES[ch]}",
            "lectureFile": filename,
            "pdfPath": f"assets/lectures/{filename}",
            "pageCount": page_count,
        }
    return manifest


def load_manifest() -> dict:
    if MANIFEST_PATH.exists():
        return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    manifest = build_manifest()
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    return manifest


def get_lecture_manifest() -> dict[str, dict]:
    return load_manifest()["lectures"]


def extract_slide_numbers(reference: str) -> list[int]:
    """Pull slide/page numbers from human-readable reference text."""
    if not reference:
        return []
    nums: list[int] = []
    for m in re.finditer(r"(?i)slides?\s+(\d+)\s*(?:[-–—]|to)\s*(\d+)", reference):
        a, b = int(m.group(1)), int(m.group(2))
        nums.extend(range(min(a, b), max(a, b) + 1))
    for m in re.finditer(r"(?i)slide\s+(\d+)", reference):
        nums.append(int(m.group(1)))
    return sorted(set(nums))


def classify_reference_kind(reference: str) -> str:
    r = (reference or "").lower()
    if "not explicitly" in r or "standard hr management principle" in r:
        return "course"
    if "throughout the slides" in r or "throughout the provided" in r:
        return "all"
    if extract_slide_numbers(reference):
        return "slides"
    if "general management" in r or "fundamental management theory" in r:
        return "course"
    return "course"


def compress_pages(pages: list[int]) -> str:
    pages = sorted(set(pages))
    if not pages:
        return ""
    runs: list[tuple[int, int]] = []
    start = end = pages[0]
    for p in pages[1:]:
        if p == end + 1:
            end = p
        else:
            runs.append((start, end))
            start = end = p
    runs.append((start, end))
    segs = [str(a) if a == b else f"{a}-{b}" for a, b in runs]
    return "s" + ",".join(segs)


def build_slide_ref(chapter: int, reference: str, manifest: dict | None = None) -> tuple[str, dict]:
    """Return (slideRef string, slideRefParsed object)."""
    manifest = manifest or load_manifest()
    lid = lecture_id(chapter)
    lec = manifest["lectures"][lid]
    page_count = lec["pageCount"]
    kind = classify_reference_kind(reference)
    pages: list[int] = []

    if kind == "slides":
        pages = extract_slide_numbers(reference)
        if not pages:
            kind = "course"
        else:
            for p in pages:
                if p < 1 or p > page_count:
                    raise ValueError(
                        f"{lid} slide {p} out of range 1..{page_count} for ref: {reference[:80]}"
                    )
            spec = compress_pages(pages)
            slide_ref = f"{lid}:{spec}"
    elif kind == "all":
        pages = list(range(1, page_count + 1))
        slide_ref = f"{lid}:all"
    else:
        slide_ref = f"{lid}:course"

    parsed = {
        "lectureId": lid,
        "chapterNumber": chapter,
        "topic": lec["topic"],
        "lectureFile": lec["lectureFile"],
        "pdfPath": lec["pdfPath"],
        "kind": kind,
        "pages": pages,
        "pageCount": page_count,
        "syntax": slide_ref,
    }
    return slide_ref, parsed


def parse_slide_ref(slide_ref: str, manifest: dict | None = None) -> dict:
    """Parse slideRef string into structured dict (same shape as slideRefParsed)."""
    manifest = manifest or load_manifest()
    m = SLIDE_REF_RE.match(slide_ref.strip())
    if not m:
        raise ValueError(f"Invalid slideRef: {slide_ref}")
    ch = int(m.group(1))
    spec = m.group(2).lower()
    lid = lecture_id(ch)
    lec = manifest["lectures"][lid]
    page_count = lec["pageCount"]

    if spec == "course":
        return {
            "lectureId": lid,
            "chapterNumber": ch,
            "topic": lec["topic"],
            "lectureFile": lec["lectureFile"],
            "pdfPath": lec["pdfPath"],
            "kind": "course",
            "pages": [],
            "pageCount": page_count,
            "syntax": slide_ref,
        }
    if spec == "all":
        return {
            "lectureId": lid,
            "chapterNumber": ch,
            "topic": lec["topic"],
            "lectureFile": lec["lectureFile"],
            "pdfPath": lec["pdfPath"],
            "kind": "all",
            "pages": list(range(1, page_count + 1)),
            "pageCount": page_count,
            "syntax": slide_ref,
        }

    pages = expand_page_spec(spec[1:])  # drop leading 's'
    for p in pages:
        if p < 1 or p > page_count:
            raise ValueError(f"{lid} page {p} out of range 1..{page_count}")
    return {
        "lectureId": lid,
        "chapterNumber": ch,
        "topic": lec["topic"],
        "lectureFile": lec["lectureFile"],
        "pdfPath": lec["pdfPath"],
        "kind": "slides",
        "pages": pages,
        "pageCount": page_count,
        "syntax": slide_ref,
    }


def expand_page_spec(spec: str) -> list[int]:
    """Expand '9' or '18-19' or '7-8,24' to sorted page list."""
    pages: list[int] = []
    for part in spec.split(","):
        part = part.strip()
        if "-" in part:
            a, b = part.split("-", 1)
            pages.extend(range(int(a), int(b) + 1))
        else:
            pages.append(int(part))
    return sorted(set(pages))


def expand_pages(slide_ref: str, manifest: dict | None = None) -> list[int]:
    return parse_slide_ref(slide_ref, manifest)["pages"]


# Cited page numbers in sourceRefs / reference text use chapter-style numbering;
# add this offset to get the global page in the full Certo 12th ed. book PDF.
BOOK_CITATION_TO_GLOBAL_OFFSET = 21


def load_book_manifest() -> dict:
    return json.loads(BOOK_MANIFEST_PATH.read_text(encoding="utf-8"))


def cited_pages_to_global(cited_pages: list[int]) -> list[int]:
    return [p + BOOK_CITATION_TO_GLOBAL_OFFSET for p in cited_pages]


def global_pages_to_pdf_pages(
    chapter: int, global_pages: list[int], book_manifest: dict | None = None
) -> list[int]:
    """Map global book page numbers to 1-based pages in the split chapter PDF."""
    book_manifest = book_manifest or load_book_manifest()
    lid = lecture_id(chapter)
    ch = book_manifest["chapters"][lid]
    start, end = ch["bookPageRange"]
    page_count = ch["pageCount"]
    pdf_pages: list[int] = []
    for g in global_pages:
        if start <= g <= end:
            idx = g - start + 1
            if 1 <= idx <= page_count:
                pdf_pages.append(idx)
    return sorted(set(pdf_pages))


def parse_book_ref(token: str, book_manifest: dict | None = None, lecture_manifest: dict | None = None) -> dict:
    book_manifest = book_manifest or load_book_manifest()
    lecture_manifest = lecture_manifest or get_lecture_manifest()
    m = BOOK_REF_RE.match(token.strip())
    if not m:
        raise ValueError(f"Invalid book ref: {token}")
    ch = int(m.group(1))
    lid = lecture_id(ch)
    ch_meta = book_manifest["chapters"][lid]
    lec = lecture_manifest.get(lid, {})
    cited_pages = expand_page_spec(m.group(2))
    global_pages = cited_pages_to_global(cited_pages)
    pdf_pages = global_pages_to_pdf_pages(ch, global_pages, book_manifest)
    return {
        "lectureId": lid,
        "chapterNumber": ch,
        "topic": ch_meta.get("topic") or lec.get("topic") or f"Chapter {ch}",
        "lectureFile": ch_meta["sourceFile"],
        "pdfPath": f"assets/book/{ch_meta['sourceFile']}",
        "kind": "book",
        "bookPages": cited_pages,
        "pages": pdf_pages,
        "pageCount": ch_meta["pageCount"],
        "syntax": token.strip(),
    }


def parse_source_ref(
    token: str,
    manifest: dict | None = None,
    book_manifest: dict | None = None,
) -> dict:
    token = token.strip()
    manifest = manifest or load_manifest()
    lectures = manifest.get("lectures") or manifest
    if BOOK_REF_RE.match(token):
        return parse_book_ref(token, book_manifest, lectures)
    return parse_slide_ref(token, manifest)


def parse_source_refs(
    tokens: list[str],
    manifest: dict | None = None,
    book_manifest: dict | None = None,
) -> list[dict]:
    return [parse_source_ref(t, manifest, book_manifest) for t in tokens]


def primary_slide_ref_from_sources(source_refs: list[str]) -> str | None:
    for token in source_refs:
        if SLIDE_REF_RE.match(token.strip()):
            return token.strip()
    return None


def enrich_question_sources(
    question: dict,
    manifest: dict | None = None,
    book_manifest: dict | None = None,
) -> dict:
    """Ensure sourceRefs/sourceRefsParsed; keep slideRef as the slides-only ref."""
    manifest = manifest or load_manifest()
    book_manifest = book_manifest or load_book_manifest()
    refs = question.get("sourceRefs")
    if not refs:
        return question
    parsed = parse_source_refs(refs, manifest, book_manifest)
    question["sourceRefsParsed"] = parsed
    slide = primary_slide_ref_from_sources(refs)
    if slide:
        question["slideRef"] = slide
        question["slideRefParsed"] = parse_slide_ref(slide, manifest)
    return question


def resolve_pdf(slide_ref: str, root: Path | None = None) -> tuple[Path, list[int], dict]:
    """
    Resolve slideRef to an on-disk PDF path and 1-based page list.

    Example:
        path, pages, meta = resolve_pdf("ch18:s16")
        # open path in viewer at pages[0]
    """
    root = root or ROOT
    parsed = parse_slide_ref(slide_ref)
    pdf_path = root / parsed["pdfPath"]
    return pdf_path, parsed["pages"], parsed
