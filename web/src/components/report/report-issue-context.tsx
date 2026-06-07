"use client";

import {
  Suspense,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { OpenReportIssueOptions } from "@/lib/report-issue";
import { ReportIssueDialog } from "@/components/report/report-issue-dialog";

type ReportIssueContextValue = {
  open: boolean;
  sessionId: number;
  options: OpenReportIssueOptions;
  openReportIssue: (options?: OpenReportIssueOptions) => void;
  closeReportIssue: () => void;
};

const ReportIssueContext = createContext<ReportIssueContextValue | null>(null);

export function ReportIssueProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState(0);
  const [options, setOptions] = useState<OpenReportIssueOptions>({});

  const openReportIssue = useCallback((next: OpenReportIssueOptions = {}) => {
    setOptions(next);
    setSessionId((id) => id + 1);
    setOpen(true);
  }, []);

  const closeReportIssue = useCallback(() => {
    setOpen(false);
  }, []);

  const value = useMemo(
    () => ({ open, sessionId, options, openReportIssue, closeReportIssue }),
    [open, sessionId, options, openReportIssue, closeReportIssue]
  );

  return (
    <ReportIssueContext.Provider value={value}>
      {children}
      <Suspense fallback={null}>
        <ReportIssueDialog />
      </Suspense>
    </ReportIssueContext.Provider>
  );
}

export function useReportIssue() {
  const ctx = useContext(ReportIssueContext);
  if (!ctx) {
    throw new Error("useReportIssue must be used within ReportIssueProvider");
  }
  return ctx;
}
