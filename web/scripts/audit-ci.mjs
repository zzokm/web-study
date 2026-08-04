/**
 * CI audit: fail build on moderate+ vulnerabilities in the app dependency tree.
 * Set SKIP_AUDIT=1 to no-op (used for Dokploy restore when transitive advisories block builds).
 */
import { execSync } from "child_process";

if (process.env.SKIP_AUDIT === "1" || process.env.SKIP_AUDIT === "true") {
  console.log("audit:ci: skipped (SKIP_AUDIT)");
  process.exit(0);
}

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

console.log("audit:ci: passed");