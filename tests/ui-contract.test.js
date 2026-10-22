import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the page includes the editor and comparison assets in its static build", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const build = await readFile(new URL("../scripts/build.mjs", import.meta.url), "utf8");
  assert.match(html, /styles\.css\?v=incident-flow-v1/);
  assert.match(html, /app\.js\?v=incident-flow-v1/);
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
  assert.match(app, /data-verify-path/);
  assert.match(app, /selected-incoming/);
  assert.match(app, /selected-outgoing/);
  assert.match(app, /data-action="toggle-ids"/);
  assert.match(app, /verified-badge/);
  assert.match(app, /incoming\.has\(link\.edgeId\)/);
  assert.match(app, /outgoing\.has\(link\.edgeId\)/);
  assert.doesNotMatch(app, /flow-legend/);
});
