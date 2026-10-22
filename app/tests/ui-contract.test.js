import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the page includes the editor and comparison assets in its static build", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const build = await readFile(new URL("../../scripts/build.mjs", import.meta.url), "utf8");
  assert.match(html, /styles\.css\?v=inspector-reading-v1/);
  assert.match(html, /app\.js\?v=inspector-reading-v1/);
  assert.match(build, /review-core\.js/);
  assert.match(build, /verification-core\.js/);
});

test("details remain editable in the inspector and file tabs accept multiple uploads", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /type="file" multiple/);
  assert.match(app, /function editable\(/);
  assert.match(app, /function differenceInspector\(/);
  assert.match(app, /function commentBox\(/);
  assert.match(app, /data-action="download-yaml"/);
  assert.match(app, /data-verify-node/);
  assert.match(app, /data-verify-edge/);
  assert.match(app, /data-verify-path/);
  assert.match(app, /selected-incoming/);
  assert.match(app, /selected-outgoing/);
  assert.match(app, /data-action="toggle-ids"/);
  assert.match(app, /verified-badge/);
  assert.match(app, /incoming\.has\(link\.edgeId\)/);
  assert.match(app, /outgoing\.has\(link\.edgeId\)/);
  assert.doesNotMatch(app, /flow-legend/);
});

test("public workflow entry loads copyable GPT Work prompt separately from graph data", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  const build = await readFile(new URL("../../scripts/build.mjs", import.meta.url), "utf8");
  assert.match(app, /data-action="start-workflow"/);
  assert.match(app, /data-action="copy-workflow"/);
  assert.match(app, /fetch\("\.\/workflow\/start-with-gpt-work\.md"\)/);
  assert.match(app, /aria-modal="true"/);
  assert.match(css, /workflow-overlay\[hidden\]/);
  assert.match(build, /start-with-gpt-work\.md/);
});

test("inspector prioritizes rendered mathematics, justifications and visible mistakes", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(app, /function inspectorHeader\(/);
  assert.match(app, /function readingSection\(/);
  assert.match(app, /function renderedMath\(/);
  assert.match(app, /function statementLink\(/);
  assert.match(app, /function mistakesSection\(/);
  assert.match(app, /getRelatedMistakes\(graph, edge.id\)/);
  assert.match(app, /reading-mistake-case/);
  assert.match(app, /Incorrect move/);
  assert.match(app, /Why it fails/);
  assert.match(app, /Why this follows/);
  assert.match(app, /assumptions are required \(AND\)/);
  assert.match(app, /data-action="inspector-mode"/);
  assert.match(app, /data-action="inspector-comment"/);
  assert.match(app, /state\.inspectorMode === "edit"/);
  assert.match(app, /data-verify-\$\{verification\}/);
  assert.match(css, /\.reading-header \{/);
  assert.match(css, /\.reading-mistake-case \{/);
  assert.match(css, /\.reading-diagnosis \{/);
  assert.match(css, /\.reading-inference-flow \{/);
  assert.match(css, /\.context-inspector \.reading-body/);
});

test("browser app and context inspector modules remain valid JavaScript", async () => {
  const { spawnSync } = await import("node:child_process");
  for (const path of ["app/src/app.js", "app/src/context-ui.js"]) {
    const result = spawnSync(process.execPath, ["--check", path], { encoding: "utf8" });
    assert.equal(result.status, 0, `${path}: ${result.stderr}`);
  }
});
