import type { Metadata } from "next";
import Link from "next/link";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { getLecturesByTrack, getTracks } from "@/lib/questions";
import { LectureListCard } from "@/components/lectures/lecture-list-card";

export const metadata: Metadata = {
  title: metadataTitle("/lectures/"),
};

export default function LecturesPage() {
  const tracks = getTracks();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lecture slides</h1>
        <p className="text-muted-foreground">
          Course materials split into frontend and backend tracks.
        </p>
      </div>

      {Object.values(tracks).map((track) => {
        const lectures = getLecturesByTrack(track.trackId);
        return (
          <section key={track.trackId} className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-medium">{track.label}</h2>
              <p className="text-sm text-muted-foreground">{track.description}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {lectures.map((lec) => (
                <LectureListCard
                  key={lec.lectureId}
                  lecture={lec}
                  hubType={
                    track.trackId === "frontend"
                      ? "lectures_frontend"
                      : "lectures_backend"
                  }
                />
              ))}
            </div>
            <Link
              href={`/lectures/${track.trackId}/`}
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              View all {track.label.toLowerCase()} lectures
            </Link>
          </section>
        );
      })}
    </div>
  );
}
