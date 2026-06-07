import type { LectureMeta } from "@/types/question";

const CARD_BLURB_MAX = 52;

/** One-line teaser for material list cards. */
export function lectureCardBlurb(lecture: LectureMeta): string | undefined {
  const source = lecture.description?.trim();
  if (!source) return undefined;

  if (source.length <= CARD_BLURB_MAX) return source;

  const truncated = source.slice(0, CARD_BLURB_MAX).trimEnd();
  const lastSpace = truncated.lastIndexOf(" ");
  const cut = lastSpace > 24 ? truncated.slice(0, lastSpace) : truncated;
  return `${cut}…`;
}
