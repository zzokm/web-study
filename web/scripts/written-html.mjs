/** Keep in sync with src/lib/written-html.ts */
export function wrapHtmlIfNeeded(source) {
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
