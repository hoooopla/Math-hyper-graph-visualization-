import { cp, mkdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist/src", { recursive: true });
await cp("app/index.html", "dist/index.html");
for (const file of [
  "app.js", "graph-core.js", "sampleGraph.js", "math-render.js",
  "context-ui.js", "review-core.js", "verification-core.js",
  "styles.css", "yaml-lite.js"
]) {
  await cp("app/src/" + file, "dist/src/" + file);
}
await mkdir("dist/workflow", { recursive: true });
await cp("workflow/start-with-gpt-work.md", "dist/workflow/start-with-gpt-work.md");
console.log("Built Proof Atlas static site in dist/");
