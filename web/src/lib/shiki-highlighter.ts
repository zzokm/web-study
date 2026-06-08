import type { ThemedToken } from "shiki";
import type { SupportedCodeLanguage } from "@/lib/parse-question-content";

export type DisplayToken = {
  content: string;
  color?: string;
};

export const LANGUAGE_LABELS: Record<SupportedCodeLanguage, string> = {
  javascript: "JavaScript",
  html: "HTML",
  css: "CSS",
  python: "Python",
  json: "JSON",
};

type HighlighterBundle = {
  codeToTokens: (
    code: string,
    options: { lang: string; theme: string }
  ) => ThemedToken[][];
};

let highlighterPromise: Promise<HighlighterBundle> | null = null;

export function loadHighlighter(): Promise<HighlighterBundle> {
  if (!highlighterPromise) {
    highlighterPromise = import("shiki").then(async ({ createHighlighter }) => {
      const highlighter = await createHighlighter({
        themes: ["dark-plus"],
        langs: ["javascript", "html", "css", "python", "json"],
      });

      return {
        codeToTokens: (source, { lang, theme }) =>
          highlighter
            .codeToTokens(source, {
              lang: lang as SupportedCodeLanguage,
              theme,
            })
            .tokens,
      };
    });
  }
  return highlighterPromise;
}

export function tokensToDisplayLines(
  tokenLines: ThemedToken[][] | null,
  fallbackLines: string[]
): DisplayToken[][] {
  if (tokenLines) return tokenLines;
  return fallbackLines.map((line) => [{ content: line, color: "#d4d4d4" }]);
}
