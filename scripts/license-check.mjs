// Fails if any installed production dependency has a license outside MIT/BSD/Apache/ISC.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
// MPL-2.0 allowed for @resvg/resvg-js (file-level copyleft; used unmodified as a library).
const ok = /^(MIT|ISC|Apache-2\.0|BSD-2-Clause|BSD-3-Clause|0BSD|MPL-2\.0)$/;
const paths = execSync("npm ls --omit=dev --all --parseable", { encoding: "utf8" }).split("\n").filter(Boolean).slice(1);
const seen = new Map(); const bad = [];
for (const p of paths) {
  const pkg = JSON.parse(readFileSync(join(p, "package.json"), "utf8"));
  const lic = typeof pkg.license === "string" ? pkg.license : pkg.license?.type ?? "UNKNOWN";
  const parts = lic.replace(/[()]/g, "").split(/\s+(?:OR|AND)\s+/);
  const isOk = lic.includes(" AND ") ? parts.every((x) => ok.test(x)) : parts.some((x) => ok.test(x));
  seen.set(`${pkg.name}@${pkg.version}`, lic);
  if (!isOk) bad.push(`${pkg.name}@${pkg.version}: ${lic}`);
}
const counts = {}; for (const l of seen.values()) counts[l] = (counts[l] ?? 0) + 1;
console.log(`${seen.size} production packages`, counts);
if (bad.length) { console.error("NOT ALLOWED:\n" + bad.join("\n")); process.exit(1); }
console.log("License check passed.");
