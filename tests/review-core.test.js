import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseGraphYaml } from "../src/graph-core.js";
import { compareGraphs, serializeYaml, changeRequest } from "../src/review-core.js";

test("export preserves the full uploaded graph, including nested mathematical content", async () => {
  const source = await readFile(new URL("../../review-input/graph-3.yaml", import.meta.url), "utf8");
  const graph = parseGraphYaml(source).graph;
  const exported = serializeYaml(graph);
  assert.deepEqual(parseGraphYaml(exported).graph, graph);
});

test("comparison tracks stable IDs, changed fields and downstream dependencies", () => {
  const previous = {
    nodes: [{ id: "P", type: "premise", claim: "P" }, { id: "A", type: "milestone", claim: "A" }, { id: "G", type: "goal", claim: "G" }],
    edges: [{ id: "E1", from: ["P"], to: "A", method: "old" }, { id: "E2", from: ["A"], to: "G", method: "deduce" }],
    theorems: [], mistakes: [], problem: {}, canonical_notation: {},
  };
  const revised = structuredClone(previous);
  revised.edges[0].method = "new";
  revised.mistakes.push({ id: "M1", pattern: "bad" });
  const result = compareGraphs(previous, revised);
  assert.deepEqual(result.changes.map(({ key, status, fields }) => [key, status, fields]), [
    ["edges:E1", "changed", ["method"]], ["mistakes:M1", "added", ["id", "pattern"]],
  ]);
  assert(result.affected.includes("nodes:A"));
  assert(result.affected.includes("nodes:G"));
  assert(result.affected.includes("edges:E2"));
  assert(!result.affected.includes("nodes:P"));
  assert.deepEqual(changeRequest({ name: "graph.yaml", originalGraph: previous, report: { graph: revised }, comments: [{ type: "edge", id: "E1", field: "method", text: "Check this" }] }).comments,
    [{ type: "edge", id: "E1", field: "method", text: "Check this" }]);
});
