import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { metadataTitle } from "@/lib/analytics-page-titles";
import {
  codeExamplesPageDescription,
  getCodeExamplesForLecture,
  getLecturesWithCodeExamples,
  isCodeExamplesLectureId,
} from "@/lib/code-examples";
import { formatLectureHeading } from "@/lib/lecture-label";
import { getLectureMeta } from "@/lib/questions";
import { CodeExampleCard } from "@/components/code-examples/code-example-card";
import { LinkButton } from "@/components/ui/link-button";

export function generateStaticParams() {
  return getLecturesWithCodeExamples().map((lectureId) => ({ lectureId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lectureId: string }>;
}): Promise<Metadata> {
  const { lectureId } = await params;
  return {
    title: metadataTitle(`/code-examples/${lectureId}/`),
  };
}

export default async function CodeExamplesLecturePage({
  params,
}: {
  params: Promise<{ lectureId: string }>;
}) {
  const { lectureId } = await params;
  if (!isCodeExamplesLectureId(lectureId)) {
    notFound();
  }

  const lecture = getLectureMeta()[lectureId];
  if (!lecture) {
    notFound();
  }

  const examples = getCodeExamplesForLecture(lectureId);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {formatLectureHeading(lecture)} code examples
          </h1>
          <p className="text-muted-foreground">
            {codeExamplesPageDescription(lecture.topic)}
          </p>
        </div>
        <LinkButton href="/lectures/frontend/" variant="outline">
          Back
        </LinkButton>
      </div>

      <div className="flex flex-col gap-5">
        {examples.map((example) => (
          <CodeExampleCard key={example.id} example={example} />
        ))}
      </div>
    </div>
  );
}
