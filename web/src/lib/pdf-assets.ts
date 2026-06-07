/** Absolute URLs for EmbedPDF / PDFium (relative paths can stall WASM init). */

export function pdfiumWasmUrl(): string {
  if (typeof window === "undefined") return "/pdfium.wasm";
  return new URL("/pdfium.wasm", window.location.href).href;
}

export function pdfDocumentUrl(path: string): string {
  if (path.startsWith("http")) return path;
  if (typeof window === "undefined") {
    return path.startsWith("/") ? path : `/${path}`;
  }
  return new URL(path.startsWith("/") ? path : `/${path}`, window.location.href)
    .href;
}
