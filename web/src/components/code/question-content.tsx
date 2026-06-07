import type { Question, QuestionContentSegment, QuestionContext } from "@/types/question";
import { CodeBlock } from "@/components/code/code-block";
import { cn } from "@/lib/utils";

function ContextBlock({
  context,
  compact,
}: {
  context: QuestionContext;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {context.text ? (
        <p
          className={cn(
            "leading-relaxed text-foreground",
            compact ? "text-sm text-muted-foreground" : "text-base"
          )}
        >
          {context.text}
        </p>
      ) : null}
      {context.code ? (
        <CodeBlock
          code={context.code}
          language={context.codeLanguage}
          compact={compact}
        />
      ) : null}
    </div>
  );
}

function SegmentList({
  segments,
  compact,
  textClassName,
}: {
  segments: QuestionContentSegment[];
  compact?: boolean;
  textClassName?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", compact && "gap-2")}>
      {segments.map((segment, index) =>
        segment.type === "code" ? (
          <CodeBlock
            key={`code-${index}`}
            code={segment.content}
            language={segment.codeLanguage}
            compact={compact}
          />
        ) : (
          <p
            key={`text-${index}`}
            className={cn(
              "leading-relaxed",
              compact
                ? "text-sm text-foreground"
                : "text-lg text-foreground",
              textClassName
            )}
          >
            {segment.content}
          </p>
        )
      )}
    </div>
  );
}

export function QuestionContextPanel({
  context,
  compact,
  className,
}: {
  context: QuestionContext;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        compact
          ? "rounded-md border border-border/70 bg-muted/20 p-3"
          : "rounded-lg border border-border/80 bg-muted/15 p-4",
        className
      )}
    >
      <ContextBlock context={context} compact={compact} />
    </div>
  );
}

export function QuestionStemContent({
  question,
  variant = "default",
  className,
}: {
  question: Question;
  variant?: "default" | "browse";
  className?: string;
}) {
  const context =
    question.context &&
    (question.context.text || question.context.code)
      ? question.context
      : null;
  const segments = question.questionSegments?.length
    ? question.questionSegments
    : [{ type: "text" as const, content: question.questionText }];

  if (variant === "browse") {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {context ? (
          <div className="line-clamp-2 text-sm text-muted-foreground">
            {context.text ?? "Code context"}
          </div>
        ) : null}
        <SegmentList
          segments={segments}
          compact
          textClassName="line-clamp-3 font-normal"
        />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {context ? <QuestionContextPanel context={context} /> : null}
      <SegmentList segments={segments} />
    </div>
  );
}

export function OptionContent({
  option,
  compact = false,
}: {
  option: Question["options"][number];
  compact?: boolean;
}) {
  if (option.type === "code") {
    return (
      <CodeBlock
        code={option.content}
        language={option.codeLanguage}
        compact={compact}
        showLanguage={false}
        className="w-full"
      />
    );
  }

  return <span className="leading-snug">{option.content}</span>;
}
