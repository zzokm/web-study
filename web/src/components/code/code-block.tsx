"use client";

import { useEffect, useMemo, useState } from "react";
import type { ThemedToken } from "shiki";
import {
  normalizeCodeIndentation,
  resolveHighlightLanguage,
  type SupportedCodeLanguage,
} from "@/lib/parse-question-content";

type DisplayToken = {
  content: string;
  color?: string;
};
import { cn } from "@/lib/utils";

type CodeBlockProps = {
  code: string;
  language?: string | null;
  compact?: boolean;
  showLanguage?: boolean;
  className?: string;
};

type HighlighterBundle = {
  codeToTokens: (
    code: string,
    options: { lang: string; theme: string }
  ) => ThemedToken[][];
};

let highlighterPromise: Promise<HighlighterBundle> | null = null;

function loadHighlighter(): Promise<HighlighterBundle> {
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
              lang: lang as "javascript" | "html" | "css" | "python" | "json",
              theme,
            })
            .tokens,
      };
    });
  }
  return highlighterPromise;
}

const LANGUAGE_LABELS: Record<SupportedCodeLanguage, string> = {
  javascript: "JavaScript",
  html: "HTML",
  css: "CSS",
  python: "Python",
  json: "JSON",
};

function TokenLine({ tokens }: { tokens: DisplayToken[] }) {
  if (tokens.length === 0) {
    return <span className="code-ide-empty-line">&nbsp;</span>;
  }

  return (
    <>
      {tokens.map((token, index) => (
        <span key={index} style={{ color: token.color }}>
          {token.content}
        </span>
      ))}
    </>
  );
}

export function CodeBlock({
  code,
  language,
  compact = false,
  showLanguage = true,
  className,
}: CodeBlockProps) {
  const normalizedCode = useMemo(
    () => normalizeCodeIndentation(code.replace(/\n$/, "")),
    [code]
  );
  const lines = useMemo(() => normalizedCode.split("\n"), [normalizedCode]);
  const resolvedLanguage = resolveHighlightLanguage(language, code);
  const highlightKey = `${resolvedLanguage}:${normalizedCode}`;
  const [highlightState, setHighlightState] = useState<{
    key: string;
    tokens: ThemedToken[][] | null;
  }>({ key: "", tokens: null });

  useEffect(() => {
    let cancelled = false;

    async function highlight() {
      try {
        const highlighter = await loadHighlighter();
        const tokens = highlighter.codeToTokens(normalizedCode, {
          lang: resolvedLanguage,
          theme: "dark-plus",
        });
        if (!cancelled) {
          setHighlightState({ key: highlightKey, tokens });
        }
      } catch {
        if (!cancelled) {
          setHighlightState({ key: highlightKey, tokens: null });
        }
      }
    }

    void highlight();

    return () => {
      cancelled = true;
    };
  }, [normalizedCode, resolvedLanguage, highlightKey]);

  const tokenLines =
    highlightState.key === highlightKey ? highlightState.tokens : null;

  return (
    <div
      data-compact={compact ? "true" : "false"}
      className={cn(
        "code-ide overflow-hidden rounded-lg border border-[#2d2d2d] bg-[#1e1e1e] shadow-sm",
        className
      )}
    >
      {showLanguage ? (
        <div className="flex items-center justify-between border-b border-[#2d2d2d] bg-[#252526] px-3 py-1.5">
          <span className="text-[11px] font-medium tracking-wide text-[#cccccc]">
            {LANGUAGE_LABELS[resolvedLanguage]}
          </span>
          <span className="text-[10px] text-[#858585]">
            {lines.length} line{lines.length === 1 ? "" : "s"}
          </span>
        </div>
      ) : null}

      <div className="code-ide-scroll">
        {(tokenLines ??
          lines.map((line) => [{ content: line, color: "#d4d4d4" }]))
          .map((rowTokens, index) => (
            <div className="code-ide-row" key={index}>
              <span className="code-ide-ln" aria-hidden>
                {index + 1}
              </span>
              <code className="code-ide-src">
                <TokenLine tokens={rowTokens} />
              </code>
            </div>
          ))}
      </div>
    </div>
  );
}
