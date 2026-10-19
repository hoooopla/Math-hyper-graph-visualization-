import { cp, mkdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist/src", { recursive: true });
await cp("index.html", "dist/index.html");
for (const file of ["app.js", "graph-core.js", "sampleGraph.js", "math-render.js", "context-ui.js", "styles.css", "yaml-lite.js"]) {
  await cp(`src/${file}`, `dist/src/${file}`);
}
console.log("Built static site in dist/");
