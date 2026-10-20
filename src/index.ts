import { buildApp } from "./server.js";
import { placeCount } from "./cities.js";
const port = Number(process.env.PORT ?? 8080);
buildApp().listen(port, "0.0.0.0", () => {
  console.log(`stellara-mcp listening on :${port}`);
  // Warm the offline gazetteer right after start so the first chart call is fast.
  setImmediate(() => console.log(`gazetteer loaded: ${placeCount()} places`));
});
