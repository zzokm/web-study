import type { Metadata } from "next";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { LectureQuestionLinkList } from "@/components/questions/lecture-question-link-list";

export const metadata: Metadata = {
  title: metadataTitle("/by-lecture/"),
};

export default function ByLecturePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">By lecture</h1>
        <p className="text-muted-foreground">
          All exam questions grouped by the lecture they were allocated to.
        </p>
      </div>
      <LectureQuestionLinkList
        hrefPrefix="/by-lecture/"
        hubType="lectures"
      />
    </div>
  );
}
