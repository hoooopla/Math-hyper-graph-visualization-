import test from "node:test";
import assert from "node:assert/strict";
import { parseGraphYaml, enumerateProofPaths } from "../src/graph-core.js";
import { sampleGraphYaml } from "../src/sampleGraph.js";
import { nodeFingerprint, pathFingerprint, pathKey, reviewState, validReviewState } from "../src/verification-core.js";
import { changeRequest, serializeYaml } from "../src/review-core.js";

test("verified nodes and paths survive export and only valid marks carry into revisions", () => {
  const graph = parseGraphYaml(sampleGraphYaml).graph;
  const goal = graph.nodes.find((node) => node.type === "goal").id;
  const path = enumerateProofPaths(graph, goal)[0];
  const key = pathKey(goal, path);
  const saved = {
    verified_nodes: [{ id: goal, fingerprint: nodeFingerprint(graph, goal) },
      { id: graph.nodes[0].id, fingerprint: nodeFingerprint(graph, graph.nodes[0].id) }],
    verified_paths: [{ key, fingerprint: pathFingerprint(graph, path) }],
  };
  graph.review_state = saved;
  const reimported = parseGraphYaml(serializeYaml(graph)).graph;
  const unchanged = validReviewState(reimported, reimported.review_state);
  assert.equal(unchanged.nodes.size, 2);
  assert.equal(unchanged.paths.size, 1);
  assert.deepEqual(reviewState({ verification: unchanged }), saved);
  const request = changeRequest({ name: "graph.yaml", originalGraph: graph, report: { graph: reimported }, comments: [], verification: unchanged });
  assert.deepEqual(request.review_state, saved);

  reimported.edges[0].justification += " Revised reasoning.";
  const revised = validReviewState(reimported, saved);
  assert.equal(revised.nodes.has(goal), false);
  assert.equal(revised.paths.size, 0);
  assert.equal(revised.nodes.has(graph.nodes[0].id), true);
});
