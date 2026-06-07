import type { HubType } from "@/lib/analytics-event-schemas";
import { HubTrackedLink } from "@/components/analytics/hub-tracked-link";
import type { LectureMeta } from "@/types/question";
import { lectureCardBlurb } from "@/lib/lecture-blurb";
import { formatLectureHeading } from "@/lib/lecture-label";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function LectureListCard({
  lecture,
  hubType,
}: {
  lecture: LectureMeta;
  hubType: HubType;
}) {
  const blurb = lectureCardBlurb(lecture);
  const label = formatLectureHeading(lecture);

  return (
    <HubTrackedLink
      href={`/lectures/${lecture.lectureId}/`}
      hubType={hubType}
      label={label}
    >
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader className="gap-1.5 pb-4">
          <CardTitle className="text-base">
            {formatLectureHeading(lecture)}
          </CardTitle>
          {blurb ? (
            <CardDescription className="line-clamp-1 text-xs leading-snug">
              {blurb}
            </CardDescription>
          ) : null}
          <Badge variant="secondary" className="mt-1 w-fit font-normal">
            {lecture.pageCount} slides
          </Badge>
        </CardHeader>
      </Card>
    </HubTrackedLink>
  );
}
