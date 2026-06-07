"use client";

import Link from "next/link";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { trackAnalyticsEvent } from "@/lib/analytics";

interface NavTrackedLinkProps {
  href: string;
  navSection: string;
  navLabel: string;
  className?: string;
  children?: React.ReactNode;
}

export function NavTrackedLink({
  href,
  navSection,
  navLabel,
  className,
  children,
}: NavTrackedLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      data-analytics-zone="sidebar"
      data-analytics-id={`nav_${navSection}_${navLabel}`}
      data-analytics-skip
      onClick={() => {
        trackAnalyticsEvent(AnalyticsEvents.navClick, {
          nav_section: navSection,
          nav_label: navLabel,
          nav_href: href,
        });
      }}
    >
      {children}
    </Link>
  );
}
