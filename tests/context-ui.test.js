import test from "node:test";
import assert from "node:assert/strict";
import { contextCardsHtml, contextInspectorHtml, theoremInspectorHtml } from "../src/context-ui.js";
import { parseGraphYaml } from "../src/graph-core.js";
import { sampleGraphYaml } from "../src/sampleGraph.js";

const baseGraph = () => parseGraphYaml(sampleGraphYaml).graph;
const escapeHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const api = { escapeHtml, mathHtml: (s) => escapeHtml(s), detail: (label, content) => "<section data-heading=\"" + escapeHtml(label) + "\">" + content + "</section>" };

test("three independent reference cards appear above the proof graph", () => {
  const graph = baseGraph();
  const html = contextCardsHtml(graph, { type: "context", id: "problem" }, escapeHtml);
  assert.equal((html.match(/data-select-type="context"/g) || []).length, 3);
  for (const id of ["problem", "notation", "theorems"]) assert.match(html, new RegExp(`data-select-id="${id}"`));
  assert.match(html, /class="context-card selected"/);
  assert.doesNotMatch(html, /data-select-type="edge"/);
});

test("Problem inspector shows full statement, source, pages, ambiguity and schema version", () => {
  const graph = baseGraph();
  graph.problem.source = { file: "Assignment <1>.pdf", pages: [1, 2] };
  graph.problem.ambiguities = ["Clarify $x=0$."];
  graph.problem.extra_note = "Preserve assumptions";
  const html = contextInspectorHtml(graph, "problem", api);
  for (const expected of ["Statement", "Source", "Ambiguities", "Assignment &lt;1&gt;.pdf",
    "Clarify $x=0$.", "YAML schema", "1.0", "extra_note", "Preserve assumptions"]) {
    assert(html.includes(expected), `Expected ${expected}`);
  }
});

test("Notation inspector enumerates every canonical notation entry", () => {
  const graph = baseGraph();
  graph.canonical_notation.custom = "$C_2=C\\times C$";
  const html = contextInspectorHtml(graph, "notation", api);
  for (const key of Object.keys(graph.canonical_notation)) assert(html.includes(key));
  assert.match(html, /C_2/);
});

test("Theorem library displays statements, required hypotheses, sources and related edge links", () => {
  const graph = baseGraph();
  const html = contextInspectorHtml(graph, "theorems", api);
  assert.equal((html.match(/class="reference-theorem"/g) || []).length, graph.theorems.length);
  assert.match(html, /Required hypotheses/);
  assert.match(html, /Standard finite-dimensional spectral theorem/);
  assert.match(html, /data-select-type="theorem"/);
  assert.match(html, /data-select-type="edge"/);
});

test("Individual theorem details preserve direct inference links", () => {
  const graph = baseGraph();
  const html = theoremInspectorHtml(graph, "THM_SIMULTANEOUS_DIAGONALIZATION", api);
  assert.match(html, /edge_simultaneous_diagonalization|Simultaneous unitary diagonalization/);
  assert.match(html, /Required hypotheses/);
  assert.match(theoremInspectorHtml(graph, "no-such-theorem", api), /not found/);
});

test("Empty notation and theorem libraries have readable fallbacks", () => {
  const graph = baseGraph();
  graph.canonical_notation = {};
  graph.theorems = [];
  assert.match(contextInspectorHtml(graph, "theorems", api), /No theorem references recorded/);
  assert.match(contextInspectorHtml(graph, "notation", api), /Definitions/);
});
