"use client";

import { MessageSquareIcon } from "lucide-react";
import { OutboundTrackedLink } from "@/components/analytics/outbound-tracked-link";
import {
  FEEDBACK_FORM_TOOLTIP,
  FEEDBACK_FORM_URL,
} from "@/lib/site-links";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SidebarFeedbackPill() {
  return (
    <div className="my-2">
      <Tooltip>
        <TooltipTrigger
          render={
            <OutboundTrackedLink
              href={FEEDBACK_FORM_URL}
              outboundLabel="Feedback"
              target="_blank"
              rel="noopener noreferrer"
              data-analytics-zone="sidebar"
              data-analytics-id="feedback_pill"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background shadow-sm transition-opacity hover:opacity-90"
            />
          }
        >
          <MessageSquareIcon className="size-4 shrink-0" />
          <span>
            Feedback <span aria-hidden="true">⭐</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          {FEEDBACK_FORM_TOOLTIP}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
