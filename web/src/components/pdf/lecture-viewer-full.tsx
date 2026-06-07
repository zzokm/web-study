"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  PDFViewer,
  type PDFViewerRef,
  type PluginRegistry,
} from "@embedpdf/react-pdf-viewer";
import type { LectureMeta } from "@/types/question";
import type { PdfViewerType } from "@/lib/analytics-event-schemas";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { formatLectureHeading } from "@/lib/lecture-label";
import { pdfDocumentUrl, pdfiumWasmUrl } from "@/lib/pdf-assets";
import {
  customizeLectureViewerUi,
  LECTURE_VIEWER_DISABLED_CATEGORIES,
} from "./lecture-pdf-config";

const LECTURE_VIEWER_HEIGHT = "min(80vh, 900px)";
const PAGE_TRACK_DEBOUNCE_MS = 300;

type ScrollCapability = {
  onLayoutReady: (
    handler: (event: {
      documentId: string;
      isInitial: boolean;
      pageNumber: number;
      totalPages: number;
    }) => void
  ) => void;
  forDocument: (documentId: string) => {
    scrollToPage: (options: {
      pageNumber: number;
      behavior?: ScrollBehavior;
    }) => void;
  };
};

type DocumentManagerCapability = {
  setActiveDocument: (documentId: string) => void;
  onActiveDocumentChanged: EventHook<{
    previousDocumentId: string | null;
    currentDocumentId: string | null;
  }>;
};

type EventHook<T> = (handler: (event: T) => void) => void;

function getScroll(registry: PluginRegistry): ScrollCapability | null {
  const scrollPlugin = registry.getPlugin("scroll") as {
    provides: () => ScrollCapability;
  } | null;
  return scrollPlugin?.provides() ?? null;
}

function getDocumentManager(registry: PluginRegistry): DocumentManagerCapability | null {
  const plugin = registry.getPlugin("document-manager") as {
    provides: () => DocumentManagerCapability;
  } | null;
  return plugin?.provides() ?? null;
}

function scrollActiveDocToPage(
  registry: PluginRegistry,
  documentId: string,
  pageNumber: number
): void {
  const scroll = getScroll(registry);
  if (!scroll) return;

  scroll.onLayoutReady((event) => {
    if (event.documentId !== documentId) return;
    scroll.forDocument(documentId).scrollToPage({
      pageNumber,
      behavior: "instant",
    });
  });
}

function activateDocument(registry: PluginRegistry, documentId: string): void {
  getDocumentManager(registry)?.setActiveDocument(documentId);
}

/**
 * Full PDF viewer (EmbedPDF) with document tabs for lectures and textbook chapters.
 */
