"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Page, useDocumentContext } from "react-pdf";
import type { PDFDocumentProxy } from "pdfjs-dist";
import {
  fitPageLayoutSize,
  getPdfDevicePixelRatio,
  useFitContainer,
} from "@/hooks/use-fit-container";
import { Spinner } from "@/components/ui/spinner";
import { SlidePreviewLoading } from "./slide-preview-loading";
import { cn } from "@/lib/utils";

const MAX_PREVIEW_HEIGHT = {
  compact: 480,
  default: 600,
} as const;

interface FitPdfPageProps {
  pageNumber: number;
  compact?: boolean;
}

export function FitPdfPage({ pageNumber, compact = false }: FitPdfPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerSize = useFitContainer(containerRef);
  const documentContext = useDocumentContext();
  const pdfCandidate = documentContext?.pdf as
    | PDFDocumentProxy
    | false
    | undefined;
  const pdf =
    pdfCandidate == null || pdfCandidate === false ? null : pdfCandidate;
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(
    null
  );
  const [rendered, setRendered] = useState(false);
  const maxPreviewHeight = compact
    ? MAX_PREVIEW_HEIGHT.compact
    : MAX_PREVIEW_HEIGHT.default;

  useEffect(() => {
    if (!pdf || typeof pdf.getPage !== "function") return;

    let cancelled = false;

    pdf
      .getPage(pageNumber)
      .then((page) => {
        if (cancelled) return;
        setRendered(false);
        const viewport = page.getViewport({ scale: 1 });
        setPageSize({ width: viewport.width, height: viewport.height });
      })
      .catch(() => {
        if (!cancelled) setPageSize(null);
      });

    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber]);

  const layout = useMemo(() => {
    if (!pageSize) return null;

    const containerWidth =
      containerSize.width > 0 ? containerSize.width : 320;

    return fitPageLayoutSize(
      containerWidth,
      pageSize.width,
      pageSize.height,
      maxPreviewHeight,
      0
    );
  }, [containerSize.width, pageSize, maxPreviewHeight]);

  const devicePixelRatio = useMemo(() => getPdfDevicePixelRatio(), []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex w-full min-w-0 items-center justify-center bg-muted/20",
        compact ? "px-3 py-3" : "px-4 py-4"
      )}
    >
      {!layout ? (
        <SlidePreviewLoading compact={compact} className="w-full max-w-full" />
      ) : (
        <div
          className="relative mx-auto shrink-0 overflow-hidden transition-none"
          style={{
            width: layout.width,
            height: layout.height,
          }}
        >
          {!rendered ? (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-[2px]"
              aria-hidden
            >
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          ) : null}
          <div
            className={cn(
              "pdf-slide-fit flex size-full items-center justify-center transition-none",
              !rendered && "invisible"
            )}
          >
            <Page
              pageNumber={pageNumber}
              width={layout.width}
              devicePixelRatio={devicePixelRatio}
              canvasBackground="white"
              renderTextLayer={false}
              renderAnnotationLayer={false}
              loading=""
              onRenderSuccess={() => setRendered(true)}
              onRenderError={() => setRendered(true)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
