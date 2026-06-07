"use client";

import { ExplanationText } from "@/components/questions/explanation-text";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BookOpenTextIcon } from "lucide-react";

export function CodeExampleExplanation({ text }: { text: string }) {
  if (!text.trim()) {
    return null;
  }

  return (
    <div className="w-full rounded-lg border border-border/80 bg-muted/20">
      <Accordion className="w-full">
        <AccordionItem value="explanation" className="border-0">
          <AccordionTrigger className="px-3.5 py-2.5 text-sm text-muted-foreground hover:text-foreground">
            <span className="flex items-center gap-2">
              <BookOpenTextIcon className="size-4 shrink-0" aria-hidden />
              Explanation
            </span>
          </AccordionTrigger>
          <AccordionContent className="border-t border-border/60 px-3.5 pb-3.5 pt-3">
            <ExplanationText
              text={text}
              className="text-sm leading-relaxed text-muted-foreground"
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