export function LectureViewerFull({
  lectures,
  activeLectureId,
  pageIndex,
  syncUrl = true,
  routeBase = "/lectures",
  height = LECTURE_VIEWER_HEIGHT,
}: {
  lectures: LectureMeta[];
  activeLectureId: string;
  pageIndex: number;
  /** When false, tab changes do not navigate (e.g. practice fullscreen modal). */
  syncUrl?: boolean;
  /** Base path for tab navigation, e.g. `/lectures` or `/book`. */
  routeBase?: string;
  height?: string;
}) {
  const router = useRouter();
  const viewerRef = useRef<PDFViewerRef>(null);
  const registryRef = useRef<PluginRegistry | null>(null);
  const syncingFromViewerRef = useRef(false);
  const lastTrackedPageRef = useRef<string | null>(null);
  const pageDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageNumber = pageIndex + 1;

  const viewerType: PdfViewerType = routeBase === "/exams" ? "exam" : "lecture";
  const lectureById = useMemo(
    () => new Map(lectures.map((lec) => [lec.lectureId, lec])),
    [lectures]
  );

  const trackPdfPage = useCallback(
    (
      documentId: string,
      page: number,
      source: "url" | "viewer_scroll",
      totalPages?: number
    ) => {
      const meta = lectureById.get(documentId);
      if (!meta) return;
      const trackKey = `${documentId}:${page}:${source}`;
      if (lastTrackedPageRef.current === trackKey) return;
      lastTrackedPageRef.current = trackKey;

      trackAnalyticsEvent(AnalyticsEvents.pdfPageView, {
        viewer_type: viewerType,
        document_id: documentId,
        page_number: page,
        page_count: totalPages ?? meta.pageCount,
        topic: meta.topic,
        source,
      });
    },
    [lectureById, viewerType]
  );

  const scheduleViewerPageTrack = useCallback(
    (documentId: string, page: number, totalPages: number) => {
      if (pageDebounceRef.current) clearTimeout(pageDebounceRef.current);
      pageDebounceRef.current = setTimeout(() => {
        trackPdfPage(documentId, page, "viewer_scroll", totalPages);
      }, PAGE_TRACK_DEBOUNCE_MS);
    },
    [trackPdfPage]
  );

  const initialDocuments = useMemo(
    () =>
      lectures.map((lec) => ({
        url: pdfDocumentUrl(lec.publicPdfUrl),
        documentId: lec.lectureId,
        name: formatLectureHeading(lec),
        autoActivate: lec.lectureId === activeLectureId,
      })),
    // PDFViewer reads config only on mount; activation is synced in onReady/useEffect.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- activeLectureId intentionally omitted
    [lectures]
  );

  const viewerConfig = useMemo(
    () => ({
      wasmUrl: pdfiumWasmUrl(),
      theme: { preference: "dark" as const },
      tabBar: "always" as const,
      disabledCategories: LECTURE_VIEWER_DISABLED_CATEGORIES,
      documentManager: { initialDocuments },
    }),
    [initialDocuments]
  );

  const syncRouteToDocument = useCallback(
    (documentId: string) => {
      if (!syncUrl || documentId === activeLectureId) return;
      syncingFromViewerRef.current = true;
      router.push(`${routeBase}/${documentId}/?page=1`);
    },
    [activeLectureId, routeBase, router, syncUrl]
  );

  const handleReady = useCallback(
    (registry: PluginRegistry) => {
      registryRef.current = registry;
      queueMicrotask(() => {
        try {
          customizeLectureViewerUi(registry);
        } catch {
          /* UI schema may not be ready; viewer still works */
        }
        activateDocument(registry, activeLectureId);
        scrollActiveDocToPage(registry, activeLectureId, pageNumber);
      });

      const scroll = getScroll(registry);
      scroll?.onLayoutReady((event) => {
        if (!event.documentId) return;
        scheduleViewerPageTrack(
          event.documentId,
          event.pageNumber,
          event.totalPages
        );
      });

      if (syncUrl) {
        const dm = getDocumentManager(registry);
        dm?.onActiveDocumentChanged((event) => {
          if (syncingFromViewerRef.current) {
            syncingFromViewerRef.current = false;
            return;
          }
          if (
            event.previousDocumentId &&
            event.currentDocumentId &&
            event.previousDocumentId !== event.currentDocumentId
          ) {
            trackAnalyticsEvent(AnalyticsEvents.pdfDocumentSwitch, {
              viewer_type: viewerType,
              from_document_id: event.previousDocumentId,
              to_document_id: event.currentDocumentId,
            });
          }
          if (event.currentDocumentId) {
            syncRouteToDocument(event.currentDocumentId);
          }
        });
      }
    },
    [
      activeLectureId,
      pageNumber,
      scheduleViewerPageTrack,
      syncRouteToDocument,
      syncUrl,
      viewerType,
    ]
  );

  useEffect(() => {
    const registry = registryRef.current;
    if (!registry) return;
    activateDocument(registry, activeLectureId);
    scrollActiveDocToPage(registry, activeLectureId, pageNumber);
  }, [activeLectureId, pageNumber]);

  useEffect(() => {
    return () => {
      if (pageDebounceRef.current) clearTimeout(pageDebounceRef.current);
    };
  }, []);

  return (
    <PDFViewer
      ref={viewerRef}
      className="lecture-pdf-viewer-inner w-full"
      style={{ height, width: "100%" }}
      config={viewerConfig}
      onReady={handleReady}
    />
  );
}
