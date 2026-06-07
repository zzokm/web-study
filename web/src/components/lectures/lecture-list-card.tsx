import Link from "next/link";
import type { LectureMeta } from "@/types/question";
import { lectureCardBlurb } from "@/lib/lecture-blurb";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function LectureListCard({ lecture }: { lecture: LectureMeta }) {
  const blurb = lectureCardBlurb(lecture);

  return (
    <Link href={`/lectures/${lecture.lectureId}/`}>
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader className="gap-1.5 pb-4">
          <CardTitle className="text-base">
            Lec {lecture.lectureNumber}: {lecture.topic}
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
    </Link>
  );
}
