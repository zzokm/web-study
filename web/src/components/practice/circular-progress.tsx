import { cn } from "@/lib/utils";

export function CircularProgress({
  value,
  size = 88,
  strokeWidth = 7,
  className,
  label,
  centerLabel,
  title,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
  /** Overrides the default percentage text in the center (e.g. "Done"). */
  centerLabel?: string;
  /** Native tooltip on hover (status detail). */
  title?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;
  const displayCenter = centerLabel ?? `${clamped}%`;
  const mini = size < 48;
  const compactCenter = size < 72;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      title={title}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `${clamped}% complete`}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/50"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-[stroke-dashoffset] duration-300"
        />
      </svg>
      <span
        className={cn(
          "absolute font-semibold tabular-nums text-foreground",
          mini && "text-[9px] leading-none",
          !mini && compactCenter && "text-xs",
          !compactCenter && "text-lg",
          centerLabel && compactCenter && !mini && "text-[10px] leading-none"
        )}
      >
        {displayCenter}
      </span>
    </div>
  );
}
