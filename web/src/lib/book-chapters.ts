import type { BookChapterMeta, LectureMeta } from "@/types/question";
import {
  getBookChapterIdList,
  getBookChapterMeta,
  getBookTitle,
} from "@/lib/questions";

export { getBookChapterIdList, getBookChapterMeta, getBookTitle };

/** Map book chapter meta to lecture viewer shape (shared EmbedPDF tabs). */
export function bookChapterAsLectureMeta(ch: BookChapterMeta): LectureMeta {
  return {
    lectureId: ch.chapterId,
    chapterNumber: ch.chapterNumber,
    topic: ch.topic,
    lectureFile: ch.sourceFile,
    pdfPath: `assets/book/${ch.sourceFile}`,
    pageCount: ch.pageCount,
    publicPdfUrl: ch.publicPdfUrl,
  };
}

export function getBookChaptersForViewer(): LectureMeta[] {
  const meta = getBookChapterMeta();
  return getBookChapterIdList().map((id) => bookChapterAsLectureMeta(meta[id]));
}
