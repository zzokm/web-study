"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Document } from "react-pdf";
import type { Question, SlideRefParsed } from "@/types/question";
import { sameOriginAssetPath } from "@/lib/public-origin";
import {
  pageLabelForRef,
  pagesForDisplay,
  pdfUrlForRef,
} from "@/lib/slide-ref";
import { getBookChaptersForViewer } from "@/lib/book-chapters";
import { getLectureMeta } from "@/lib/questions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SlidePreviewLoading } from "./slide-preview-loading";
import { OpenFullLectureLink } from "@/components/questions/reference-slide-links";
import { PDF_DOCUMENT_OPTIONS } from "./pdf-config";
import { FitPdfPage } from "./fit-pdf-page";
import { SlideCardHeader } from "./slide-card-header";
import { cn } from "@/lib/utils";
import "./pdf-config";

const SlideReferenceViewerDialog = dynamic(
  () =>
    import("./slide-reference-viewer-dialog").then(
      (m) => m.SlideReferenceViewerDialog
    ),
  { ssr: false }
);

interface SlidePanelProps {
  slideRefParsed: SlideRefParsed;
  /** For per-slide open links and analytics. */
  question: Question;
  /** Tighter gaps and smaller per-slide headers (practice + browse previews). */
  density?: "default" | "compact";
}

export function SlidePanel({
  slideRefParsed,
  question,
  density = "default",
}: SlidePanelProps) {
  const pages = pagesForDisplay(slideRefParsed);
  const compact = density === "compact";
  const slideListGap = compact
    ? pages.length > 1
      ? "gap-5"
      : "gap-0"
    : pages.length > 1
      ? "gap-10"
      : "gap-0";
  const pdfUrl = sameOriginAssetPath(pdfUrlForRef(slideRefParsed));
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fullscreenPage, setFullscreenPage] = useState<number | null>(null);

  const lectureList = useMemo(
    () =>
      Object.values(getLectureMeta()).sort(
        (a, b) => a.chapterNumber - b.chapterNumber
      ),
    []
  );

  const viewerLectures = useMemo(
    () =>
      slideRefParsed.kind === "book"
        ? getBookChaptersForViewer()
        : lectureList,
    [slideRefParsed.kind, lectureList]
  );

  const viewerRouteBase =
    slideRefParsed.kind === "book" ? ("/book" as const) : ("/lectures" as const);

  if (slideRefParsed.kind === "course") {
    return (
      <Alert>
        <AlertTitle>No specific slides</AlertTitle>
        <AlertDescription>
          This answer is based on course context or general management theory, not a
          specific slide in the lecture deck.
        </AlertDescription>
      </Alert>
    );
  }

  if (slideRefParsed.kind === "all") {
    return (
      <Alert>
        <AlertTitle>Whole lecture reference</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <span>
            Open the full lecture PDF to review all {slideRefParsed.pageCount}{" "}
            slides.
          </span>
          <OpenFullLectureLink question={question} className="w-fit" />
        </AlertDescription>
      </Alert>
    );
  }

  if (pages.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <Document
        file={pdfUrl}
        options={PDF_DOCUMENT_OPTIONS}
        onLoadSuccess={() => {
          setLoadError(null);
          setLoaded(true);
        }}
        onLoadError={(error) =>
          setLoadError(error?.message ?? "PDF.js could not open this file.")
        }
        loading={
          <div className={cn("flex flex-col", slideListGap)}>
            {pages.map((p) => (
              <SlidePreviewLoading key={p} compact={compact} />
            ))}
          </div>
        }
        error={
          <Alert variant="destructive">
            <AlertTitle>Could not load PDF</AlertTitle>
            <AlertDescription className="flex flex-col gap-1">
              <span>{pdfUrl}</span>
              <span className="text-xs opacity-90">
                {loadError ??
                  "Practice slides use PDF.js — check /pdf.worker.min.mjs in the network tab."}
              </span>
            </AlertDescription>
          </Alert>
        }
      >
        {loaded ? (
          <ul className={cn("m-0 flex list-none flex-col p-0", slideListGap)}>
            {pages.map((pageNum) => (
              <li
                key={pageNum}
                className="relative isolate rounded-lg border bg-card shadow-sm"
              >
                <SlideCardHeader
                  topic={slideRefParsed.topic}
                  pageNum={pageNum}
                  pageSuffix={pageLabelForRef(slideRefParsed, pageNum)}
                  compact={compact}
                  onFullscreen={() => setFullscreenPage(pageNum)}
                />
                <FitPdfPage pageNumber={pageNum} compact={compact} />
              </li>
            ))}
          </ul>
        ) : null}
      </Document>

      {fullscreenPage != null ? (
        <SlideReferenceViewerDialog
          open
          onOpenChange={(open) => {
            if (!open) setFullscreenPage(null);
          }}
          lectures={viewerLectures}
          lectureId={slideRefParsed.lectureId}
          pageNumber={fullscreenPage}
          topic={slideRefParsed.topic}
          pageSuffix={pageLabelForRef(slideRefParsed, fullscreenPage)}
          routeBase={viewerRouteBase}
        />
      ) : null}
    </div>
  );
}
