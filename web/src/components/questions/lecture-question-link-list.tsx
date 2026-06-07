import Link from "next/link";
import { getLectureSlugs } from "@/lib/questions";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type LectureQuestionLinkListProps = {
  hrefPrefix: "/practice/lecture/" | "/by-lecture/";
  compact?: boolean;
};

export function LectureQuestionLinkList({
  hrefPrefix,
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
              {trackLectures.map((lec) => (
                <Link key={lec.slug} href={`${hrefPrefix}${lec.slug}/`}>
                  <Card className="transition-colors hover:bg-muted/50">
                    <CardHeader className={compact ? "py-4" : undefined}>
                      <CardTitle className={compact ? "text-sm font-medium" : "text-base"}>
                        {lec.lecture}
                      </CardTitle>
                      <CardDescription>
                        {lec.count} question{lec.count === 1 ? "" : "s"}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
