/**
 * CI audit: fail build on moderate+ vulnerabilities in the app dependency tree.
 */
import { execSync } from "child_process";

let json;
try {
  const out = execSync("npm audit --json", {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  json = JSON.parse(out);
} catch (err) {
  const stdout = err.stdout?.toString?.() ?? "";
  if (!stdout) {
    console.error(err.stderr?.toString?.() ?? err.message);
    process.exit(1);
  }
  json = JSON.parse(stdout);
}

const vulns = json.vulnerabilities ?? {};
const blocking = Object.entries(vulns).filter(([name, v]) => {
  if (v.severity === "low" || v.severity === "info") return false;
  return true;
});

if (blocking.length) {
  console.error(
    `audit:ci: ${blocking.length} vulnerability(ies) at moderate or higher`
  );
  execSync("npm audit --audit-level=moderate", { stdio: "inherit" });
  process.exit(1);
}

console.log(
  "audit:ci: passed"
);
