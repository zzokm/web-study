"use client";

import { useEffect, useRef } from "react";
import {
  CODE_EXAMPLE_CONSOLE_MESSAGE_TYPE,
  type ConsoleLogLevel,
  injectConsoleCapture,
  previewBaseHref,
} from "@/lib/code-example-console-capture";
import { cn } from "@/lib/utils";

export function CodeExampleIframeRunner({
  src,
  title,
  runCount,
  sessionId,
  onConsoleMessage,
  className,
}: {
  src: string;
  title: string;
  runCount: number;
  sessionId: string;
  onConsoleMessage: (level: ConsoleLogLevel, messages: string[]) => void;
  className?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadExample() {
      const response = await fetch(src);
      const html = await response.text();
      if (cancelled) return;

      const currentIframe = iframeRef.current;
      if (!currentIframe) return;

      const prepared = injectConsoleCapture(
        html,
        previewBaseHref(src),
        sessionId
      );

      const doc = currentIframe.contentDocument;
      if (!doc) return;

      doc.open();
      doc.write(prepared);
      doc.close();
    }

    void loadExample();

    return () => {
      cancelled = true;
    };
  }, [runCount, sessionId, src]);

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
