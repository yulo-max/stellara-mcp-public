// Dev helper: render an SVG file to PNG with @resvg/resvg-js (devDependency only, not shipped).
// Usage: node scripts/render-png.mjs in.svg out.png
import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
const [, , input, output] = process.argv;
const png = new Resvg(readFileSync(input, "utf8"), { font: { loadSystemFonts: true, defaultFontFamily: "DejaVu Sans" }, fitTo: { mode: "width", value: 1200 } }).render().asPng();
writeFileSync(output, png);
console.log(output, png.length, "bytes");
