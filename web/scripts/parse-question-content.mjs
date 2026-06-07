/** Shared exam code parsing — keep in sync with src/lib/parse-question-content.ts */

export const SUPPORTED_CODE_LANGUAGES = [
  "javascript",
  "html",
  "css",
  "python",
  "json",
];

const LANG_ALIASES = {
  javascript: "javascript",
  js: "javascript",
  html: "html",
  htm: "html",
  css: "css",
  python: "python",
  py: "python",
  json: "json",
};

export function normalizeCodeLanguage(lang) {
  if (lang == null || lang === "") return null;
  const key = String(lang).trim().toLowerCase();
  return LANG_ALIASES[key] ?? (SUPPORTED_CODE_LANGUAGES.includes(key) ? key : null);
}

const CODE_INDENT_SIZE = 4;

function detectIndentStep(uniqueIndents) {
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
export function normalizeCodeIndentation(code, indentSize = CODE_INDENT_SIZE) {
  if (!code) return "";
  const lines = String(code).replace(/\r\n/g, "\n").split("\n");
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

export function cleanExamCode(code) {
  if (!code) return "";
  const lines = String(code).replace(/\r\n/g, "\n").split("\n");
  const stripped = lines.map((line) => line.replace(/^\s*\d+\.\s+/, ""));
  return normalizeCodeIndentation(
    stripped.join("\n").replace(/\n+$/, "").trimStart()
  );
}

export function inferLanguageFromCode(code) {
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

export function inferLanguageFromPrompt(prompt) {
  if (/python/i.test(prompt)) return "python";
  if (/javascript|js\b/i.test(prompt)) return "javascript";
  if (/html/i.test(prompt)) return "html";
  if (/css/i.test(prompt)) return "css";
  if (/json/i.test(prompt)) return "json";
  return null;
}

export function parseQuestionText(questionText) {
  if (!questionText) return [];

  if (!questionText.includes("\n")) {
    return [{ type: "text", content: questionText }];
  }

  const newlineIndex = questionText.indexOf("\n");
  const prompt = questionText.slice(0, newlineIndex).trim();
  const code = cleanExamCode(questionText.slice(newlineIndex + 1));

  if (!code) {
    return [{ type: "text", content: questionText }];
  }

  const inferred =
    inferLanguageFromPrompt(prompt) ?? inferLanguageFromCode(code) ?? "javascript";

  return [
    { type: "text", content: prompt },
    { type: "code", content: code, codeLanguage: inferred },
  ];
}

export function parseBlockContext(context) {
  if (!context) return null;

  const text = context.text?.trim() ? context.text.trim() : null;
  const code = context.code ? cleanExamCode(context.code) : null;
  const codeLanguage =
    normalizeCodeLanguage(context.codeLanguage) ??
    (code ? inferLanguageFromCode(code) : null);

  if (!text && !code) return null;

  return { text, code, codeLanguage };
}

export function normalizeOption(option) {
  const rawCode = option.code?.trim();
  const rawContent = option.content?.trim() ?? "";
  const isCode = option.type === "code" || Boolean(rawCode);

  if (isCode) {
    const content = cleanExamCode(rawCode || rawContent);
    return {
      id: option.id,
      type: "code",
      content,
      codeLanguage:
        normalizeCodeLanguage(option.codeLanguage) ??
        inferLanguageFromCode(content) ??
        "javascript",
    };
  }

  return {
    id: option.id,
    type: "text",
    content: rawContent,
    codeLanguage: null,
  };
}
