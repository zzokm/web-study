import type { PracticeMode } from "@/lib/analytics-events";

export function practiceModeFromPathname(pathname: string): PracticeMode | undefined {
  if (pathname.includes("/practice/lecture/")) return "lecture";
  if (pathname.includes("/practice/exam/")) return "exam";
  if (pathname.includes("/practice/written")) return "written";
  if (pathname.includes("/practice/repetitive")) return "repetitive";
  if (pathname.includes("/practice/saved")) return "saved";
  if (pathname.includes("/practice/mock-exam")) return "mock_exam";
  return undefined;
}

export function examYearFromPathname(pathname: string): string | undefined {
  const m = pathname.match(/\/practice\/exam\/([^/]+)/);
  return m?.[1];
}

export function lectureSlugFromPathname(pathname: string): string | undefined {
  const m = pathname.match(/\/practice\/lecture\/([^/]+)/);
  return m?.[1];
}

/** Practice launcher URL to return to after viewing results. */
export function practiceReturnHrefFromPathname(pathname: string): string {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path.startsWith("/practice/lecture/") && path !== "/practice/lecture") {
    return `${path}/`;
  }
  if (path.startsWith("/practice/exam/") && path !== "/practice/exam") {
    return `${path}/`;
  }
  if (path === "/practice/written" || path.startsWith("/practice/written/")) {
    return "/practice/written/";
  }
  if (path === "/practice/repetitive" || path.startsWith("/practice/repetitive/")) {
    return "/practice/repetitive/";
  }
  if (path === "/practice/saved" || path.startsWith("/practice/saved/")) {
    return "/practice/saved/";
  }
  if (path === "/practice/mock-exam" || path.startsWith("/practice/mock-exam/")) {
    return "/practice/mock-exam/";
  }
  return "/practice/";
}
