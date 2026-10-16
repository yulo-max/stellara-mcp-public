// SVG -> PNG with resvg (MPL-2.0, used unmodified) and the bundled DejaVu Sans font, so glyphs render the same everywhere.
import { Resvg } from "@resvg/resvg-js";
import path from "node:path";
import { fileURLToPath } from "node:url";
const fontFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "fonts", "DejaVuSans.ttf");
export function svgToPng(svg: string, width = 1400): Buffer {
  return new Resvg(svg, { font: { fontFiles: [fontFile], loadSystemFonts: false, defaultFontFamily: "DejaVu Sans" }, fitTo: { mode: "width", value: width } }).render().asPng();
}
