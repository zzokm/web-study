import type { Metadata } from "next";
import { Suspense } from "react";
import { Bricolage_Grotesque } from "next/font/google";
import { AnalyticsEngagement } from "@/components/analytics/analytics-engagement";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/sonner";
import {
  PublicOriginGuard,
  PublicOriginInlineScript,
} from "@/components/layout/public-origin-guard";
import "./globals.css";

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Web Study",
  description: "Web Technology final exam study — questions, lectures, and practice",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolageGrotesque.variable} ${bricolageGrotesque.className} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <PublicOriginInlineScript />
        <Suspense fallback={null}>
          <PublicOriginGuard />
          <GoogleAnalytics />
          <AnalyticsEngagement />
        </Suspense>
        <AppShell>{children}</AppShell>
        <Toaster richColors closeButton position="bottom-center" />
      </body>
    </html>
  );
}
