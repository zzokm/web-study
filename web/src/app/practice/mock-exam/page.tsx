import type { Metadata } from "next";
import { Suspense } from "react";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { MockExamLauncher } from "@/components/practice/mock-exam-launcher";

export const metadata: Metadata = {
  title: metadataTitle("/practice/mock-exam/"),
};

export default function MockExamPracticePage() {
  return (
    <Suspense fallback={null}>
      <MockExamLauncher />
    </Suspense>
  );
}
