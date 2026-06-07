"use client";

import Link from "next/link";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import type { BreadcrumbSwitcherOption } from "@/lib/breadcrumb-items";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { trackAnalyticsEvent } from "@/lib/analytics";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface BreadcrumbSwitcherProps {
  label: string;
  value: string;
  switcherType: "exam" | "lecture";
  options: BreadcrumbSwitcherOption[];
  className?: string;
}

export function BreadcrumbSwitcher({
  label,
  value,
  switcherType,
  options,
  className,
}: BreadcrumbSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={cn(
              "inline-flex max-w-full min-w-0 items-center gap-1 rounded-md px-1 py-0.5 font-normal text-foreground transition-colors hover:bg-muted/60",
              className
            )}
            aria-label={`${label}, change selection`}
            data-analytics-zone="header"
            data-analytics-id={`breadcrumb_${switcherType}`}
            data-analytics-skip
          />
        }
      >
        <span className="truncate">{label}</span>
        <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 min-w-48">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            render={
              <Link
                href={option.href}
                onClick={() => {
                  if (option.value !== value) {
                    trackAnalyticsEvent(AnalyticsEvents.breadcrumbSwitch, {
                      switcher_type: switcherType,
                      from_value: value,
                      to_value: option.value,
                    });
                  }
                }}
              />
            }
            className="flex items-center justify-between gap-3"
          >
            <span className="truncate">{option.label}</span>
            {option.value === value ? (
              <CheckIcon className="size-3.5 shrink-0 text-foreground" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
