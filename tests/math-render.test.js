import test from "node:test";
import assert from "node:assert/strict";
import { renderMath } from "../src/math-render.js";

function stub() {
  const calls = [];
  const katex = {
    renderToString(tex, options) {
      calls.push({ tex, displayMode: options.displayMode, trust: options.trust });
      return '<span class="rendered">' + tex + "</span>";
    },
  };
  return { calls, katex };
}

test("canonical inline $...$ math renders with KaTeX", () => {
  const { calls, katex } = stub();
  const html = renderMath("Since $AB=BA$, they commute.", katex);
  assert.match(html, /<span class="rendered">AB=BA<\/span>/);
  assert.deepEqual(calls, [{ tex: "AB=BA", displayMode: false, trust: false }]);
});

test("canonical display math uses backslash bracket delimiters", () => {
  const { calls, katex } = stub();
  const html = renderMath("Result:\n\\[\n\\sqrt A\\sqrt B=\\sqrt B\\sqrt A\n\\]", katex);
  assert.match(html, /class="rendered"/);
  assert.equal(calls[0].displayMode, true);
  assert.match(calls[0].tex, /\\sqrt A/);
});

test("math in prose mixes inline and display correctly", () => {
  const { calls, katex } = stub();
  renderMath("Take $x\\in C$. Then \\[ C_2=C\\times C. \\]", katex);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].displayMode, false);
  assert.equal(calls[1].displayMode, true);
});

test("legacy backslash-parentheses still render imported graphs", () => {
  const { calls, katex } = stub();
  renderMath("Old format \\(x\\in C\\).", katex);
  assert.equal(calls[0].tex, "x\\in C");
});

test("untrusted prose is escaped and escaped dollars stay literal", () => {
  const { calls, katex } = stub();
  const result = renderMath("Cost \\$5 <script> and $x$", katex);
  assert.match(result, /Cost \$5 &lt;script&gt;/);
  assert.equal(calls.length, 1);
});

test("unmatched delimiters and missing KaTeX fail safely", () => {
  assert.equal(renderMath("Unclosed $x <b>", null), "Unclosed $x &lt;b&gt;");
  assert.match(renderMath("Start \\[x\\]", null), /tex-fallback/);
});

test("rendering errors preserve escaped math source", () => {
  const katex = { renderToString() { throw new Error("bad TeX"); } };
  assert.match(renderMath("Bad $x<y$", katex), /\$x&lt;y\$/);
});
