/** Wrap HTML fragments in a minimal document for iframe preview and judging. */
export function wrapHtmlIfNeeded(source: string): string {
  const trimmed = source.trim();
  if (/<!DOCTYPE\s+html/i.test(trimmed) || /<html[\s>]/i.test(trimmed)) {
    return source;
  }
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
${source}
</body>
</html>`;
}
