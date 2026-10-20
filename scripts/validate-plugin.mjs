// Local check against the Cursor plugin submission checklist (docs/reference/plugins).
import { readFileSync, existsSync, readdirSync } from "node:fs";
const errs = [];
const m = JSON.parse(readFileSync(".cursor-plugin/plugin.json", "utf8"));
if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(m.name ?? "")) errs.push("name not kebab-case");
if (!m.description) errs.push("missing description");
if (m.version && !/^\d+\.\d+\.\d+/.test(m.version)) errs.push("version not semver");
for (const k of ["logo", "skills", "rules", "agents", "commands", "mcpServers"]) {
  const v = m[k]; if (typeof v !== "string" || /^https?:/.test(v)) continue;
  if (v.startsWith("/") || v.includes("..")) errs.push(`${k}: path must be relative`);
  else if (!existsSync(v)) errs.push(`${k}: ${v} not found`);
}
const mcp = JSON.parse(readFileSync("mcp.json", "utf8"));
for (const [n, s] of Object.entries(mcp.mcpServers ?? {})) {
  if (!s.url && !s.command) errs.push(`mcp ${n}: needs url or command`);
  for (const v of JSON.stringify(s).match(/\$\{(\w+)\}/g) ?? [])
    if (!m.variables?.properties?.[v.slice(2, -1)]) errs.push(`mcp ${n}: ${v} not declared`);
}
for (const d of readdirSync("skills")) {
  const t = readFileSync(`skills/${d}/SKILL.md`, "utf8");
  const fm = /^---\n([\s\S]*?)\n---/.exec(t)?.[1] ?? "";
  const name = /^name:\s*(.+)$/m.exec(fm)?.[1]?.trim();
  if (name !== d || !/^[a-z0-9-]+$/.test(name)) errs.push(`skill ${d}: name must be kebab-case and match folder`);
  if (!/^description:\s*\S/m.test(fm)) errs.push(`skill ${d}: missing description`);
}
for (const f of ["README.md", "LICENSE"]) if (!existsSync(f)) errs.push(`missing ${f}`);
if (errs.length) { console.error(errs.join("\n")); process.exit(1); }
console.log("Plugin manifest, mcp.json, skills, logo, README and LICENSE: OK");
