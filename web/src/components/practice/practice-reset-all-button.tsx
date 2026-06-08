"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { clearAllPracticeProgress } from "@/lib/practice-reset";
import { RotateCcwIcon } from "lucide-react";

const CONFIRM_DELAY_SEC = 10;

export function PracticeResetAllButton() {
  const [open, setOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(CONFIRM_DELAY_SEC);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearCountdown = useCallback(() => {
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    clearCountdown();
    setSecondsLeft(CONFIRM_DELAY_SEC);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearCountdown();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearCountdown]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next) {
        startCountdown();
      } else {
        clearCountdown();
        setSecondsLeft(CONFIRM_DELAY_SEC);
      }
    },
    [clearCountdown, startCountdown]
  );

  useEffect(() => () => clearCountdown(), [clearCountdown]);

  const confirmReady = secondsLeft === 0;

  function handleReset() {
    if (!confirmReady) return;
    clearAllPracticeProgress();
    setOpen(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-muted-foreground"
          />
        }
      >
        <RotateCcwIcon data-icon="inline-start" />
        Reset all progress
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset all practice progress?</AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            This clears every in-progress session, completed result, and
            progress ring on this device. Saved questions and bookmarks are not
            affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!confirmReady}
            onClick={handleReset}
          >
            {confirmReady
              ? "Reset all progress"
              : `Reset in ${secondsLeft}s`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
