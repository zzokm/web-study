import type { Metadata } from "next";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { getWrittenQuestions } from "@/lib/questions";
import { PracticeLauncher } from "@/components/practice/practice-launcher";
import { LinkButton } from "@/components/ui/link-button";

export const metadata: Metadata = {
  title: metadataTitle("/practice/written/"),
};

export default function PracticeWrittenPage() {
  const questions = getWrittenQuestions();

  if (questions.length === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Written questions — Practice
          </h1>
          <p className="text-muted-foreground">
            No written questions are available yet.
          </p>
        </div>
        <LinkButton href="/practice/" variant="outline">
          Back to practice
        </LinkButton>
      </div>
    );
  }

  return (
    <PracticeLauncher
      questions={questions}
      title="Written questions — Practice"
      backHref="/practice/"
    />
  );
}
