import test from "node:test";
import assert from "node:assert/strict";
import { buildVisualGraph, enumerateProofPaths, parseGraphYaml, validateGraph } from "../src/graph-core.js";
import { sampleGraphYaml } from "../src/sampleGraph.js";

test("sample graph parses and validates", () => {
  const result = parseGraphYaml(sampleGraphYaml);
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 0);
  assert.equal(result.graph.nodes.length, 4);
});

test("unknown node and theorem references are reported with paths", () => {
  const graph = parseGraphYaml(sampleGraphYaml).graph;
  graph.edges[0].from = ["missing-node"];
  graph.edges[0].uses = ["missing-theorem"];
  const report = validateGraph(graph);
  assert(report.errors.some((item) => item.path === "edges[0].from[0]"));
  assert(report.errors.some((item) => item.path === "edges[0].uses[0]"));
});

test("duplicate stable IDs are rejected", () => {
  const graph = parseGraphYaml(sampleGraphYaml).graph;
  graph.nodes.push({ ...graph.nodes[0] });
  const report = validateGraph(graph);
  assert(report.errors.some((item) => item.message.includes("Duplicate node ID")));
});

test("AND inference is represented by a method vertex", () => {
  const graph = parseGraphYaml(sampleGraphYaml).graph;
  graph.nodes.splice(1, 0, { id: "second_premise", type: "premise", claim: "Second premise" });
  graph.edges[0].from.push("second_premise");
  const visual = buildVisualGraph(graph);
  assert(visual.nodes.some((node) => node.visualType === "method" && node.id === graph.edges[0].id));
  assert.equal(visual.links.filter((link) => link.edgeId === graph.edges[0].id).length, 3);
});

test("proof paths reach the goal through every required premise", () => {
  const graph = parseGraphYaml(sampleGraphYaml).graph;
  const paths = enumerateProofPaths(graph, "goal_roots_commute");
  assert.equal(paths.length, 1);
  assert(paths[0].nodeIds.has("premise_positive_commuting"));
  assert(paths[0].edgeIds.has("edge_diagonal_roots_commute"));
});

test("malformed YAML returns a readable parse error", () => {
  const result = parseGraphYaml("nodes: [oops");
  assert.equal(result.graph, null);
  assert.equal(result.errors[0].path, "yaml");
});

test("alternative incoming inferences become distinct proof paths", () => {
  const graph = parseGraphYaml(sampleGraphYaml).graph;
  graph.edges.push({
    id: "edge_direct",
    from: ["premise_positive_commuting"],
    to: "goal_roots_commute",
    method: "Direct argument",
    justification: "A second valid route for path-enumeration testing.",
  });
  const paths = enumerateProofPaths(graph, "goal_roots_commute");
  assert.equal(paths.length, 2);
  assert(paths.some((path) => path.edgeIds.has("edge_direct")));
});

test("unreachable goals generate a warning rather than a false validation success", () => {
  const graph = parseGraphYaml(sampleGraphYaml).graph;
  graph.edges = [];
  const report = validateGraph(graph);
  assert(report.warnings.some((item) => item.message.includes("not reachable")));
});

test("YAML block strings and nested theorem hypotheses are preserved", () => {
  const graph = parseGraphYaml(sampleGraphYaml).graph;
  assert.match(graph.problem.statement, /positive definite Hermitian/);
  assert.deepEqual(graph.theorems[0].required_hypotheses, ["The matrices are normal.", "The matrices commute."]);
});

test("legacy claim fields are accepted and normalized to canonical assertion", () => {
  const assertionYaml = sampleGraphYaml.replace(/\n    assertion:/g, "\n    claim:");
  const result = parseGraphYaml(assertionYaml);

  assert.equal(result.errors.length, 0);
  assert.match(result.graph.nodes[0].assertion, /positive definite Hermitian/);
  assert.equal(result.graph.nodes[0].claim, result.graph.nodes[0].assertion);
});

test("visual nodes and links share one positive canvas coordinate system", () => {
  const graph = parseGraphYaml(sampleGraphYaml).graph;
  const visual = buildVisualGraph(graph);

  for (const node of visual.nodes) {
    assert(node.x >= 0 && node.x <= visual.width);
  }
  for (const link of visual.links) {
    assert.equal(link.from.x, visual.nodes.find((node) => node.id === link.from.id).x);
    assert.equal(link.to.x, visual.nodes.find((node) => node.id === link.to.id).x);
  }
});

test("canonical example uses assertion and math notation conventions", () => {
  const graph = parseGraphYaml(sampleGraphYaml).graph;
  assert(graph.nodes[0].assertion.includes("$A$"));
  assert(graph.nodes.find((node) => node.type === "goal").assertion.includes("\\["));
  assert.equal(graph.theorems[0].required_hypotheses.length, 2);
});
test("malformed edge dependencies report errors instead of crashing", () => {
  const graph = parseGraphYaml(sampleGraphYaml).graph;
  graph.edges[0].from = null;
  const result = validateGraph(graph);
  assert(result.errors.some((item) => item.path === "edges[0].from"));
});

test("incorrect schema versions and mistake categories fail validation", () => {
  const graph = parseGraphYaml(sampleGraphYaml).graph;
  graph.schema_version = "2.0";
  graph.mistakes[0].category = "not_a_category";
  const result = validateGraph(graph);
  assert(result.errors.some((item) => item.path === "schema_version"));
  assert(result.errors.some((item) => item.path === "mistakes[0].category"));
});

test("cyclic alternative proofs do not inflate vertical layout depth", () => {
  const nodes = [
    { id: "premise", type: "premise", claim: "Premise" },
    { id: "goal", type: "goal", claim: "Goal" },
    { id: "cycle_a", type: "milestone", claim: "Cycle A" },
    { id: "cycle_b", type: "milestone", claim: "Cycle B" },
  ];
  const edges = [
    { id: "direct", from: ["premise"], to: "goal", method: "Direct", justification: "Direct route" },
    { id: "into_cycle", from: ["goal"], to: "cycle_a", method: "Continue", justification: "Continue" },
    { id: "cycle_step", from: ["cycle_a"], to: "cycle_b", method: "Cycle", justification: "Cycle" },
    { id: "back_to_goal", from: ["cycle_b"], to: "goal", method: "Back", justification: "Back edge" },
  ];

  const visual = buildVisualGraph({ nodes, edges });
  const assertionLayers = visual.nodes.filter((node) => node.visualType === "assertion").map((node) => node.layer);
  assert.equal(visual.nodes.find((node) => node.id === "goal").layer, 2);
  assert(Math.max(...assertionLayers) <= 6);
});
