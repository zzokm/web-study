import type { Metadata } from "next";
import { metadataTitle } from "@/lib/analytics-page-titles";

export const metadata: Metadata = {
  title: metadataTitle("/practice/saved/"),
};

export default function PracticeSavedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
