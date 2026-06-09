import { SparklesIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackDecorativeStars } from "@/components/feedback/feedback-decorative-stars";
import { OpenFeedbackButton } from "@/components/feedback/open-feedback-button";
import { cn } from "@/lib/utils";

export function FeedbackPromoCard() {
  return (
    <Card className="relative overflow-hidden border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-background to-primary/5">
      <FeedbackDecorativeStars />
      <CardHeader className="relative z-10 pb-2">
        <div className="mb-2 flex items-center gap-2 text-amber-500">
          <SparklesIcon className="size-4" aria-hidden />
          <span className="text-xs font-semibold tracking-wide uppercase">
            Quick feedback
          </span>
        </div>
        <CardTitle className="text-lg font-bold">Is this website useful to you?</CardTitle>
        <CardDescription>
          Please consider leaving feedback — it helps me understand what students need and
          what to improve next.
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          A short note on what worked, what felt missing, or what would make studying here
          easier goes a long way toward shaping future updates.
        </p>
        <OpenFeedbackButton
          source="home"
          className={cn(buttonVariants({ variant: "default" }), "shrink-0")}
        >
          Share feedback
        </OpenFeedbackButton>
      </CardContent>
    </Card>
  );
}
