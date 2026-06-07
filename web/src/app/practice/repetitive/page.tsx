import type { Metadata } from "next";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { getRepetitiveFileQuestions } from "@/lib/questions";
import { PracticeLauncher } from "@/components/practice/practice-launcher";

export const metadata: Metadata = {
  title: metadataTitle("/practice/repetitive/"),
};

export default function PracticeRepetitivePage() {
  return (
    <PracticeLauncher
      questions={getRepetitiveFileQuestions()}
      title="Repetitive questions — Practice"
      backHref="/repetitive/"
    />
  );
}
