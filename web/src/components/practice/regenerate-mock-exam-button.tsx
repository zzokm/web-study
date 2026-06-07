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
import { ShuffleIcon } from "lucide-react";

interface RegenerateMockExamButtonProps {
  onConfirm: () => void;
}

export function RegenerateMockExamButton({
  onConfirm,
}: RegenerateMockExamButtonProps) {
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
        <ShuffleIcon data-icon="inline-start" />
        Regenerate
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Regenerate mock exam?</AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            This draws a new random seed and replaces the current question set.
            Any in-progress answers for this exam will be cleared when you return
            to setup.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Regenerate</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
