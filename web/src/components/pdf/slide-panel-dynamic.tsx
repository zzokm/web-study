"use client";

import type { ComponentProps } from "react";
import dynamic from "next/dynamic";
import { SlidePreviewLoading } from "./slide-preview-loading";

const SlidePanelInner = dynamic(
  () => import("./slide-panel").then((m) => m.SlidePanel),
  {
    ssr: false,
    loading: () => <SlidePreviewLoading />,
  }
);

export function SlidePanel(props: ComponentProps<typeof SlidePanelInner>) {
  return <SlidePanelInner {...props} />;
}
