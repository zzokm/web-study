import Link from "next/link";
import type { LectureMeta } from "@/types/question";
import { formatLectureHeading } from "@/lib/lecture-label";
import {
  codeExamplesEntryDescription,
  getCodeExamplesForLecture,
} from "@/lib/code-examples";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileCode2Icon } from "lucide-react";

export function CodeExamplesEntryCard({ lecture }: { lecture: LectureMeta }) {
  const count = getCodeExamplesForLecture(lecture.lectureId).length;
  const href = `/code-examples/${lecture.lectureId}/`;

  return (
    <Link href={href}>
      <Card className="h-full border-primary/30 bg-primary/5 transition-colors hover:bg-primary/10">
        <CardHeader className="gap-1.5 pb-4">
          <div className="flex items-start gap-2">
            <FileCode2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
            <CardTitle className="text-base leading-snug">
              {formatLectureHeading(lecture)} code examples
            </CardTitle>
          </div>
          <CardDescription className="line-clamp-2 text-xs leading-snug">
            {codeExamplesEntryDescription(lecture.topic)}
          </CardDescription>
          <Badge variant="secondary" className="mt-1 w-fit font-normal">
            {count} example{count === 1 ? "" : "s"}
          </Badge>
        </CardHeader>
      </Card>
    </Link>
  );
}
