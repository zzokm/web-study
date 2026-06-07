import type { PracticeMode } from "@/lib/analytics-events";

export function practiceModeFromPathname(pathname: string): PracticeMode | undefined {
  if (pathname.includes("/practice/lecture/")) return "lecture";
  if (pathname.includes("/practice/exam/")) return "exam";
  if (pathname.includes("/practice/repetitive")) return "repetitive";
  if (pathname.includes("/practice/saved")) return "saved";
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
