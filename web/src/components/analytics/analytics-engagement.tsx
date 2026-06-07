"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { AnalyticsEvents } from "@/lib/analytics-events";
import {
  isAnalyticsEnabled,
  trackAnalyticsEvent,
  truncateText,
} from "@/lib/analytics";

const SCROLL_MILESTONES = [25, 50, 75, 90, 100] as const;

export function AnalyticsEngagement() {
  const pathname = usePathname();
  const firedScroll = useRef<Set<number>>(new Set());
  const lastClickAt = useRef(0);

  useEffect(() => {
    firedScroll.current = new Set();
  }, [pathname]);

  useEffect(() => {
    if (!isAnalyticsEnabled()) return;

    function onScroll() {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const height = doc.scrollHeight - doc.clientHeight;
      if (height <= 0) return;
      const percent = Math.min(100, Math.round((scrollTop / height) * 100));

      for (const milestone of SCROLL_MILESTONES) {
        if (percent >= milestone && !firedScroll.current.has(milestone)) {
          firedScroll.current.add(milestone);
          trackAnalyticsEvent(AnalyticsEvents.scrollDepth, {
            scroll_percent: milestone,
          });
        }
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  useEffect(() => {
    if (!isAnalyticsEnabled()) return;

    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const interactive = target.closest("a, button, [role='button']");
      if (!interactive || !(interactive instanceof HTMLElement)) return;

      if (interactive.closest("[data-analytics-skip]")) return;
      if (interactive.closest("[data-slot='accordion-trigger']")) return;

      const now = Date.now();
      if (now - lastClickAt.current < 300) return;
      lastClickAt.current = now;

      const tag = interactive.tagName.toLowerCase();
      const linkText = truncateText(
        interactive.getAttribute("aria-label") ||
          interactive.textContent ||
          tag
      );
      const linkUrl =
        interactive instanceof HTMLAnchorElement
          ? interactive.href
          : undefined;

      const clickZone =
        interactive
          .closest("[data-analytics-zone]")
          ?.getAttribute("data-analytics-zone") ?? undefined;
      const analyticsId =
        interactive.getAttribute("data-analytics-id") ??
        interactive
          .closest("[data-analytics-id]")
          ?.getAttribute("data-analytics-id") ??
        undefined;

      trackAnalyticsEvent(AnalyticsEvents.uiClick, {
        element_tag: tag,
        link_text: linkText,
        link_url: linkUrl ? truncateText(linkUrl, 200) : undefined,
        click_zone: clickZone,
        analytics_id: analyticsId,
      });
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  return null;
}
