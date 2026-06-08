"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
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
  /** Stretch to parent height; short files pad with numbered empty lines below the source. */
  fillHeight?: boolean;
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

function CodeIdeRow({
  lineNumber,
  tokens,
}: {
  lineNumber: number;
  tokens: DisplayToken[];
}) {
  return (
    <div className="code-ide-row">
      <span className="code-ide-ln" aria-hidden>
        {lineNumber}
      </span>
      <code className="code-ide-src">
        <TokenLine tokens={tokens} />
      </code>
    </div>
  );
}

function usePadLineCount(
  enabled: boolean,
  scrollRef: RefObject<HTMLDivElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
  lineCount: number
) {
  const [padLineCount, setPadLineCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const scroll = scrollRef.current;
    const content = contentRef.current;
    if (!scroll || !content) return;

    function measure() {
      const scrollEl = scrollRef.current;
      const contentEl = contentRef.current;
      if (!scrollEl || !contentEl) return;

      const styles = getComputedStyle(scrollEl);
      const padTop = Number.parseFloat(styles.paddingTop) || 0;
      const padBottom = Number.parseFloat(styles.paddingBottom) || 0;
      const sampleRow = contentEl.querySelector(".code-ide-row");
      const lineHeight = sampleRow?.getBoundingClientRect().height ?? 20;
      const available = scrollEl.clientHeight - padTop - padBottom;
      const used = contentEl.getBoundingClientRect().height;
      const remaining = available - used;
      const extra = Math.max(0, Math.floor(remaining / lineHeight));
      setPadLineCount(extra);
    }

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(scroll);
    observer.observe(content);

    return () => observer.disconnect();
  }, [enabled, scrollRef, contentRef, lineCount]);

  return enabled ? padLineCount : 0;
}

export function CodeBlock({
  code,
  language,
  compact = false,
  showLanguage = true,
  fillHeight = false,
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

  const displayLines =
    tokenLines ?? lines.map((line) => [{ content: line, color: "#d4d4d4" }]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const padLineCount = usePadLineCount(
    fillHeight,
    scrollRef,
    contentRef,
    displayLines.length
  );

  const codeRows = (
    <>
      <div ref={contentRef}>
        {displayLines.map((rowTokens, index) => (
          <CodeIdeRow
            key={index}
            lineNumber={index + 1}
            tokens={rowTokens}
          />
        ))}
      </div>
      {fillHeight && padLineCount > 0
        ? Array.from({ length: padLineCount }, (_, index) => (
            <CodeIdeRow
              key={`pad-${index}`}
              lineNumber={displayLines.length + index + 1}
              tokens={[]}
            />
          ))
        : null}
    </>
  );

  return (
    <div
      data-compact={compact ? "true" : "false"}
      data-fill-height={fillHeight ? "true" : "false"}
      className={cn(
        "code-ide overflow-hidden rounded-lg border border-[#2d2d2d] bg-[#1e1e1e] shadow-sm",
        fillHeight && "min-h-0",
        className
      )}
    >
      {showLanguage ? (
        <div className="flex shrink-0 items-center justify-between border-b border-[#2d2d2d] bg-[#252526] px-3 py-1.5">
          <span className="text-[11px] font-medium tracking-wide text-[#cccccc]">
            {LANGUAGE_LABELS[resolvedLanguage]}
          </span>
          <span className="text-[10px] text-[#858585]">
            {lines.length} line{lines.length === 1 ? "" : "s"}
          </span>
        </div>
      ) : null}

      {fillHeight ? (
        <div className="code-ide-body">
          <div ref={scrollRef} className="code-ide-scroll">
            {codeRows}
          </div>
        </div>
      ) : (
        <div className="code-ide-scroll">{codeRows}</div>
      )}
    </div>
  );
}
