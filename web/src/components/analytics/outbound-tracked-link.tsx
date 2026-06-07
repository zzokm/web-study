"use client";

import { AnalyticsEvents } from "@/lib/analytics-events";
import { trackAnalyticsEvent } from "@/lib/analytics";

interface OutboundTrackedLinkProps
  extends React.ComponentPropsWithoutRef<"a"> {
  outboundLabel: string;
}

export function OutboundTrackedLink({
  href,
  outboundLabel,
  onClick,
  children,
  ...props
}: OutboundTrackedLinkProps) {
  return (
    <a
      href={href}
      data-analytics-zone="outbound"
      data-analytics-skip
      onClick={(event) => {
        if (href) {
          trackAnalyticsEvent(AnalyticsEvents.outboundClick, {
            outbound_url: href,
            outbound_label: outboundLabel,
          });
        }
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </a>
  );
}
