import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the YAML drop overlay is removed from layout when hidden", async () => {
  const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(css, /\.drop-overlay\[hidden\]\s*\{\s*display:\s*none;\s*\}/);
});

test("the deployed page cache-busts the overlay fix", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /styles\.css\?v=drop-overlay-fix/);
});

test("the deployed page loads matching versions of the layout modules", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(html, /app\.js\?v=layout-and-schema-v2/);
  assert.match(app, /graph-core\.js\?v=layout-and-schema-v2/);
});
