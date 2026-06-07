import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { metadataTitle } from "@/lib/analytics-page-titles";
import {
  getLectureSlugs,
  getQuestionsByLectureSlug,
} from "@/lib/questions";
import { PracticeLauncher } from "@/components/practice/practice-launcher";

export function generateStaticParams() {
  return getLectureSlugs().map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: metadataTitle(`/practice/lecture/${slug}/`) };
}

export default async function PracticeLecturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = getLectureSlugs().find((l) => l.slug === slug);
  if (!meta) notFound();

  const questions = getQuestionsByLectureSlug(slug);

  return (
    <PracticeLauncher
      questions={questions}
      title={`${meta.lecture} — Practice`}
      backHref={`/by-lecture/${slug}/`}
    />
  );
}
