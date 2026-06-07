"use client";

import type { Question } from "@/types/question";
import type { IssueType } from "@/lib/report-issue";
import { Button } from "@/components/ui/button";
import { FlagIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReportIssue } from "@/components/report/report-issue-context";

interface ReportIssueButtonProps {
  question?: Question;
  issueType?: IssueType;
  pageUrl?: string;
  size?: "sm" | "icon";
  corner?: boolean;
  className?: string;
}

export function ReportIssueButton({
  question,
  issueType,
  pageUrl,
  size = "sm",
  corner = false,
  className,
}: ReportIssueButtonProps) {
  const { openReportIssue } = useReportIssue();

  function handleClick() {
    openReportIssue({ question, issueType, pageUrl });
  }

  if (size === "icon") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn("text-muted-foreground hover:text-foreground", className)}
        onClick={handleClick}
        aria-label="Report issue"
      >
        <FlagIcon className="size-4" />
      </Button>
    );
  }

  if (corner) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "h-auto gap-1.5 px-2 py-1.5 text-muted-foreground hover:text-foreground",
          className
        )}
        onClick={handleClick}
        aria-label="Report issue"
      >
        <span className="text-xs font-medium">Report</span>
        <FlagIcon className="size-4 shrink-0" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("gap-1.5", className)}
      onClick={handleClick}
    >
      <FlagIcon className="size-3.5" />
      Report issue
    </Button>
  );
}
