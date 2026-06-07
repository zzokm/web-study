import { Fragment } from "react";
import { parseExplanationInlines } from "@/lib/parse-explanation";
import { cn } from "@/lib/utils";

const codeClassName =
  "inline-code rounded bg-muted px-1.5 py-0.5 text-[0.9em] text-foreground";

export function ExplanationText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const nodes = parseExplanationInlines(text);

  return (
    <p className={cn("leading-relaxed text-foreground", className)}>
      {nodes.map((node, index) => {
        switch (node.kind) {
          case "code":
            return (
              <code key={index} className={codeClassName}>
                {node.text}
              </code>
            );
          case "em":
            return <em key={index}>{node.text}</em>;
          case "strong":
            return <strong key={index}>{node.text}</strong>;
          case "text":
            return <Fragment key={index}>{node.text}</Fragment>;
          default:
            return null;
        }
      })}
    </p>
  );
}
