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

const CODE_INDENT_SIZE = 4;

function detectIndentStep(uniqueIndents: number[]): number {
  const blockIndents = uniqueIndents.filter((count) => count >= 2);
  if (blockIndents.includes(4)) return 4;
  if (blockIndents.includes(3)) return 3;
  if (blockIndents.includes(2)) return 2;

  for (const candidate of uniqueIndents) {
    if (uniqueIndents.every((indent) => indent % candidate === 0)) {
      return candidate;
    }
  }

  return blockIndents[0] ?? uniqueIndents[0] ?? CODE_INDENT_SIZE;
}

/** Re-map exam/PDF indentation to 4-space levels (tabs → 4 spaces). */
export function normalizeCodeIndentation(
  code: string,
  indentSize = CODE_INDENT_SIZE
): string {
  const lines = code.replace(/\r\n/g, "\n").split("\n");
  const expanded = lines.map((line) =>
    line.replace(/\t/g, " ".repeat(indentSize))
  );

  const leadingSpaces = expanded.map((line) => {
    const match = line.match(/^( +)/);
    return match ? match[1].length : 0;
  });

  const uniqueIndents = [
    ...new Set(leadingSpaces.filter((count) => count > 0)),
  ].sort((a, b) => a - b);

  if (uniqueIndents.length === 0) {
    return expanded.join("\n");
  }

  const step = detectIndentStep(uniqueIndents);

  return expanded
    .map((line, index) => {
      const content = line.trimStart();
      if (!content) return "";
      const level = Math.round(leadingSpaces[index] / step);
      return `${" ".repeat(level * indentSize)}${content}`;
    })
    .join("\n");
}

/** Strip exam numbering prefix (e.g. `65. `) from displayed question text. */
export function stripLeadingQuestionNumber(text: string): string {
  return text.replace(/^\s*\d+\.\s+/, "");
}

export function cleanExamCode(code: string): string {
  const lines = code.replace(/\r\n/g, "\n").split("\n");
  const stripped = lines.map((line) => line.replace(/^\s*\d+\.\s+/, ""));
  return normalizeCodeIndentation(
    stripped.join("\n").replace(/\n+$/, "").trimStart()
  );
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
