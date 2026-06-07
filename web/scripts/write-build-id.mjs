import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const stamp = process.env.BUILD_ID ?? new Date().toISOString();
const id = createHash("sha256").update(stamp).digest("hex").slice(0, 12);

writeFileSync(join(root, "public", "build-id.txt"), `${id}\n`, "utf8");
console.log(`build-id: ${id}`);
