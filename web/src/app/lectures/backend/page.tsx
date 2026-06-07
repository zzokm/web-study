import type { Metadata } from "next";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { getLecturesByTrack } from "@/lib/questions";
import { LectureListCard } from "@/components/lectures/lecture-list-card";

export const metadata: Metadata = {
  title: metadataTitle("/lectures/backend/"),
};

export default function BackendLecturesPage() {
  const lectures = getLecturesByTrack("backend");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Backend lectures</h1>
        <p className="text-muted-foreground">
          Python, Django, HTTP, and server-side web development.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {lectures.map((lec) => (
          <LectureListCard
            key={lec.lectureId}
            lecture={lec}
            hubType="lectures_backend"
          />
        ))}
      </div>
    </div>
  );
}
