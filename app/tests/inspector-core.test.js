import assert from "node:assert/strict";
import test from "node:test";
import { inferenceAuditModel, pathAuditModel } from "../src/inspector-core.js";

const fixture = () => ({
  nodes: [
    { id: "a", type: "premise", assertion: "$A$" },
    { id: "b", type: "premise", assertion: "$B$" },
    { id: "c", type: "milestone", assertion: "$C$" },
    { id: "g", type: "goal", assertion: "$G$" },
  ],
  edges: [
    { id: "e2", from: ["c"], to: "g", method: "Finish", justification: "Step 2", uses: ["thm"] },
    { id: "e1", from: ["a", "b"], to: "c", method: "Combine", justification: "Step 1", uses: ["thm"], obligations: ["Check B"] },
    { id: "alternative", from: ["a"], to: "g", method: "Alternate", justification: "Other" },
  ],
  theorems: [{ id: "thm", statement: "T", required_hypotheses: ["H1", "H2"] }],
  mistakes: [
    { id: "mistake-a", related_edges: ["e1", "e2"], pattern: "Bad step", defect: "Missing H1" },
    { id: "mistake-b", related_edges: ["alternative"], pattern: "Unrelated", defect: "Not relevant" },
  ],
});
test("inference audit model preserves AND sources, target and theorem hypotheses", () => {
  const graph = fixture();
  const model = inferenceAuditModel(graph, graph.edges[1]);
  assert.deepEqual(model.sources.map((node) => node.id), ["a", "b"]);
  assert.equal(model.method, "Combine");
  assert.equal(model.target.id, "c");
  assert.deepEqual(model.theorems[0].required_hypotheses, ["H1", "H2"]);
  assert.deepEqual(model.mistakes.map((m) => m.id), ["mistake-a"]);
  assert.deepEqual(model.obligations, ["Check B"]);
});
test("selected solution path shows source-to-goal order and only its mistakes", () => {
  const graph = fixture();
  const path = { edgeIds: new Set(["e2", "e1"]), nodeIds: new Set(["a", "b", "c", "g"]) };
  const result = pathAuditModel(graph, path, "g");
  assert.deepEqual(result.premises.map((node) => node.id), ["a", "b"]);
  assert.deepEqual(result.orderedEdges.map((edge) => edge.id), ["e1", "e2"]);
  assert.equal(result.goal.id, "g");
  assert.deepEqual(result.mistakes.map((m) => m.id), ["mistake-a"]);
});
