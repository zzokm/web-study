import type { LectureMeta } from "@/types/question";

export function lectureTrackLetter(track: string): string {
  if (track === "frontend") return "F";
  if (track === "backend") return "B";
  return track.slice(0, 1).toUpperCase();
}

export function formatLectureTag(
  lecture: Pick<LectureMeta, "track" | "lectureNumber">
): string {
  return `${lectureTrackLetter(lecture.track)}${lecture.lectureNumber}`;
}

export function formatLectureBadgeLabel(
  lecture: Pick<LectureMeta, "track" | "lectureNumber" | "topic">
): string {
  return `${formatLectureTag(lecture)} ${lecture.topic}`;
}

export function formatLectureHeading(
  lecture: Pick<LectureMeta, "track" | "lectureNumber" | "topic">
): string {
  return `${formatLectureTag(lecture)}: ${lecture.topic}`;
}
