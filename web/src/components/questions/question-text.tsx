import { Fragment } from "react";
import { parseQuestionInlines } from "@/lib/parse-question-inlines";
import { cn } from "@/lib/utils";

const codeClassName =
  "inline-code rounded bg-muted px-1.5 py-0.5 text-[0.9em] text-foreground";

export function QuestionText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const nodes = parseQuestionInlines(text);

  return (
    <span className={cn(className)}>
      {nodes.map((node, index) => {
        switch (node.kind) {
          case "code":
            return (
              <code key={index} className={codeClassName}>
                {node.text}
              </code>
            );
          case "strike":
            return <del key={index}>{node.text}</del>;
          case "underline":
            return <u key={index}>{node.text}</u>;
          case "text":
            return <Fragment key={index}>{node.text}</Fragment>;
          default:
            return null;
        }
      })}
    </span>
  );
}
