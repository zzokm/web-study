"use client";

import type { LectureMeta } from "@/types/question";
import { formatLectureHeading, formatLectureTag } from "@/lib/lecture-label";
import { getTracks } from "@/lib/questions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InfoIcon } from "lucide-react";

export function LectureInfoDialog({ lecture }: { lecture: LectureMeta }) {
  const topics = lecture.coveredTopics ?? [];
  const trackLabel = getTracks()[lecture.track]?.label ?? lecture.track;
  const hasDetail =
    lecture.description || lecture.extent || topics.length > 0;

  if (!hasDetail) return null;

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 gap-1.5 rounded-full px-3"
            aria-label={`About ${lecture.topic}`}
          />
        }
      >
        <InfoIcon className="size-3.5" />
        <span className="text-xs font-medium">Info</span>
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(85vh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="gap-2 border-b px-4 py-4 pr-12">
          <DialogTitle className="text-base leading-snug">
            {formatLectureHeading(lecture)}
          </DialogTitle>
          {lecture.description ? (
            <DialogDescription className="text-sm leading-relaxed text-foreground/80">
              {lecture.description}
            </DialogDescription>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="secondary" className="font-normal tabular-nums">
              {formatLectureTag(lecture)}
            </Badge>
            <Badge variant="outline" className="font-normal">
              {trackLabel}
            </Badge>
            <Badge variant="outline" className="font-normal">
              {lecture.pageCount} slides
            </Badge>
          </div>
        </DialogHeader>
        <div className="overflow-y-auto px-4 py-4">
          {lecture.extent ? (
            <section className="mb-4">
              <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Extent of coverage
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {lecture.extent}
              </p>
            </section>
          ) : null}
          {topics.length > 0 ? (
            <section>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Topics covered
              </h3>
              <ul className="flex flex-col gap-3">
                {topics.map((topic) => (
                  <li key={topic.title} className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{topic.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {topic.summary}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
