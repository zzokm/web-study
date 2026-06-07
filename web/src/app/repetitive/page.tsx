import type { Metadata } from "next";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { getRepetitiveFileQuestions, getRepetitiveStats } from "@/lib/questions";

export const metadata: Metadata = {
  title: metadataTitle("/repetitive/"),
};
import { RepetitivePageClient } from "./repetitive-page-client";

export default function RepetitivePage() {
  const questions = getRepetitiveFileQuestions();
  const count = getRepetitiveStats();

  return <RepetitivePageClient questions={questions} count={count} />;
}
