import { EXAM_END, EXAM_START } from "@/lib/site-links";

export type ExamPhase = "before" | "during" | "after";

type ZonedTimeConfig = {
  date: string;
  hour: number;
  minute: number;
  timeZone: string;
};

function getZonedTimeMs({ date, hour, minute, timeZone }: ZonedTimeConfig): number {
  const [year, month, day] = date.split("-").map(Number);

  let ms = Date.UTC(year, month - 1, day, hour - 2, minute);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });

  for (let i = 0; i < 24; i++) {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(ms)).map((part) => [part.type, part.value])
    );
    const tzYear = Number(parts.year);
    const tzMonth = Number(parts.month);
    const tzDay = Number(parts.day);
    const tzHour = Number(parts.hour);
    const tzMinute = Number(parts.minute);

    if (
      tzYear === year &&
      tzMonth === month &&
      tzDay === day &&
      tzHour === hour &&
      tzMinute === minute
    ) {
      return ms;
    }

    ms +=
      (hour - tzHour) * 3_600_000 +
      (minute - tzMinute) * 60_000 +
      (day - tzDay) * 86_400_000;
  }

  return ms;
}

export function getExamStartMs(): number {
  return getZonedTimeMs(EXAM_START);
}

export function getExamEndMs(): number {
  return getZonedTimeMs(EXAM_END);
}

export function getExamPhase(now = Date.now()): ExamPhase {
  if (now < getExamStartMs()) return "before";
  if (now < getExamEndMs()) return "during";
  return "after";
}

export function getMsUntilExamStart(now = Date.now()): number {
  return getExamStartMs() - now;
}

export function getMsUntilExamEnd(now = Date.now()): number {
  return getExamEndMs() - now;
}

/** @deprecated Use getMsUntilExamStart */
export function getExamCountdownMs(now = Date.now()): number {
  return getMsUntilExamStart(now);
}
