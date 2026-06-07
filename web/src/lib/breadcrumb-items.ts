import { formatLectureBadgeLabel } from "@/lib/lecture-label";
import {
  getExamMeta,
  getExamYears,
  getLectureMeta,
  getLectureSlugs,
} from "@/lib/questions";
import type { PageTitleSearchParams } from "@/lib/analytics-page-titles";

export type BreadcrumbSwitcherOption = {
  label: string;
  href: string;
  value: string;
};

export type BreadcrumbItem = {
  label: string;
  href?: string;
  switcher?: {
    value: string;
    options: BreadcrumbSwitcherOption[];
  };
};

function examSwitcherOptions(
  basePath: "/by-exam" | "/practice/exam" | "/exams"
): BreadcrumbSwitcherOption[] {
  return getExamYears().map((year) => ({
    value: year,
    label: examTitleByYear(year) ?? `Final Exam ${year}`,
    href: `${basePath}/${year}/`,
  }));
}

function lectureSwitcherOptions(
  basePath: "/by-lecture" | "/practice/lecture" | "/lectures"
): BreadcrumbSwitcherOption[] {
  return getLectureSlugs().map((entry) => ({
    value: entry.slug,
    label: entry.lecture,
    href: `${basePath}/${entry.slug}/`,
  }));
}

function examBreadcrumbLabel(year: string): string {
  return examTitleByYear(year) ?? `Final Exam ${year}`;
}

function lectureTitle(slug: string): string | undefined {
  return getLectureSlugs().find((entry) => entry.slug === slug)?.lecture;
}

function lectureTitleById(lectureId: string): string | undefined {
  const meta = getLectureMeta()[lectureId];
  return meta ? formatLectureBadgeLabel(meta) : undefined;
}

function examTitleByYear(year: string): string | undefined {
  return getExamMeta()[year]?.title;
}

function param(
  searchParams: PageTitleSearchParams | undefined,
  key: string
): string | undefined {
  const value = searchParams?.[key];
  if (value == null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export function getBreadcrumbItems(
  pathname: string,
  searchParams?: PageTitleSearchParams
): BreadcrumbItem[] {
  const path = pathname.replace(/\/$/, "") || "/";
  const segments = path.split("/").filter(Boolean);

  if (path === "/") {
    return [{ label: "Home" }];
  }

  const items: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

  if (segments[0] === "by-lecture") {
    items.push({ label: "By lecture", href: "/by-lecture/" });
    if (segments[1]) {
      items.push({
        label: lectureTitle(segments[1]) ?? "Lecture",
        switcher: {
          value: segments[1],
          options: lectureSwitcherOptions("/by-lecture"),
        },
      });
    }
    return items;
  }

  if (segments[0] === "by-exam") {
    items.push({ label: "By exam", href: "/by-exam/" });
    if (segments[1]) {
      items.push({
        label: examBreadcrumbLabel(segments[1]),
        switcher: {
          value: segments[1],
          options: examSwitcherOptions("/by-exam"),
        },
      });
    }
    return items;
  }

  if (segments[0] === "repetitive") {
    items.push({ label: "Repetitive" });
    return items;
  }

  if (segments[0] === "saved") {
    items.push({ label: "Saved" });
    return items;
  }

  if (segments[0] === "analysis") {
    items.push({ label: "Exam analysis" });
    return items;
  }

  if (segments[0] === "practice") {
    items.push({ label: "Practice", href: "/practice/" });
    if (segments[1] === "lecture" && segments[2]) {
      items.push({
        label: lectureTitle(segments[2]) ?? "Lecture",
        switcher: {
          value: segments[2],
          options: lectureSwitcherOptions("/practice/lecture"),
        },
      });
      return items;
    }
    if (segments[1] === "exam" && segments[2]) {
      items.push({
        label: examBreadcrumbLabel(segments[2]),
        switcher: {
          value: segments[2],
          options: examSwitcherOptions("/practice/exam"),
        },
      });
      return items;
    }
    if (segments[1] === "repetitive") {
      items.push({ label: "Repetitive" });
      return items;
    }
    if (segments[1] === "saved") {
      items.push({ label: "Saved" });
      return items;
    }
    if (segments[1] === "results") {
      items.push({ label: "Results" });
      return items;
    }
    return items;
  }

  if (segments[0] === "lectures") {
    items.push({ label: "Lectures", href: "/lectures/" });
    if (segments[1] === "frontend") {
      items.push({ label: "Frontend" });
      return items;
    }
    if (segments[1] === "backend") {
      items.push({ label: "Backend" });
      return items;
    }
    if (segments[1]) {
      const page = param(searchParams, "page");
      const label = lectureTitleById(segments[1]) ?? segments[1];
      items.push({
        label: page ? `${label} (slide ${page})` : label,
        switcher: {
          value: segments[1],
          options: lectureSwitcherOptions("/lectures"),
        },
      });
    }
    return items;
  }

  if (segments[0] === "exams") {
    items.push({ label: "Exam files", href: "/exams/" });
    if (segments[1]) {
      const page = param(searchParams, "page");
      const label = examBreadcrumbLabel(segments[1]);
      items.push({
        label: page ? `${label} (page ${page})` : label,
        switcher: {
          value: segments[1],
          options: examSwitcherOptions("/exams"),
        },
      });
    }
    return items;
  }

  return items;
}
