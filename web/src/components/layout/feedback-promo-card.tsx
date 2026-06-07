import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FEEDBACK_FORM_URL } from "@/lib/site-links";
import { cn } from "@/lib/utils";

export function FeedbackPromoCard() {
  return (
    <Card className="border-primary/25 bg-muted/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          Good luck on your exam <span aria-hidden="true">❤️</span>
        </CardTitle>
        <CardDescription>
          Thank you for using this site. Your feedback helps improve resources for similar
          future projects.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          If you have a minute, please share how the platform worked for you — ratings, what
          helped most, and any suggestions.
        </p>
        <a
          href={FEEDBACK_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "default" }), "shrink-0")}
        >
          Share feedback
        </a>
      </CardContent>
    </Card>
  );
}
