import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the YAML drop overlay is removed from layout when hidden", async () => {
  const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(css, /\.drop-overlay\[hidden\]\s*\{\s*display:\s*none;\s*\}/);
});

test("the deployed page cache-busts the overlay fix", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /styles\.css\?v=context-cards-v1/);
});

test("the deployed page loads the KaTeX renderer and cache-busts the app", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(html, /katex@0\.16\.11\/dist\/katex\.min\.css/);
  assert.match(html, /katex@0\.16\.11\/dist\/katex\.min\.js/);
  assert.match(html, /app\.js\?v=context-cards-v1/);
  assert.match(app, /graph-core\.js\?v=canonical-schema-v1/);
  assert.match(app, /import \{ renderMath \} from/);
  assert.match(app, /renderMath\(value, window\.katex\)/);
});

test("inference inspector uses From/To labels and preserves AND premises", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(app, /detail\("From · all required",/);
  assert.match(app, /detail\("To",/);
  assert.match(app, /detail\("Justification",/);
  assert.match(app, /detail\("Common mistakes",/);
  assert.match(app, /edge\.from\.map\(/);
});


test("reference cards sit above graph and use the existing inspector", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  const build = await readFile(new URL("../scripts/build.mjs", import.meta.url), "utf8");

  assert.match(app, /class="graph-context-cards"/);
  assert.match(app, /contextCardsHtml\(graph, state\.selection, escapeHtml\)/);
  assert.match(app, /contextInspectorHtml\(graph, selection\.id, api\)/);
  assert.match(app, /theoremInspectorHtml\(graph, selection\.id, api\)/);
  assert.match(styles, /\.graph-viewport\s*\{[^}]*inset:\s*140px/);
  assert.match(styles, /\.graph-context-cards/);
  assert.match(build, /context-ui\.js/);
});

test("goal chooser supports all goals and warning report is inspectable", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /data-goal/);
  assert.match(app, /state\.goalId = event\.target\.value/);
  assert.match(app, /currentGoal\(graph\)/);
  assert.match(app, /data-select-type="validation"/);
  assert.match(app, /function validationInspectorHtml/);
});

test("edge inspector includes scope and navigable mistake references", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /edge\.scope/);
  assert.match(app, /mistake\.id/);
  assert.match(app, /data-select-type="mistake"/);
  assert.match(app, /mistake\.related_edges/);
});
