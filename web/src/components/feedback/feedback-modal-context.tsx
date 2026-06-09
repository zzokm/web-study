"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  FeedbackFormDialog,
  type FeedbackSource,
} from "@/components/feedback/practice-feedback-modal";

type FeedbackModalContextValue = {
  open: boolean;
  source: FeedbackSource;
  openFeedbackModal: (source?: FeedbackSource) => void;
  closeFeedbackModal: () => void;
};

const FeedbackModalContext = createContext<FeedbackModalContextValue | null>(null);

export function FeedbackModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState(0);
  const [source, setSource] = useState<FeedbackSource>("home");

  const openFeedbackModal = useCallback((nextSource: FeedbackSource = "home") => {
    setSource(nextSource);
    setSessionId((id) => id + 1);
    setOpen(true);
  }, []);

  const closeFeedbackModal = useCallback(() => {
    setOpen(false);
  }, []);

  const value = useMemo(
    () => ({ open, source, openFeedbackModal, closeFeedbackModal }),
    [open, source, openFeedbackModal, closeFeedbackModal]
  );

  return (
    <FeedbackModalContext.Provider value={value}>
      {children}
      {open ? (
        <FeedbackFormDialog
          key={sessionId}
          open={open}
          onClose={closeFeedbackModal}
          variant="general"
          source={source}
        />
      ) : null}
    </FeedbackModalContext.Provider>
  );
}

export function useFeedbackModal() {
  const ctx = useContext(FeedbackModalContext);
  if (!ctx) {
    throw new Error("useFeedbackModal must be used within FeedbackModalProvider");
  }
  return ctx;
}
