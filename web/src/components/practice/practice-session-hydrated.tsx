"use client";

import dynamic from "next/dynamic";
import type { Question } from "@/types/question";

const PracticeSessionInner = dynamic(
  () => import("./practice-session").then((m) => m.PracticeSession),
  { ssr: false }
);

export function PracticeSessionHydrated(props: {
  questions: Question[];
  title: string;
  lectureSlug?: string;
}) {
  return <PracticeSessionInner {...props} />;
}

