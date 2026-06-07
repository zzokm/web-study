import { copyFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");

const require = createRequire(import.meta.url);

function workerCandidates(pkgDir) {
  return [
    join(pkgDir, "build", "pdf.worker.min.mjs"),
    join(pkgDir, "build", "pdf.worker.mjs"),
    join(pkgDir, "build", "pdf.worker.min.js"),
    join(pkgDir, "legacy", "build", "pdf.worker.min.js"),
  ];
}

function resolveWorkerFromDir(pkgDir) {
  for (const path of workerCandidates(pkgDir)) {
    if (existsSync(path)) return path;
  }
  return null;
}

/** pdfjs-dist used by react-pdf (practice slide refs) — must match worker file. */
function resolveReactPdfJsDir() {
  const reactPdfDir = dirname(require.resolve("react-pdf/package.json"));
  const nestedPkg = join(reactPdfDir, "node_modules", "pdfjs-dist", "package.json");
  if (existsSync(nestedPkg)) {
    return dirname(nestedPkg);
  }
  return dirname(require.resolve("pdfjs-dist/package.json"));
}

function copyWorkerFromDir(pkgDir, destFile) {
  const workerSrc = resolveWorkerFromDir(pkgDir);
  if (!workerSrc) {
    console.error(`pdf.worker not found under ${pkgDir}`);
    process.exit(1);
  }
  const pkg = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
  copyFileSync(workerSrc, join(publicDir, destFile));
  console.log(`Copied ${destFile} (pdfjs-dist@${pkg.version})`);
  return pkg.version;
}

mkdirSync(publicDir, { recursive: true });

copyWorkerFromDir(resolveReactPdfJsDir(), "pdf.worker.min.mjs");

/** EmbedPDF lecture viewer — avoid CDN wasm (blocked/offline/CSP). */
function copyPdfiumWasm() {
  const wasmSrc = join(
    root,
    "node_modules",
    "@embedpdf",
    "pdfium",
    "dist",
    "pdfium.wasm"
  );
  if (!existsSync(wasmSrc)) {
    console.error(`pdfium.wasm not found at ${wasmSrc}`);
    process.exit(1);
  }
  copyFileSync(wasmSrc, join(publicDir, "pdfium.wasm"));
  console.log("Copied pdfium.wasm (@embedpdf/pdfium)");
}

copyPdfiumWasm();
