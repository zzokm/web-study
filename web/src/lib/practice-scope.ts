import {
  examYearFromPathname,
  lectureSlugFromPathname,
  practiceReturnHrefFromPathname,
} from "@/lib/analytics-practice";

/** Separator between practice scope and inner storage key (canonical session key). */
export const PRACTICE_SCOPE_SEP = "\u001f";

export type PracticeScopeId =
  | `lecture:${string}`
  | `exam:${string}`
  | "written"
  | "repetitive"
  | "saved"
  | "mock-exam"
  | "practice";

export function scopeStorageKey(scopeId: string, innerKey: string): string {
  return `${scopeId}${PRACTICE_SCOPE_SEP}${innerKey}`;
}

export function scopeIdFromStorageKey(scopedKey: string): string | null {
  const idx = scopedKey.indexOf(PRACTICE_SCOPE_SEP);
  if (idx < 0) return null;
  return scopedKey.slice(0, idx);
}

export function innerKeyFromScopedStorageKey(scopedKey: string): string | null {
  const idx = scopedKey.indexOf(PRACTICE_SCOPE_SEP);
  if (idx < 0) return null;
  return scopedKey.slice(idx + 1);
}

export function practiceScopeIdFromPathname(pathname: string): PracticeScopeId {
  const lecture = lectureSlugFromPathname(pathname);
  if (lecture) return `lecture:${lecture}`;
  const exam = examYearFromPathname(pathname);
  if (exam) return `exam:${exam}`;
  if (pathname.includes("/practice/written")) return "written";
  if (pathname.includes("/practice/repetitive")) return "repetitive";
  if (pathname.includes("/practice/saved")) return "saved";
  if (pathname.includes("/practice/mock-exam")) return "mock-exam";
  return "practice";
}

export function practiceReturnHrefFromScopeId(
  scopeId: PracticeScopeId
): string | null {
  if (scopeId.startsWith("lecture:")) {
    return `/practice/lecture/${scopeId.slice("lecture:".length)}/`;
  }
  if (scopeId.startsWith("exam:")) {
    return `/practice/exam/${scopeId.slice("exam:".length)}/`;
  }
  if (scopeId === "written") return "/practice/written/";
  if (scopeId === "repetitive") return "/practice/repetitive/";
  if (scopeId === "saved") return "/practice/saved/";
  if (scopeId === "mock-exam") return "/practice/mock-exam/";
  return null;
}

export function resultMatchesPracticeScope(
  returnHref: string | undefined,
  scopeId: PracticeScopeId
): boolean {
  if (!returnHref) return false;
  const expected = practiceReturnHrefFromScopeId(scopeId);
  if (!expected) {
    return practiceReturnHrefFromPathname(returnHref) === returnHref;
  }
  const normalized = returnHref.replace(/\/$/, "") + "/";
  return normalized === expected;
}
