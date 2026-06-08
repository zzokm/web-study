import type { PracticeSessionStatus } from "@/lib/practice-session-pointer";

export type PracticeHubProgressDisplay = {
  percent: number;
  statusTitle: string;
  statusDetail: string;
  centerLabel?: string;
  completed: boolean;
};

export function derivePracticeHubProgressDisplay(
  sessionStatus: PracticeSessionStatus | null,
  questionCount: number,
  hydrated = true
): PracticeHubProgressDisplay {
  if (!hydrated) {
    return {
      percent: 0,
      statusTitle: "Loading progress",
      statusDetail: `0 of ${questionCount} practiced`,
      completed: false,
    };
  }

  if (!sessionStatus) {
    return {
      percent: 0,
      statusTitle: "Not started",
      statusDetail: `0 of ${questionCount} practiced`,
      completed: false,
    };
  }

  if (sessionStatus.kind === "completed") {
    return {
      percent: 100,
      statusTitle: "Completed",
      statusDetail: "You finished this practice set.",
      completed: true,
    };
  }

  return {
    percent: sessionStatus.percent,
    statusTitle: "In progress",
    statusDetail: `${sessionStatus.answered} of ${sessionStatus.total} question${
      sessionStatus.total === 1 ? "" : "s"
    } practiced`,
    completed: false,
  };
}

export function practiceHubProgressAriaLabel(
  display: PracticeHubProgressDisplay
): string {
  return `${display.statusTitle} — ${display.statusDetail}`;
}
