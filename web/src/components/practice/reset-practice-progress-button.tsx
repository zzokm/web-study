"use client";

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
import { RotateCcwIcon } from "lucide-react";

interface ResetPracticeProgressButtonProps {
  savedCount: number;
  onConfirm: () => void;
}

export function ResetPracticeProgressButton({
  savedCount,
  onConfirm,
}: ResetPracticeProgressButtonProps) {
  if (savedCount === 0) return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 text-muted-foreground"
          />
        }
      >
        <RotateCcwIcon data-icon="inline-start" />
        Reset progress
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset practice progress?</AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            This will clear {savedCount} saved{" "}
            {savedCount === 1 ? "answer" : "answers"} for this practice set. You
            will start from question 1 and can answer every question again.{" "}
            <span className="font-medium text-foreground">
              This cannot be undone.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Reset progress
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
