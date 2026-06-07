"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { GitHubIcon } from "@/components/icons/github-icon";
import { getExamPhase } from "@/lib/exam-start";
import {
  FEEDBACK_FORM_URL,
  GITHUB_PROFILE_URL,
  GITHUB_REPO_URL,
} from "@/lib/site-links";
import { cn } from "@/lib/utils";

const linkClass =
  "inline-flex items-center gap-1 font-medium underline underline-offset-4 hover:text-emerald-950 dark:hover:text-white";

const ExamConfetti = dynamic(
  () => import("./exam-confetti").then((mod) => mod.ExamConfetti),
  { ssr: false }
);

export function ExamPostCelebration() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getExamPhase() !== "after") return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <>
      <ExamConfetti />
      <div
        className={cn(
          "mx-auto mb-4 w-full max-w-4xl rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3",
          "text-sm text-emerald-950 dark:text-emerald-50"
        )}
        role="status"
      >
        <p className="font-medium leading-relaxed">
          Hope you did well on your exam!{" "}
          <span aria-hidden="true">🎉</span>
        </p>
        <p className="mt-1 leading-relaxed text-emerald-900/85 dark:text-emerald-100/85">
          If this site helped, please{" "}
          <a
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            leave feedback
          </a>
          , check out the{" "}
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            <GitHubIcon className="size-3.5" />
            project on GitHub
          </a>
          , or{" "}
          <a
            href={GITHUB_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            follow me on GitHub
          </a>
          .
        </p>
      </div>
    </>
  );
}
