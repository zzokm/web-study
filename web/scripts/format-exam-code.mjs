/** Keep in sync with src/lib/format-exam-code.ts */

import jsBeautify from "js-beautify";

const { html, css, js } = jsBeautify;

const INDENT_SIZE = 4;

function maxLeadingSpaces(code) {
  let max = 0;
  for (const line of String(code).replace(/\r\n/g, "\n").split("\n")) {
    const match = line.match(/^( +)/);
    if (match) max = Math.max(max, match[1].length);
  }
  return max;
}

function hasPythonColonTrap(code) {
  return /:\n\S/.test(String(code).replace(/\r\n/g, "\n"));
}

export function shouldFormatExamCode(code, language) {
  const normalized = String(code).replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const nonEmpty = lines.filter((line) => line.trim());
  if (nonEmpty.length <= 1) return false;

  if (maxLeadingSpaces(normalized) >= INDENT_SIZE) {
    return false;
  }

  if (language === "python") {
    if (hasPythonColonTrap(normalized)) return false;
    return /[{(\[]/.test(normalized) && /\n/.test(normalized);
  }

  if (language === "json") return false;

  if (language === "javascript") {
    const allSemicolonTerminated = nonEmpty.every((line) =>
      /;\s*$/.test(line.trim())
    );
    if (allSemicolonTerminated) return false;
    return /\{/.test(normalized);
  }

  if (language === "html" || language === "css") {
    return true;
  }

  return false;
}

export function formatJavaScriptBlocks(code, indentSize = INDENT_SIZE) {
  const lines = String(code).replace(/\r\n/g, "\n").split("\n");
  let depth = 0;
  const out = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      out.push("");
      continue;
    }

    if (/^[}\])]/.test(trimmed)) {
      depth = Math.max(0, depth - 1);
    }

    out.push(`${" ".repeat(depth * indentSize)}${trimmed}`);

    if (/\{\s*$/.test(trimmed)) {
      depth += 1;
    }
  }

  return out.join("\n");
}

function formatPythonBrackets(code, indentSize = INDENT_SIZE) {
  const lines = String(code).replace(/\r\n/g, "\n").split("\n");
  let depth = 0;
  const out = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      out.push("");
      continue;
    }

    if (/^[}\])]/.test(trimmed)) {
      depth = Math.max(0, depth - 1);
    }

    out.push(`${" ".repeat(depth * indentSize)}${trimmed}`);

    const opens = (trimmed.match(/[{(\[]/g) ?? []).length;
    const closes = (trimmed.match(/[}\])]/g) ?? []).length;
    depth = Math.max(0, depth + opens - closes);
  }

  return out.join("\n");
}

const BEAUTIFY_OPTS = {
  indent_size: INDENT_SIZE,
  indent_char: " ",
  preserve_newlines: true,
  max_preserve_newlines: 2,
  end_with_newline: false,
};

function safeBeautify(input, formatter) {
  try {
    const result = formatter(input, BEAUTIFY_OPTS).replace(/\n+$/, "");
    if (!result.trim()) return input;
    if (result.split("\n").length > input.split("\n").length + 5) {
      return input;
    }
    return result;
  } catch {
    return input;
  }
}

export function formatExamCode(code, language) {
  const input = String(code).replace(/\r\n/g, "\n").replace(/\n+$/, "");

  switch (language) {
    case "javascript": {
      const blocked = formatJavaScriptBlocks(input);
      if (blocked !== input) return blocked;
      return safeBeautify(input, js);
    }
    case "html":
      return safeBeautify(input, html);
    case "css":
      return safeBeautify(input, css);
    case "python":
      return formatPythonBrackets(input);
    default:
      return input;
  }
}
