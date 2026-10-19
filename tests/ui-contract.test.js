import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the YAML drop overlay is removed from layout when hidden", async () => {
  const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(css, /\.drop-overlay\[hidden\]\s*\{\s*display:\s*none;\s*\}/);
});
