"use client";

import { useEffect, useState, type RefObject } from "react";

export type ContainerSize = { width: number; height: number };

/**
 * Tracks the content box of a container, updating on resize, orientation,
 * and visual viewport changes (mobile browser chrome / pinch zoom).
 */
export function useFitContainer(
  ref: RefObject<HTMLElement | null>
): ContainerSize {
  const [size, setSize] = useState<ContainerSize>({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      setSize({
        width: Math.max(0, Math.floor(el.clientWidth)),
        height: Math.max(0, Math.floor(el.clientHeight)),
      });
    };

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", measure);
    vv?.addEventListener("scroll", measure);
    window.addEventListener("orientationchange", measure);
    window.addEventListener("resize", measure);

    return () => {
      ro.disconnect();
      vv?.removeEventListener("resize", measure);
      vv?.removeEventListener("scroll", measure);
      window.removeEventListener("orientationchange", measure);
      window.removeEventListener("resize", measure);
    };
  }, [ref]);

  return size;
}

/** Cap DPR for sharp canvas without excessive memory use. */
export function getPdfDevicePixelRatio(): number {
  if (typeof window === "undefined") return 1;
  return Math.min(Math.max(window.devicePixelRatio || 1, 1), 2.5);
}

export type PageLayoutSize = { width: number; height: number };

/**
 * Fit page inside max bounds (contain) preserving aspect ratio.
 * Uses explicit width + height so layout cannot squash the canvas.
 */
export function fitPageLayoutSize(
  containerWidth: number,
  pageWidth: number,
  pageHeight: number,
  maxHeight: number,
  padding = 16
): PageLayoutSize {
  const availW = Math.max(0, containerWidth - padding * 2);
  const availH = Math.max(0, maxHeight);

  if (
    availW <= 0 ||
    availH <= 0 ||
    pageWidth <= 0 ||
    pageHeight <= 0
  ) {
    const fallbackW = availW || 280;
    return {
      width: fallbackW,
      height: Math.floor((fallbackW * pageHeight) / pageWidth) || fallbackW,
    };
  }

  const scale = Math.min(availW / pageWidth, availH / pageHeight);
  const width = Math.max(1, Math.floor(pageWidth * scale));
  const height = Math.max(1, Math.floor(pageHeight * scale));
  return { width, height };
}

/** @deprecated Use fitPageLayoutSize */
export function fitPageRenderWidth(
  container: ContainerSize,
  pageWidth: number,
  pageHeight: number,
  padding = 16
): number {
  return fitPageLayoutSize(
    container.width,
    pageWidth,
    pageHeight,
    container.height > 0 ? container.height - padding * 2 : 600,
    padding
  ).width;
}
