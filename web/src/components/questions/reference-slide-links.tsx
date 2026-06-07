"use client";

import type { Question } from "@/types/question";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { questionAnalyticsParams, trackEvent } from "@/lib/analytics";
import { LinkButton } from "@/components/ui/link-button";
import { ExternalLinkIcon } from "lucide-react";

interface OpenFullLectureLinkProps {
  question: Question;
  className?: string;
}

export function OpenFullLectureLink({ question, className }: OpenFullLectureLinkProps) {
  const parsed = question.slideRefParsed;
  if (parsed.kind !== "all") return null;

  return (
    <LinkButton
      href={`/lectures/${parsed.lectureId}/`}
      variant="outline"
      size="sm"
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() =>
        trackEvent(AnalyticsEvents.slideLinkClick, {
          ...questionAnalyticsParams(question),
          lecture_id: parsed.lectureId,
          link_type: "full_lecture",
        })
      }
    >
      <ExternalLinkIcon data-icon="inline-start" />
      Open full lecture
    </LinkButton>
  );
}
