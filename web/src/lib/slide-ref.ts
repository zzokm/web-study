import type { Question, SlideRefParsed } from "@/types/question";

const SLIDE_REF_RE = /^ch(\d+):(s[\d,\-]+|all|course)$/i;
const BOOK_REF_RE = /^ch(\d+),p([\d,\-]+)$/i;

/** Cited page in sourceRefs → global page in full Certo PDF (+21). */
export const BOOK_CITATION_TO_GLOBAL_OFFSET = 21;

export function expandPageSpec(spec: string): number[] {
  const pages: number[] = [];
  for (const part of spec.split(",")) {
    const trimmed = part.trim();
    if (trimmed.includes("-")) {
      const [a, b] = trimmed.split("-", 2);
      const start = parseInt(a, 10);
      const end = parseInt(b, 10);
      for (let i = start; i <= end; i++) pages.push(i);
    } else {
      pages.push(parseInt(trimmed, 10));
    }
  }
  return [...new Set(pages)].sort((a, b) => a - b);
}

export function parseSlideRef(
  slideRef: string,
  lectureMeta?: Record<string, { pageCount: number; topic: string; lectureFile: string; pdfPath: string }>
): SlideRefParsed {
  const m = SLIDE_REF_RE.exec(slideRef.trim());
  if (!m) throw new Error(`Invalid slideRef: ${slideRef}`);

  const ch = parseInt(m[1], 10);
  const lid = `ch${ch}`;
  const spec = m[2].toLowerCase();
  const meta = lectureMeta?.[lid];
  const pageCount = meta?.pageCount ?? 1;

  if (spec === "course") {
    return {
      lectureId: lid,
      chapterNumber: ch,
      topic: meta?.topic ?? `Chapter ${ch}`,
      lectureFile: meta?.lectureFile ?? "",
      pdfPath: meta?.pdfPath ?? "",
      kind: "course",
      pages: [],
      pageCount,
      syntax: slideRef,
    };
  }

  if (spec === "all") {
    return {
      lectureId: lid,
      chapterNumber: ch,
      topic: meta?.topic ?? `Chapter ${ch}`,
      lectureFile: meta?.lectureFile ?? "",
      pdfPath: meta?.pdfPath ?? "",
      kind: "all",
      pages: Array.from({ length: pageCount }, (_, i) => i + 1),
      pageCount,
      syntax: slideRef,
    };
  }

  const pages = expandPageSpec(spec.slice(1));
  return {
    lectureId: lid,
    chapterNumber: ch,
    topic: meta?.topic ?? `Chapter ${ch}`,
    lectureFile: meta?.lectureFile ?? "",
    pdfPath: meta?.pdfPath ?? "",
    kind: "slides",
    pages,
    pageCount,
    syntax: slideRef,
  };
}

export function expandPages(slideRef: string): number[] {
  return parseSlideRef(slideRef).pages;
}

export function lecturePdfUrl(lectureId: string): string {
  return `/lectures/${lectureId}.pdf`;
}

export function bookPdfUrl(chapterId: string): string {
  return `/book/${chapterId}.pdf`;
}

export function bookChapterUrl(chapterId: string, page?: number): string {
  const base = `/book/${chapterId}/`;
  return page != null ? `${base}?page=${page}` : base;
}

export function lecturePageUrl(lectureId: string, page: number): string {
  return `/lectures/${lectureId}/?page=${page}`;
}

export function parseBookRef(
  token: string,
  bookMeta?: Record<
    string,
    {
      pageCount: number;
      topic: string;
      sourceFile: string;
      bookPageRange: [number, number];
    }
  >
): SlideRefParsed {
  const m = BOOK_REF_RE.exec(token.trim());
  if (!m) throw new Error(`Invalid book ref: ${token}`);

  const ch = parseInt(m[1], 10);
  const lid = `ch${ch}`;
  const meta = bookMeta?.[lid];
  const citedPages = expandPageSpec(m[2]);
  const globalPages = citedPages.map((p) => p + BOOK_CITATION_TO_GLOBAL_OFFSET);
  const rangeStart = meta?.bookPageRange?.[0] ?? 1;
  const pageCount = meta?.pageCount ?? 1;
  const pdfPages = globalPages
    .map((g) => g - rangeStart + 1)
    .filter((idx) => idx >= 1 && idx <= pageCount);

  return {
    lectureId: lid,
    chapterNumber: ch,
    topic: meta?.topic ?? `Chapter ${ch}`,
    lectureFile: meta?.sourceFile ?? "",
    pdfPath: `assets/book/${meta?.sourceFile ?? ""}`,
    kind: "book",
    bookPages: citedPages,
    pages: [...new Set(pdfPages)].sort((a, b) => a - b),
    pageCount,
    syntax: token.trim(),
  };
}

export function parseSourceRef(
  token: string,
  lectureMeta?: Record<string, { pageCount: number; topic: string; lectureFile: string; pdfPath: string }>,
  bookMeta?: Record<
    string,
    {
      pageCount: number;
      topic: string;
      sourceFile: string;
      bookPageRange: [number, number];
      printedPageStart?: number;
    }
  >
): SlideRefParsed {
  if (BOOK_REF_RE.test(token.trim())) {
    return parseBookRef(token, bookMeta);
  }
  return parseSlideRef(token, lectureMeta);
}

export function questionSourceRefsParsed(question: Question): SlideRefParsed[] {
  if (question.sourceRefsParsed?.length) {
    return question.sourceRefsParsed;
  }
  return [question.slideRefParsed];
}

export function pdfUrlForRef(parsed: SlideRefParsed): string {
  return parsed.kind === "book"
    ? bookPdfUrl(parsed.lectureId)
    : lecturePdfUrl(parsed.lectureId);
}

const BLOCKED_PAGES: Record<string, ReadonlySet<number>> = {};

export function pagesForDisplay(parsed: SlideRefParsed): number[] {
  if (parsed.kind === "course") return [];
  if (parsed.kind === "all") return [];
  if (parsed.kind === "book") return parsed.pages;
  const blocked = BLOCKED_PAGES[parsed.lectureId];
  if (!blocked) return parsed.pages;
  return parsed.pages.filter((p) => !blocked.has(p));
}

export function pageLabelForRef(parsed: SlideRefParsed, pdfPage: number): string {
  if (parsed.kind === "book" && parsed.bookPages?.length) {
    const idx = parsed.pages.indexOf(pdfPage);
    if (idx >= 0) return `Textbook p. ${parsed.bookPages[idx]}`;
  }
  return `Slide ${pdfPage}`;
}

export function slideRefLabel(slideRef: string): string {
  return slideRef;
}
