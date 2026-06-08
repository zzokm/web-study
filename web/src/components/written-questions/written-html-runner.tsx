"use client";

import { useEffect, useRef } from "react";
import {
  CODE_EXAMPLE_CONSOLE_MESSAGE_TYPE,
  type ConsoleLogLevel,
  injectConsoleCapture,
} from "@/lib/code-example-console-capture";
import { cn } from "@/lib/utils";

export function WrittenHtmlRunner({
  html,
  title,
  runCount,
  sessionId,
  onConsoleMessage,
  className,
}: {
  html: string;
  title: string;
  runCount: number;
  sessionId: string;
  onConsoleMessage: (level: ConsoleLogLevel, messages: string[]) => void;
  className?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const currentIframe = iframeRef.current;
    if (!currentIframe || runCount === 0) return;

    const prepared = injectConsoleCapture(html, "", sessionId);
    const doc = currentIframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(prepared);
    doc.close();
  }, [html, runCount, sessionId]);

  useEffect(() => {
    const iframe = iframeRef.current;

    function handleMessage(event: MessageEvent) {
      if (event.source !== iframe?.contentWindow) return;

      const data = event.data as {
        type?: string;
        sessionId?: string;
        level?: ConsoleLogLevel;
        messages?: string[];
      };

      if (
        data?.type !== CODE_EXAMPLE_CONSOLE_MESSAGE_TYPE ||
        data.sessionId !== sessionId ||
        !data.level ||
        !Array.isArray(data.messages)
      ) {
        return;
      }

      onConsoleMessage(data.level, data.messages);
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onConsoleMessage, sessionId]);

  return (
    <iframe
      ref={iframeRef}
      title={title}
      sandbox="allow-scripts allow-same-origin allow-modals"
      className={cn("h-full min-h-64 w-full rounded-md border bg-white", className)}
    />
  );
}
