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

const PROMPT_INTRO_RE =
  /\b(in the following|what will|what is|what are|identify the error|consider the following|the output of the following|which of the following|how many|following python|following javascript|following java\s*script|following function|following statement|following code|following css)\b/i;

const TRAILING_PROSE_RES = [
  /^The\s+(output will be|removed item|above|following)/i,
  /^The above (print|statement) will (return|be)/i,
  /^The ".*" will:/i,
  /^The '\.\.\.' will:/i,
  /^The removed item will be\b/i,
];

function splitQuestionLines(questionText) {
  return questionText.replace(/\r\n/g, "\n").split("\n").map((line, index) => {
    if (index === 0) {
      return line.replace(/^\s*\d+\.\s+/, "");
    }
    return line.replace(/^\s*\d+\.\s+/, "");
  });
}

function withQuestionPrefix(questionText, content) {
  if (!content) return content;
  const prefix = questionText.match(/^(\s*\d+\.\s*)/)?.[1];
  if (!prefix || /^\d+\./.test(content)) return content;
  return `${prefix}${content}`;
}

function isTrailingProseLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return TRAILING_PROSE_RES.some((pattern) => pattern.test(trimmed));
}

function looksLikeCode(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/<!DOCTYPE|<html|<head|<body|<script|<style|<\/\w/i.test(trimmed)) {
    return true;
  }
  if (/^\s*[\w#.:\[\]>~+*-]+ *\{/.test(trimmed) && /[:;]/.test(trimmed)) {
    return true;
  }
  if (
    /^(var|let|const|function|print|Print|def|import|class|if|for|while|try|catch|return|async|await|console\.|document\.|delete|eval|new |typeof|yield|car\s*=|y\s*=|x\s*=)\b/i.test(
      trimmed
    )
  ) {
    return true;
  }
  if (/[;{}]$/.test(trimmed)) return true;
  if (/=\s*[\[{("'0-9]|=\s*\w+\s*\(/.test(trimmed)) return true;
  if (/^\s*[}\])],?\s*$/.test(trimmed)) return true;
  if (
    /\w\s*\([^)]*\)/.test(trimmed) &&
    !PROMPT_INTRO_RE.test(trimmed) &&
    !/\?$/.test(trimmed)
  ) {
    return true;
  }
  return false;
}

function isPromptIntroLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (PROMPT_INTRO_RE.test(trimmed)) return true;
  if (/\?$/.test(trimmed)) return true;
  if (/:$/.test(trimmed) && !looksLikeCode(trimmed)) return true;
  if (!looksLikeCode(trimmed) && /^[A-Z]/.test(trimmed) && trimmed.split(/\s+/).length >= 4) {
    return true;
  }
  return false;
}

function findCodeStart(lines) {
  for (let index = 0; index < lines.length; index += 1) {
    if (isPromptIntroLine(lines[index])) continue;
    if (looksLikeCode(lines[index])) return index;
  }
  return -1;
}

export function parseQuestionText(questionText) {
  if (!questionText) return [];

  if (!questionText.includes("\n")) {
    return [{ type: "text", content: questionText }];
  }

  const lines = splitQuestionLines(questionText);

  let end = lines.length;
  while (end > 0 && isTrailingProseLine(lines[end - 1])) {
    end -= 1;
  }

  const trailingLines = lines.slice(end);
  const bodyLines = lines.slice(0, end);

  if (bodyLines.length === 0) {
    return [{ type: "text", content: questionText }];
  }

  const codeStart = findCodeStart(bodyLines);
  if (codeStart === -1) {
    return [{ type: "text", content: questionText }];
  }

  const promptLines = bodyLines.slice(0, codeStart);
  const code = cleanExamCode(bodyLines.slice(codeStart).join("\n"));
  const trailing = trailingLines.join("\n").trim();

  if (!code) {
    return [{ type: "text", content: questionText }];
  }

  const prompt = promptLines.join("\n").trim();
  const inferred =
    inferLanguageFromPrompt(prompt) ??
    inferLanguageFromPrompt(trailing) ??
    inferLanguageFromCode(code) ??
    "javascript";

  const segments = [];

  if (prompt) {
    segments.push({
      type: "text",
      content: withQuestionPrefix(questionText, prompt),
    });
  }

  segments.push({ type: "code", content: code, codeLanguage: inferred });

  if (trailing) {
    segments.push({ type: "text", content: trailing });
  }

  return segments;
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
