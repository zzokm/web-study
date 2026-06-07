"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AnalysisChartProps {
  height: number;
  className?: string;
  children: (size: { width: number; height: number }) => ReactNode;
}

/** Renders Recharts only after the container has a real size (avoids width/height -1 warnings). */
export function AnalysisChart({ height, className, children }: AnalysisChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const { width, height: h } = el.getBoundingClientRect();
      if (width > 0 && h > 0) {
        setSize({ width: Math.floor(width), height: Math.floor(h) });
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [height]);

  return (
    <div
      ref={ref}
      className={cn("w-full min-w-0", className)}
      style={{ height }}
    >
      {size ? children(size) : null}
    </div>
  );
}
