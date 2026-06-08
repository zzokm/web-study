import type { Metadata } from "next";
import type { ReactNode } from "react";
import type { LectureMeta } from "@/types/question";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { getLecturesByTrack } from "@/lib/questions";
import { CodeExamplesEntryCard } from "@/components/code-examples/code-examples-entry-card";
import { LectureListCard } from "@/components/lectures/lecture-list-card";

export const metadata: Metadata = {
  title: metadataTitle("/lectures/frontend/"),
};

function lectureById(
  lectures: LectureMeta[],
  lectureId: string
): LectureMeta | undefined {
  return lectures.find((lec) => lec.lectureId === lectureId);
}

function LectureGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

export default function FrontendLecturesPage() {
  const lectures = getLecturesByTrack("frontend");
  const earlyLectures = lectures.filter((lec) => lec.lectureNumber <= 3);
  const fe4 = lectureById(lectures, "fe-4");
  const fe5 = lectureById(lectures, "fe-5");
  const fe6 = lectureById(lectures, "fe-6");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Frontend lectures</h1>
        <p className="text-muted-foreground">
          HTML, CSS, JavaScript, and client-side web technologies.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <LectureGrid>
          {earlyLectures.map((lec) => (
            <LectureListCard
              key={lec.lectureId}
              lecture={lec}
              hubType="lectures_frontend"
            />
          ))}
        </LectureGrid>
      </section>

      {fe4 ? (
        <section className="flex flex-col gap-4">
          <LectureGrid>
            <LectureListCard lecture={fe4} hubType="lectures_frontend" />
            <CodeExamplesEntryCard lecture={fe4} />
          </LectureGrid>
        </section>
      ) : null}

      {fe5 ? (
        <section className="flex flex-col gap-4">
          <LectureGrid>
            <LectureListCard lecture={fe5} hubType="lectures_frontend" />
            <CodeExamplesEntryCard lecture={fe5} />
          </LectureGrid>
        </section>
      ) : null}

      {fe6 ? (
        <section className="flex flex-col gap-4">
          <LectureGrid>
            <LectureListCard lecture={fe6} hubType="lectures_frontend" />
            <CodeExamplesEntryCard lecture={fe6} />
          </LectureGrid>
        </section>
      ) : null}
    </div>
  );
}
