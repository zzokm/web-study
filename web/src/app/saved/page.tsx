import type { Metadata } from "next";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { SavedPageClient } from "./saved-page-client";

export const metadata: Metadata = {
  title: metadataTitle("/saved/"),
};

export default function SavedPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <SavedPageClient />
    </div>
  );
}
