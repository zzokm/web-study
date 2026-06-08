"use client";

import { CodeIdeEditor } from "@/components/code/code-ide-editor";
import { cn } from "@/lib/utils";

export function WrittenHtmlEditor({
  value,
  onChange,
  disabled = false,
  language = "html",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  language?: string;
  className?: string;
}) {
  return (
    <CodeIdeEditor
      value={value}
      onChange={onChange}
      language={language}
      disabled={disabled}
      className={cn(className)}
      aria-label="Written answer editor"
    />
  );
}
