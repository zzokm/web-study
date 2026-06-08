"use client";

import { CodeIdeEditor } from "@/components/code/code-ide-editor";
import { cn } from "@/lib/utils";

export function WrittenHtmlEditor({
  value,
  onChange,
  disabled = false,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <CodeIdeEditor
      value={value}
      onChange={onChange}
      language="html"
      disabled={disabled}
      className={cn(className)}
      aria-label="HTML answer editor"
    />
  );
}
