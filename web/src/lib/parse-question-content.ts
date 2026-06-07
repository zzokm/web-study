export const SUPPORTED_CODE_LANGUAGES = [
  "javascript",
  "html",
  "css",
  "python",
  "json",
] as const;

export type SupportedCodeLanguage = (typeof SUPPORTED_CODE_LANGUAGES)[number];

const LANG_ALIASES: Record<string, SupportedCodeLanguage> = {
  javascript: "javascript",
  js: "javascript",
  html: "html",
  htm: "html",
  css: "css",
  python: "python",
  py: "python",
  json: "json",
};

export function normalizeCodeLanguage(
  lang: string | null | undefined
): SupportedCodeLanguage | null {
  if (lang == null || lang === "") return null;
  const key = lang.trim().toLowerCase();
  return LANG_ALIASES[key] ?? null;
}

export function resolveHighlightLanguage(
  lang: string | null | undefined,
  code?: string
): SupportedCodeLanguage {
  return (
    normalizeCodeLanguage(lang) ??
    (code ? inferLanguageFromCode(code) : null) ??
    "javascript"
  );
}

export function cleanExamCode(code: string): string {
  const lines = code.replace(/\r\n/g, "\n").split("\n");
  const stripped = lines.map((line) => line.replace(/^\s*\d+\.\s+/, ""));
  return stripped.join("\n").replace(/\n+$/, "").trimStart();
}

export function inferLanguageFromCode(code: string): SupportedCodeLanguage | null {
  const sample = code.trim().slice(0, 2000);
  if (/<!DOCTYPE\s+html/i.test(sample) || /<html[\s>]/i.test(sample)) {
    return "html";
  }
  if (/^\s*def\s+\w+\s*\(/m.test(sample) || /^\s*import\s+\w+/m.test(sample)) {
    return "python";
  }
  if (
    /^\s*[\w.#\[\]:,>\s{]+\{/m.test(sample) &&
    /[:;{}]/m.test(sample) &&
    !/function|const|let|var|=>/.test(sample)
  ) {
    return "css";
  }
  return "javascript";
}

export function inferLanguageFromPrompt(prompt: string): SupportedCodeLanguage | null {
  if (/python/i.test(prompt)) return "python";
  if (/javascript|js\b/i.test(prompt)) return "javascript";
  if (/html/i.test(prompt)) return "html";
  if (/css/i.test(prompt)) return "css";
  if (/json/i.test(prompt)) return "json";
  return null;
}
