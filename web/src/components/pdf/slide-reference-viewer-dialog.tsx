"use client";

import dynamic from "next/dynamic";
import type { LectureMeta } from "@/types/question";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { XIcon } from "lucide-react";
import { SlideChapterHeading } from "./slide-chapter-heading";

const LectureViewerFull = dynamic(
  () => import("./lecture-viewer-full").then((m) => m.LectureViewerFull),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
  }
);

interface SlideReferenceViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lectures: LectureMeta[];
  lectureId: string;
  pageNumber: number;
  topic?: string;
  /** Overrides default "Slide {pageNumber}" in the header. */
  pageSuffix?: string;
  /** Base path for tab navigation (`/lectures` or `/book`). */
  routeBase?: "/lectures" | "/book";
}

export function SlideReferenceViewerDialog({
  open,
  onOpenChange,
  lectures,
  lectureId,
  pageNumber,
  topic,
  pageSuffix,
  routeBase = "/lectures",
}: SlideReferenceViewerDialogProps) {
  const pageIndex = Math.max(0, pageNumber - 1);
  const chapterLabel = topic?.trim() || "Lecture slides";
  const sourceLabel = routeBase === "/book" ? "textbook page" : "slide";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[min(96vh,960px)] w-[min(98vw,1200px)] max-w-[min(98vw,1200px)] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-[min(98vw,1200px)]"
      >
        <header className="flex shrink-0 items-center gap-3 border-b bg-background px-3 py-2.5 sm:px-4">
          <DialogTitle className="min-w-0 flex-1 text-left font-normal">
            <SlideChapterHeading
              topic={topic}
              pageNumber={pageNumber}
              pageSuffix={pageSuffix}
            />
          </DialogTitle>
          <DialogClose
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0"
                aria-label="Close viewer"
              />
            }
          >
            <XIcon className="size-4" />
          </DialogClose>
        </header>

        <DialogDescription className="sr-only">
          Full PDF viewer for {chapterLabel}, {sourceLabel} {pageNumber}
        </DialogDescription>

        {open ? (
          <div className="min-h-0 flex-1 overflow-hidden bg-background">
            <LectureViewerFull
              key={`${routeBase}-${lectureId}-${pageNumber}`}
              lectures={lectures}
              activeLectureId={lectureId}
              pageIndex={pageIndex}
              syncUrl={false}
              routeBase={routeBase}
              height="100%"
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
