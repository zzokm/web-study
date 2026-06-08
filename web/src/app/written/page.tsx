import type { Metadata } from "next";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { countWrittenQuestions, getWrittenQuestions } from "@/lib/questions";
import { WrittenPageClient } from "./written-page-client";

export const metadata: Metadata = {
  title: metadataTitle("/written/"),
};

export default function WrittenPage() {
  const questions = getWrittenQuestions();
  const count = countWrittenQuestions();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <WrittenPageClient questions={questions} count={count} />
    </div>
  );
}
