"use client";

import { pdfjs } from "react-pdf";

/** react-pdf / practice slide refs — worker must match bundled pdfjs-dist (4.8.69) */
export const PDFJS_V4_VERSION =
  typeof pdfjs.version === "string" ? pdfjs.version : "4.8.69";
export const PDF_WORKER_V4_URL = "/pdf.worker.min.mjs";

/** Passed to react-pdf <Document options={...} /> (pdfjs-dist getDocument). */
export const PDF_DOCUMENT_OPTIONS = {
  cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_V4_VERSION}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_V4_VERSION}/standard_fonts/`,
} as const;

function pdfWorkerSrc(): string {
  return PDF_WORKER_V4_URL;
}

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc();
}

export { pdfjs };
