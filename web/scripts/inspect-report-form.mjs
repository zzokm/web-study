/**
 * Fetches the report Google Form and prints field titles + prefill entry IDs.
 * Run: node scripts/inspect-report-form.mjs
 */

const FORM_ID = "1FAIpQLSc_xJ6zuD2eGeWSraN0TCq4WYBRJAVsaseA9e_DtfQOod8QaA";
const url = `https://docs.google.com/forms/d/e/${FORM_ID}/viewform`;

const res = await fetch(url);
const html = await res.text();

const marker = "FB_PUBLIC_LOAD_DATA_ = ";
const start = html.indexOf(marker);
if (start < 0) {
  console.error("FB_PUBLIC_LOAD_DATA_ not found");
  process.exit(1);
}

const jsonStart = start + marker.length;
let depth = 0;
let inStr = false;
let esc = false;
let end = -1;

for (let i = jsonStart; i < html.length; i++) {
  const c = html[i];
  if (inStr) {
    if (esc) esc = false;
    else if (c === "\\") esc = true;
    else if (c === '"') inStr = false;
    continue;
  }
  if (c === '"') {
    inStr = true;
    continue;
  }
  if (c === "[") depth++;
  else if (c === "]") {
    depth--;
    if (depth === 0) {
      end = i + 1;
      break;
    }
  }
}

const data = JSON.parse(html.slice(jsonStart, end));
const fields = data[1][1];

console.log("Form fields:\n");
for (const f of fields) {
  const title = f[1];
  const entry = f[4]?.[0]?.[0];
  const choices = f[4]?.[0]?.[1];
  console.log(`- ${title}`);
  console.log(`  entry: ${entry ?? "(none)"}`);
  if (Array.isArray(choices)) {
    const labels = choices.map((c) => c[0]).filter(Boolean);
    if (labels.length) {
      console.log(`  choices (${labels.length}):`);
      for (const label of labels) console.log(`    - ${label}`);
    }
  }
  console.log();
}
