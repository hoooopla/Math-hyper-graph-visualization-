const hash = (value) => {
  const text = JSON.stringify(value);
  let result = 2166136261;
  for (let i = 0; i < text.length; i += 1) result = Math.imul(result ^ text.charCodeAt(i), 16777619);
  return (result >>> 0).toString(36);
};

export function pathKey(goalId, path) {
  return `${goalId}|${[...path.edgeIds].sort().join("|")}`;
}

export const sourceKey = (source) => `proof-atlas-review-${hash(source)}`;

export function nodeFingerprint(graph, id) {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const visited = new Set(), edges = new Map(), involved = new Map();
  const visit = (nodeId) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const node = nodes.get(nodeId);
    if (node) involved.set(nodeId, node);
    for (const edge of graph.edges.filter((item) => item.to === nodeId)) {
      edges.set(edge.id, edge);
      edge.from.forEach(visit);
    }
  };
  visit(id);
  const used = new Set([...edges.values()].flatMap((edge) => edge.uses ?? []));
  return hash({ problem: graph.problem, nodes: [...involved].sort(), edges: [...edges].sort(),
    theorems: graph.theorems.filter((theorem) => used.has(theorem.id)).sort((a, b) => a.id.localeCompare(b.id)) });
}

export function pathFingerprint(graph, path) {
  const edges = graph.edges.filter((edge) => path.edgeIds.has(edge.id)).sort((a, b) => a.id.localeCompare(b.id));
  const used = new Set(edges.flatMap((edge) => edge.uses ?? []));
  return hash({ problem: graph.problem,
    nodes: graph.nodes.filter((node) => path.nodeIds.has(node.id)).sort((a, b) => a.id.localeCompare(b.id)),
    edges, theorems: graph.theorems.filter((theorem) => used.has(theorem.id)).sort((a, b) => a.id.localeCompare(b.id)),
    mistakes: graph.mistakes.filter((mistake) => mistake.related_edges?.some((id) => path.edgeIds.has(id))).sort((a, b) => a.id.localeCompare(b.id)) });
}

export function validReviewState(graph, saved = {}) {
  const nodes = new Map();
  for (const item of saved.verified_nodes ?? []) {
    if (graph.nodes.some((node) => node.id === item.id) && item.fingerprint === nodeFingerprint(graph, item.id)) nodes.set(item.id, item.fingerprint);
  }
  const paths = new Map();
  const currentPaths = new Map(graph.nodes.filter((node) => node.type === "goal")
    .flatMap((goal) => enumerateProofPaths(graph, goal.id).map((path) => [pathKey(goal.id, path), pathFingerprint(graph, path)])));
  for (const item of saved.verified_paths ?? []) {
    if (currentPaths.get(item.key) === item.fingerprint) paths.set(item.key, item.fingerprint);
  }
  return { nodes, paths };
}

export function reviewState(doc) {
  return {
    verified_nodes: [...doc.verification.nodes].map(([id, fingerprint]) => ({ id, fingerprint })),
    verified_paths: [...doc.verification.paths].map(([key, fingerprint]) => ({ key, fingerprint })),
  };
}
import { enumerateProofPaths } from "./graph-core.js";

