import type { Metadata } from "next";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { getRepetitiveFileQuestions } from "@/lib/questions";

export const metadata: Metadata = {
  title: metadataTitle("/practice/repetitive/"),
};
import { PracticeSessionHydrated } from "@/components/practice/practice-session-hydrated";

export default function PracticeRepetitivePage() {
  return (
    <PracticeSessionHydrated
      questions={getRepetitiveFileQuestions()}
      title="Repetitive questions — Practice"
    />
  );
}
