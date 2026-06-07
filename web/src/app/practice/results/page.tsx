import type { Metadata } from "next";
import { Suspense } from "react";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { PracticeResultsPageClient } from "./practice-results-page-client";

export const metadata: Metadata = {
  title: metadataTitle("/practice/results/"),
};

export default function PracticeResultsPage() {
  return (
    <Suspense fallback={null}>
      <PracticeResultsPageClient />
    </Suspense>
  );
}
