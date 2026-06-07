import { TriangleAlertIcon } from "lucide-react";
import {
  CERTO_BOOK_CHAPTER_URL,
  CERTO_BOOK_LABEL,
} from "@/lib/chapter-3-book";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function Chapter3ReferenceWarning() {
  return (
    <Alert className="border-yellow-400/80 bg-yellow-100 text-yellow-950 dark:border-yellow-600/55 dark:bg-yellow-950/40 dark:text-yellow-50">
      <TriangleAlertIcon className="text-yellow-700 dark:text-yellow-400" />
      <AlertTitle className="text-yellow-950 dark:text-yellow-50">
        Chapter 3 references may not match the slides
      </AlertTitle>
      <AlertDescription className="text-yellow-900/90 dark:text-yellow-100/90 [&_a]:text-yellow-950 [&_a]:hover:text-yellow-950 dark:[&_a]:text-yellow-50 dark:[&_a]:hover:text-yellow-50">
        <p>
          For this chapter, cited slide numbers often do not contain the
          supporting text in the lecture PDF. References are probably from the
          textbook instead.
        </p>
        <p>
          <a
            href={CERTO_BOOK_CHAPTER_URL}
            className="font-medium underline underline-offset-4"
          >
            {CERTO_BOOK_LABEL}
          </a>
        </p>
      </AlertDescription>
    </Alert>
  );
}
