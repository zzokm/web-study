/** Chapter 3 (Business Ethics) — slide refs often point at the textbook, not lecture PDFs. */

export const CHAPTER_3_LECTURE_SLUG = "chapter-3-business-ethics";

/** In-site textbook chapter (split PDF, not full book). */
export const CERTO_BOOK_CHAPTER_URL = "/book/ch3/";

export const CERTO_BOOK_LABEL = "Chapter 3 in the textbook (Certo, 12th ed.)";

export function isChapter3Lecture(slug: string | undefined): boolean {
  return slug === CHAPTER_3_LECTURE_SLUG;
}
