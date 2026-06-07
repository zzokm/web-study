import { getBookChapterMeta } from "@/lib/questions";
import { getLectureMeta, getLectureSlugs } from "@/lib/questions";

const SITE = "Management Study";

function lectureTitle(slug: string): string | undefined {
  return getLectureSlugs().find((l) => l.slug === slug)?.lecture;
}

function lectureTitleById(lectureId: string): string | undefined {
  return getLectureMeta()[lectureId]?.topic;
}

function bookChapterTitleById(chapterId: string): string | undefined {
  return getBookChapterMeta()[chapterId]?.topic;
}

export type PageTitleSearchParams = Record<string, string | string[] | undefined>;

function param(
  searchParams: PageTitleSearchParams | undefined,
  key: string
): string | undefined {
  const v = searchParams?.[key];
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export type PageTitleOverrides = {
  practiceResultTitle?: string;
};

/** Human-readable page title for GA4 and document.title. */
export function getPageTitle(
  pathname: string,
  searchParams?: PageTitleSearchParams,
  overrides?: PageTitleOverrides
): string {
  const path = pathname.replace(/\/$/, "") || "/";
  const segments = path.split("/").filter(Boolean);

  if (path === "/") return `Home · ${SITE}`;

  if (segments[0] === "by-lecture" && segments[1]) {
    const lecture = lectureTitle(segments[1]);
    return lecture
      ? `Browse · ${lecture} · ${SITE}`
      : `Browse · Lecture · ${SITE}`;
  }
  if (segments[0] === "by-lecture") return `Browse by lecture · ${SITE}`;

  if (segments[0] === "by-exam" && segments[1]) {
    return `Browse · ${segments[1]} Final · ${SITE}`;
  }
  if (segments[0] === "by-exam") return `Browse by exam · ${SITE}`;

  if (segments[0] === "repetitive") return `Repetitive questions · ${SITE}`;
  if (segments[0] === "saved") return `Saved questions · ${SITE}`;
  if (segments[0] === "analysis") return `Exam analysis · ${SITE}`;

  if (segments[0] === "practice") {
    if (segments[1] === "lecture" && segments[2]) {
      const lecture = lectureTitle(segments[2]);
      return lecture
        ? `Practice · ${lecture} · ${SITE}`
        : `Practice · Lecture · ${SITE}`;
    }
    if (segments[1] === "exam" && segments[2]) {
      return `Practice · ${segments[2]} Final · ${SITE}`;
    }
    if (segments[1] === "repetitive") return `Practice · Repetitive · ${SITE}`;
    if (segments[1] === "saved") return `Practice · Saved · ${SITE}`;
    if (segments[1] === "results") {
      return overrides?.practiceResultTitle
        ? `Practice results · ${overrides.practiceResultTitle} · ${SITE}`
        : `Practice results · ${SITE}`;
    }
    return `Practice · ${SITE}`;
  }

  if (segments[0] === "lectures") {
    if (segments[1]) {
      const topic = lectureTitleById(segments[1]);
      const page = param(searchParams, "page");
      const slide = page ? ` (slide ${page})` : "";
      const label = topic ?? segments[1];
      return `Lecture · ${label}${slide} · ${SITE}`;
    }
    return `Lectures · ${SITE}`;
  }

  if (segments[0] === "book") {
    if (segments[1]) {
      const topic = bookChapterTitleById(segments[1]);
      const page = param(searchParams, "page");
      const pageSuffix = page ? ` (page ${page})` : "";
      const label = topic ?? segments[1];
      return `Textbook · ${label}${pageSuffix} · ${SITE}`;
    }
    return `Textbook chapters · ${SITE}`;
  }

  return `${SITE}`;
}

/** For generateMetadata default template. */
export function metadataTitle(pathname: string, searchParams?: PageTitleSearchParams) {
  return getPageTitle(pathname, searchParams);
}
