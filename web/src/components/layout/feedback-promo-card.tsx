import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FEEDBACK_FORM_URL } from "@/lib/site-links";
import { cn } from "@/lib/utils";

export function FeedbackPromoCard() {
  return (
    <Card className="border-primary/25 bg-muted/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold">Is this website useful to you?</CardTitle>
        <CardDescription>
          Please consider leaving feedback — it helps me understand what students need and
          what to improve next.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          A short note on what worked, what felt missing, or what would make studying here
          easier goes a long way toward shaping future updates.
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
