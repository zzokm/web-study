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

export function cleanExamCode(code) {
  if (!code) return "";
  const lines = String(code).replace(/\r\n/g, "\n").split("\n");
  const stripped = lines.map((line) => line.replace(/^\s*\d+\.\s+/, ""));
  return stripped.join("\n").replace(/\n+$/, "").trimStart();
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
