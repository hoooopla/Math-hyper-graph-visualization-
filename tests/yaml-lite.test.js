import test from "node:test";
import assert from "node:assert/strict";
import { parseYaml } from "../src/yaml-lite.js";

const fixture = "schema_version: \"1.0\"\nproblem:\n  id: \"analysis\"\n  source: {file: \"sheet.pdf\", pages: [2]}\n  ambiguities:\n    - |-\n      A statement involving $|E|_e$ may need review.\n      \\[\n      E\\subseteq G.\n      \\]\nnodes:\n  - {id: P1, type: premise, assertion: '$x\\in E$'}\n  - id: P2\n    type: goal\n    assertion: |-\n      \\[\n      x\\in G.\n      \\]\nedges:\n  - id: E1\n    from: [P1]\n    to: P2\n    method: \"set containment\"\n    justification: 'Since $E\\subseteq G$.'\n";

test("parse actual homework-style YAML with flow maps, bare flow IDs and list blocks", () => {
  const graph = parseYaml(fixture);
  assert.equal(graph.problem.source.file, "sheet.pdf");
  assert.deepEqual(graph.problem.source.pages, [2]);
  assert.match(graph.problem.ambiguities[0], /may need review/);
  assert(graph.problem.ambiguities[0].includes("\\["));
  assert.deepEqual(graph.edges[0].from, ["P1"]);
  assert.equal(graph.nodes[0].assertion, "$x\\in E$");
});

test("parse quoted scalars in flow collections without corrupting mathematics", () => {
  const value = parseYaml('notions: {alpha: "$x$ and $y$", beta: [A, "B:C"]}');
  assert.deepEqual(value.notions, { alpha: "$x$ and $y$", beta: ["A", "B:C"] });
});

test("detect duplicate and malformed inline mappings", () => {
  assert.throws(() => parseYaml("x: {a: 1, a: 2}"), /duplicate inline key/);
  assert.throws(() => parseYaml("x: [1, [2, 3]"), /Unclosed inline|Unbalanced inline/);
});
