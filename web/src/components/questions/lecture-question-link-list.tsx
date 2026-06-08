"use client";

import type { HubType } from "@/lib/analytics-event-schemas";
import { HubTrackedLink } from "@/components/analytics/hub-tracked-link";
import { PracticeHubCardHeader } from "@/components/practice/practice-hub-card-header";
import { getLectureSlugs, getQuestionsByLectureSlug } from "@/lib/questions";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type LectureQuestionLinkListProps = {
  hrefPrefix: "/practice/lecture/" | "/by-lecture/";
  hubType: HubType;
  compact?: boolean;
};

export function LectureQuestionLinkList({
  hrefPrefix,
  hubType,
  compact = false,
}: LectureQuestionLinkListProps) {
  const lectures = getLectureSlugs();
  const trackOrder = [...new Set(lectures.map((lec) => lec.track))];

  return (
    <div className="flex flex-col gap-6">
      {trackOrder.map((trackId) => {
        const trackLectures = lectures.filter((lec) => lec.track === trackId);
        if (!trackLectures.length) return null;

        return (
          <div key={trackId}>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              {trackLectures[0]?.trackLabel ?? trackId}
            </h2>
            <div
              className={cn(
                "grid sm:grid-cols-2",
                compact ? "gap-2" : "gap-3"
              )}
            >
              {trackLectures.map((lec) => {
                const questions = getQuestionsByLectureSlug(lec.slug);
                return (
                  <HubTrackedLink
                    key={lec.slug}
                    href={`${hrefPrefix}${lec.slug}/`}
                    hubType={hubType}
                    label={lec.lecture}
                    className="block h-full"
                  >
                    <Card className="h-full transition-colors hover:bg-muted/50">
                      <PracticeHubCardHeader
                        title={lec.lecture}
                        description={`${lec.count} question${
                          lec.count === 1 ? "" : "s"
                        }`}
                        questions={questions}
                        scopeId={`lecture:${lec.slug}`}
                        compact={compact}
                      />
                    </Card>
                  </HubTrackedLink>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
