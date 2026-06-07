import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { getExamYears, getQuestionsByExamYear } from "@/lib/questions";
import { LinkButton } from "@/components/ui/link-button";
import { QuestionBrowseAccordion } from "@/components/questions/question-browse-accordion";

export function generateStaticParams() {
  return getExamYears().map((year) => ({ year }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year } = await params;
  return { title: metadataTitle(`/by-exam/${year}/`) };
}

export default async function ExamYearPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  if (!getExamYears().includes(year)) notFound();

  const questions = getQuestionsByExamYear(year);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{year} Final Exam</h1>
          <p className="text-muted-foreground">{questions.length} questions</p>
        </div>
        <LinkButton href={`/practice/exam/${year}/`}>Practice this exam</LinkButton>
      </div>

      <QuestionBrowseAccordion
        questions={questions}
        browseContext="by_exam"
        showQuestionIdBadge
      />
    </div>
  );
}
