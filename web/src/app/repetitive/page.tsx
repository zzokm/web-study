import type { Metadata } from "next";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { getRepetitiveFileQuestions, getRepetitiveStats } from "@/lib/questions";
import { RepetitivePageClient } from "./repetitive-page-client";

export const metadata: Metadata = {
  title: metadataTitle("/repetitive/"),
};

export default function RepetitivePage() {
  const questions = getRepetitiveFileQuestions();
  const count = getRepetitiveStats();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <RepetitivePageClient questions={questions} count={count} />
    </div>
  );
}
