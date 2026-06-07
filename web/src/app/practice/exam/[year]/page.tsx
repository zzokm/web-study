import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { getExamYears, getQuestionsByExamYear } from "@/lib/questions";
import { PracticeLauncher } from "@/components/practice/practice-launcher";

export function generateStaticParams() {
  return getExamYears().map((year) => ({ year }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year } = await params;
  return { title: metadataTitle(`/practice/exam/${year}/`) };
}

export default async function PracticeExamPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  if (!getExamYears().includes(year)) notFound();

  const questions = getQuestionsByExamYear(year);

  return (
    <PracticeLauncher
      questions={questions}
      title={`${year} Final — Practice`}
      backHref={`/by-exam/${year}/`}
    />
  );
}
