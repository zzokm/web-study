"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { getPageTitle } from "@/lib/analytics-page-titles";
import {
  GA_MEASUREMENT_ID,
  getGaInitConfig,
  isAnalyticsEnabled,
  trackPageView,
} from "@/lib/analytics";
import { loadPracticeResult } from "@/lib/practice-results";

export function GoogleAnalytics() {
  if (!isAnalyticsEnabled() || !GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', ${JSON.stringify(getGaInitConfig())});
        `}
      </Script>
      <GoogleAnalyticsPageViews />
    </>
  );
}

function GoogleAnalyticsPageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchRecord = useMemo(() => {
    const record: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }, [searchParams]);

  const searchString = searchParams.toString();
  const practiceResultTitle = useMemo(() => {
    if (!pathname.startsWith("/practice/results")) return undefined;
    const id = searchParams.get("id");
    if (!id) return undefined;
    return loadPracticeResult(id)?.title;
  }, [pathname, searchParams]);

  useEffect(() => {
    const title = getPageTitle(pathname, searchRecord, { practiceResultTitle });
    trackPageView({
      path: pathname,
      title,
      search: searchString ? `?${searchString}` : "",
    });
  }, [pathname, searchRecord, searchString, practiceResultTitle]);

  return null;
}
