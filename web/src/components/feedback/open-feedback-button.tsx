"use client";

import type { ComponentProps, ReactNode } from "react";
import { useFeedbackModal } from "@/components/feedback/feedback-modal-context";
import type { FeedbackSource } from "@/components/feedback/practice-feedback-modal";
import { cn } from "@/lib/utils";

type OpenFeedbackButtonProps = Omit<ComponentProps<"button">, "onClick" | "type"> & {
  source: FeedbackSource;
  children: ReactNode;
};

export function OpenFeedbackButton({
  source,
  children,
  className,
  ...props
}: OpenFeedbackButtonProps) {
  const { openFeedbackModal } = useFeedbackModal();

  return (
    <button
      type="button"
      className={cn(className)}
      onClick={() => openFeedbackModal(source)}
      {...props}
    >
      {children}
    </button>
  );
}
