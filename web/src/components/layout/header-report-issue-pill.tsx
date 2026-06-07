"use client";

import { FlagIcon } from "lucide-react";
import { useReportIssue } from "@/components/report/report-issue-context";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function HeaderReportIssuePill() {
  const { openReportIssue } = useReportIssue();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openReportIssue()}
            data-analytics-zone="header"
            data-analytics-id="report_issue_pill"
            className="h-6 shrink-0 gap-1 rounded-full border-red-500/25 bg-red-500/8 px-2 text-[10px] font-medium text-red-800 shadow-sm transition-colors hover:border-red-500/35 hover:bg-red-500/12 dark:text-red-300"
            aria-label="Report an issue"
          />
        }
      >
        <FlagIcon className="size-2.5 shrink-0" />
        <span className="hidden md:inline">Report issue</span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs md:hidden">
        Report an issue
      </TooltipContent>
    </Tooltip>
  );
}
