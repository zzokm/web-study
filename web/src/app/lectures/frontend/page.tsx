import type { Metadata } from "next";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { getLecturesByTrack } from "@/lib/questions";
import { LectureListCard } from "@/components/lectures/lecture-list-card";

export const metadata: Metadata = {
  title: metadataTitle("/lectures/frontend/"),
};

export default function FrontendLecturesPage() {
  const lectures = getLecturesByTrack("frontend");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Frontend lectures</h1>
        <p className="text-muted-foreground">
          HTML, CSS, JavaScript, and client-side web technologies.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {lectures.map((lec) => (
          <LectureListCard
            key={lec.lectureId}
            lecture={lec}
            hubType="lectures_frontend"
          />
        ))}
      </div>
    </div>
  );
}
