import type { Metadata } from "next";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { buildExamAnalysis } from "@/lib/exam-analysis";

export const metadata: Metadata = {
  title: metadataTitle("/analysis/"),
};
import { AnalysisPageClient } from "./analysis-page-client";

export default function AnalysisPage() {
  const data = buildExamAnalysis();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Exam analysis</h1>
        <p className="text-muted-foreground">
          Patterns, high-yield chapters, and study priorities across all four finals.
        </p>
      </div>
      <AnalysisPageClient data={data} />
    </div>
  );
}
