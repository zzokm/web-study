"use client";

import type { HubType } from "@/lib/analytics-event-schemas";
import { HubTrackedLink } from "@/components/analytics/hub-tracked-link";
import { PracticeHubCardHeader } from "@/components/practice/practice-hub-card-header";
import { getLectureSlugs, getQuestionsByLectureSlug } from "@/lib/questions";
import { Card } from "@/components/ui/card";

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
            <div className={compact ? "flex flex-col gap-2" : "flex flex-col gap-3"}>
              {trackLectures.map((lec) => {
                const questions = getQuestionsByLectureSlug(lec.slug);
                return (
                  <HubTrackedLink
                    key={lec.slug}
                    href={`${hrefPrefix}${lec.slug}/`}
                    hubType={hubType}
                    label={lec.lecture}
                  >
                    <Card className="transition-colors hover:bg-muted/50">
                      <PracticeHubCardHeader
                        title={lec.lecture}
                        description={`${lec.count} question${
                          lec.count === 1 ? "" : "s"
                        }`}
                        questions={questions}
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
