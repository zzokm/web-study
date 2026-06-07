"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CERTO_BOOK_CHAPTER_URL,
  CERTO_BOOK_LABEL,
  CHAPTER_3_LECTURE_SLUG,
  isChapter3Lecture,
} from "@/lib/chapter-3-book";

interface Chapter3PracticeGateProps {
  lectureSlug?: string;
  children: React.ReactNode;
}

export function Chapter3PracticeGate({
  lectureSlug,
  children,
}: Chapter3PracticeGateProps) {
  const router = useRouter();
  const [acknowledged, setAcknowledged] = useState(false);

  if (!isChapter3Lecture(lectureSlug) || acknowledged) {
    return <>{children}</>;
  }

  return (
    <AlertDialog open onOpenChange={() => {}}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Chapter 3 — check the textbook</AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            References for Chapter 3 questions may not be found in the lecture
            slides. They are probably from the course textbook instead. Open{" "}
            <a
              href={CERTO_BOOK_CHAPTER_URL}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {CERTO_BOOK_LABEL}
            </a>{" "}
            when reviewing answers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() =>
              router.push(`/by-lecture/${CHAPTER_3_LECTURE_SLUG}/`)
            }
          >
            Go back
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => setAcknowledged(true)}>
            Start practice
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
