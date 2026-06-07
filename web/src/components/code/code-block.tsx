"use client";

import { useEffect, useMemo, useState } from "react";
import {
  resolveHighlightLanguage,
  type SupportedCodeLanguage,
} from "@/lib/parse-question-content";
import { cn } from "@/lib/utils";

type CodeBlockProps = {
  code: string;
  language?: string | null;
  compact?: boolean;
  showLanguage?: boolean;
  className?: string;
};

type HighlighterBundle = {
  codeToHtml: (
    code: string,
    options: { lang: string; theme: string }
  ) => Promise<string>;
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
        codeToHtml: (code, { lang, theme }) =>
          Promise.resolve(
            highlighter.codeToHtml(code, {
              lang,
              theme,
            })
          ),
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

export function CodeBlock({
  code,
  language,
  compact = false,
  showLanguage = true,
  className,
}: CodeBlockProps) {
  const lines = useMemo(() => code.replace(/\n$/, "").split("\n"), [code]);
  const resolvedLanguage = resolveHighlightLanguage(language, code);
  const highlightKey = `${resolvedLanguage}:${code}`;
  const [highlightState, setHighlightState] = useState<{
    key: string;
    html: string | null;
  }>({ key: "", html: null });

  useEffect(() => {
    let cancelled = false;

    async function highlight() {
      try {
        const highlighter = await loadHighlighter();
        const highlighted = await highlighter.codeToHtml(code, {
          lang: resolvedLanguage,
          theme: "dark-plus",
        });
        if (!cancelled) {
          setHighlightState({ key: highlightKey, html: highlighted });
        }
      } catch {
        if (!cancelled) {
          setHighlightState({ key: highlightKey, html: null });
        }
      }
    }

    void highlight();

    return () => {
      cancelled = true;
    };
  }, [code, resolvedLanguage, highlightKey]);

  const html =
    highlightState.key === highlightKey ? highlightState.html : null;

  return (
    <div
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

      <div className="flex min-w-0">
        <div
          className={cn(
            "select-none shrink-0 border-r border-[#2d2d2d] bg-[#1e1e1e] text-right text-[#858585]",
            compact ? "px-2 py-2 text-[11px] leading-5" : "px-3 py-3 text-xs leading-6"
          )}
          aria-hidden
        >
          {lines.map((_, index) => (
            <div key={index}>{index + 1}</div>
          ))}
        </div>

        <div
          className={cn(
            "min-w-0 flex-1 overflow-x-auto",
            compact ? "py-2 pr-3 text-[11px] leading-5" : "py-3 pr-4 text-[13px] leading-6"
          )}
        >
          {html ? (
            <div
              className="code-ide-highlight"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <pre className="m-0 whitespace-pre font-mono text-[#d4d4d4]">{code}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
