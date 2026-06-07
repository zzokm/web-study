"use client";

import dynamic from "next/dynamic";
import type { ExamAnalysisData } from "@/lib/exam-analysis";

const ExamAnalysisDashboard = dynamic(
  () =>
    import("@/components/analysis/exam-analysis-dashboard").then(
      (m) => m.ExamAnalysisDashboard
    ),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-muted-foreground">Loading charts…</p>
    ),
  }
);

export function AnalysisPageClient({ data }: { data: ExamAnalysisData }) {
  return <ExamAnalysisDashboard data={data} />;
}
