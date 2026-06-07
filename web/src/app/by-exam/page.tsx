import type { Metadata } from "next";
import Link from "next/link";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { getExamYears, getQuestionsByExamYear } from "@/lib/questions";

export const metadata: Metadata = {
  title: metadataTitle("/by-exam/"),
};
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ByExamPage() {
  const years = getExamYears();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">By exam</h1>
        <p className="text-muted-foreground">Questions in original exam order.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {years.map((year) => {
          const count = getQuestionsByExamYear(year).length;
          return (
            <Link key={year} href={`/by-exam/${year}/`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle>{year} Final</CardTitle>
                  <CardDescription>{count} questions</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
