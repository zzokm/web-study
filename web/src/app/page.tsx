import type { Metadata } from "next";
import { metadataTitle } from "@/lib/analytics-page-titles";
import {
  getExamYears,
  getLectureSlugs,
  getStats,
} from "@/lib/questions";

export const metadata: Metadata = {
  title: metadataTitle("/"),
};
import { FeedbackPromoCard } from "@/components/layout/feedback-promo-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";

export default function HomePage() {
  const stats = getStats();
  const years = getExamYears();
  const topics = getLectureSlugs();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Web Study</h1>
        <p className="mt-2 text-muted-foreground">
          Practice finals questions by topic or exam year, review lecture slides,
          and browse original exam papers.
        </p>
      </div>

      <FeedbackPromoCard />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Questions</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{stats.totalQuestions}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lectures</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{stats.lectures}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Exams</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{stats.exams}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Topics</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{topics.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Practice</CardTitle>
            <CardDescription>Question-by-question with instant feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <LinkButton href="/practice/">Start practicing</LinkButton>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Saved questions</CardTitle>
            <CardDescription>Review items you marked for later</CardDescription>
          </CardHeader>
          <CardContent>
            <LinkButton href="/saved/" variant="outline">
              View saved
            </LinkButton>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Browse</h2>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/by-lecture/" variant="outline" size="sm">
            By lecture ({topics.length})
          </LinkButton>
          {years.map((y) => (
            <LinkButton key={y} href={`/by-exam/${y}/`} variant="outline" size="sm">
              {y}
            </LinkButton>
          ))}
          <LinkButton href="/exams/" variant="outline" size="sm">
            Exam PDFs
          </LinkButton>
          <LinkButton href="/lectures/frontend/" variant="outline" size="sm">
            Frontend lectures
          </LinkButton>
          <LinkButton href="/lectures/backend/" variant="outline" size="sm">
            Backend lectures
          </LinkButton>
          <LinkButton href="/analysis/" variant="outline" size="sm">
            Exam analysis
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
