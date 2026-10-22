import { cp, mkdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist/src", { recursive: true });
await cp("index.html", "dist/index.html");
for (const file of ["app.js", "graph-core.js", "sampleGraph.js", "math-render.js", "context-ui.js", "review-core.js", "verification-core.js", "styles.css", "yaml-lite.js"]) {
  await cp(`src/${file}`, `dist/src/${file}`);
}
await mkdir("dist/prompts", { recursive: true });
await mkdir("dist/docs", { recursive: true });
await cp("prompts/start-with-gpt-work.md", "dist/prompts/start-with-gpt-work.md");
await cp("docs/GETTING_STARTED.md", "dist/docs/GETTING_STARTED.md");
console.log("Built static site in dist/");
