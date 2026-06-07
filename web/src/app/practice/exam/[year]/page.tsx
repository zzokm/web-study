import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { getExamYears, getQuestionsByExamYear } from "@/lib/questions";
import { PracticeSessionHydrated } from "@/components/practice/practice-session-hydrated";

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
    <PracticeSessionHydrated questions={questions} title={`${year} Final — Practice`} />
  );
}
