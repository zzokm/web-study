import type { Question, SlideRefParsed } from "@/types/question";
import { pagesForDisplay, questionSourceRefsParsed } from "@/lib/slide-ref";

export function hasReferencedSlidePreview(parsed: SlideRefParsed): boolean {
  const displayPages = pagesForDisplay(parsed);
  return (
    parsed.kind === "course" ||
    parsed.kind === "all" ||
    ((parsed.kind === "slides" || parsed.kind === "book") &&
      displayPages.length > 0)
  );
}

export function questionHasReferencedSlidePreview(question: Question): boolean {
  if (!question.reference) return false;
  return questionSourceRefsParsed(question).some(hasReferencedSlidePreview);
}
