"use client";

import Link from "next/link";
import type { HubType } from "@/lib/analytics-event-schemas";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { trackAnalyticsEvent } from "@/lib/analytics";

interface HubTrackedLinkProps {
  href: string;
  hubType: HubType;
  label: string;
  className?: string;
  children: React.ReactNode;
}

export function HubTrackedLink({
  href,
  hubType,
  label,
  className,
  children,
}: HubTrackedLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      data-analytics-id={`hub_${hubType}`}
      data-analytics-zone="hub"
      data-analytics-skip
      onClick={() => {
        trackAnalyticsEvent(AnalyticsEvents.hubCardClick, {
          hub_type: hubType,
          target_href: href,
          target_label: label,
        });
      }}
    >
      {children}
    </Link>
  );
}
