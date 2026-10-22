/**
 * Non-mutating presenter model for proof inspection.
 * It reports graph dependencies, not a mathematical correctness judgment.
 */
export function inferenceAuditModel(graph, edge) {
  const nodes = new Map((graph.nodes ?? []).map((node) => [node.id, node]));
  const theorems = new Map((graph.theorems ?? []).map((theorem) => [theorem.id, theorem]));
  return {
    id: edge.id,
    method: edge.method,
    sources: (edge.from ?? []).map((id) => nodes.get(id)).filter(Boolean),
    target: nodes.get(edge.to) ?? null,
    justification: edge.justification ?? "",
    obligations: edge.obligations ?? [],
    scope: edge.scope,
    theorems: (edge.uses ?? []).map((id) => theorems.get(id)).filter(Boolean),
    mistakes: (graph.mistakes ?? []).filter((mistake) =>
      (mistake.related_edges ?? []).includes(edge.id)),
  };
}

/**
 * Order a selected AND-hypergraph solution path from premises toward its goal.
 * Distinct incoming edges are not silently inserted: only edges in the
 * selected proof path are considered.
 */
export function pathAuditModel(graph, path, goalId) {
  const nodes = new Map((graph.nodes ?? []).map((node) => [node.id, node]));
  const selectedEdges = new Set(path?.edgeIds ?? []);
  const incoming = new Map();
  for (const edge of graph.edges ?? []) {
    if (!selectedEdges.has(edge.id)) continue;
    const list = incoming.get(edge.to) ?? [];
    list.push(edge);
    incoming.set(edge.to, list);
  }
  const visitedNodes = new Set();
  const visitedEdges = new Set();
  const orderedEdges = [];
  const premises = [];
  const visit = (id) => {
    if (visitedNodes.has(id)) return;
    visitedNodes.add(id);
    const node = nodes.get(id);
    if (node?.type === "premise") { premises.push(node); return; }
    for (const edge of incoming.get(id) ?? []) {
      for (const sourceId of edge.from ?? []) visit(sourceId);
      if (!visitedEdges.has(edge.id)) {
        visitedEdges.add(edge.id);
        orderedEdges.push(edge);
      }
    }
  };
  visit(goalId);
  const pitfalls = new Map();
  for (const edge of orderedEdges) {
    for (const mistake of (graph.mistakes ?? [])) {
      if ((mistake.related_edges ?? []).includes(edge.id)) pitfalls.set(mistake.id, mistake);
    }
  }
  return {
    goal: nodes.get(goalId) ?? null,
    premises,
    orderedEdges,
    mistakes: [...pitfalls.values()],
  };
}
