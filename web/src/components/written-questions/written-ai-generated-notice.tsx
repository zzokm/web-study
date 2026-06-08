import { TriangleAlertIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export function WrittenAiGeneratedNotice({ className }: { className?: string }) {
  return (
    <Alert
      className={cn(
        "w-full border-amber-500/50 bg-amber-500/10 px-4 py-3 text-amber-950 dark:text-amber-50",
        className
      )}
    >
      <TriangleAlertIcon className="text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-950 dark:text-amber-50">
        AI-generated practice questions
      </AlertTitle>
      <AlertDescription className="text-amber-900/90 dark:text-amber-100/90">
        All questions below were generated using AI and are not from real exams
        or official practice materials.
      </AlertDescription>
    </Alert>
  );
}
