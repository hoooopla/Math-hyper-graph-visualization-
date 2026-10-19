import { parseYaml } from "./yaml-lite.js";

export const NODE_TYPES = ["premise", "milestone", "goal"];

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const asArray = (value) => Array.isArray(value) ? value : [];

export function parseGraphYaml(source) {
  let graph;
  try {
    graph = parseYaml(source);
  } catch (error) {
    return { graph: null, errors: [{ path: "yaml", message: error.message }], warnings: [] };
  }
  const report = validateGraph(graph);
  return { graph, ...report };
}

export function validateGraph(graph) {
  const errors = [];
  const warnings = [];
  const error = (path, message) => errors.push({ path, message });
  const warning = (path, message) => warnings.push({ path, message });

  if (!isObject(graph)) {
    error("root", "The YAML document must be a mapping.");
    return { errors, warnings };
  }

  for (const key of ["schema_version", "problem", "canonical_notation", "theorems", "nodes", "edges", "mistakes"]) {
    if (!(key in graph)) error(key, "Required top-level field is missing.");
  }

  if (!isObject(graph.problem)) error("problem", "Expected a mapping describing the problem.");
  if (!Array.isArray(graph.nodes)) error("nodes", "Expected a list of assertion nodes.");
  if (!Array.isArray(graph.edges)) error("edges", "Expected a list of inference edges.");
  if (!Array.isArray(graph.theorems)) error("theorems", "Expected a list of theorems.");
  if (!Array.isArray(graph.mistakes)) error("mistakes", "Expected a list of mistakes.");

  const nodes = asArray(graph.nodes);
  const edges = asArray(graph.edges);
  const theorems = asArray(graph.theorems);
  const mistakes = asArray(graph.mistakes);
  const nodeIds = new Set();
  const edgeIds = new Set();
  const theoremIds = new Set();

  nodes.forEach((node, index) => {
    const path = `nodes[${index}]`;
    if (!isObject(node)) return error(path, "Expected a node mapping.");
    if (!node.id || typeof node.id !== "string") error(`${path}.id`, "Node ID must be a non-empty string.");
    else if (nodeIds.has(node.id)) error(`${path}.id`, `Duplicate node ID “${node.id}”.`);
    else nodeIds.add(node.id);
    if (!NODE_TYPES.includes(node.type)) error(`${path}.type`, `Expected one of: ${NODE_TYPES.join(", ")}.`);
    if (!node.claim || typeof node.claim !== "string") error(`${path}.claim`, "Node claim must be a non-empty string.");
  });

  theorems.forEach((theorem, index) => {
    const path = `theorems[${index}]`;
    if (!isObject(theorem)) return error(path, "Expected a theorem mapping.");
    if (!theorem.id || typeof theorem.id !== "string") error(`${path}.id`, "Theorem ID must be a non-empty string.");
    else if (theoremIds.has(theorem.id)) error(`${path}.id`, `Duplicate theorem ID “${theorem.id}”.`);
    else theoremIds.add(theorem.id);
    if (!theorem.statement) error(`${path}.statement`, "Theorem statement is required.");
  });

  edges.forEach((edge, index) => {
    const path = `edges[${index}]`;
    if (!isObject(edge)) return error(path, "Expected an edge mapping.");
    if (!edge.id || typeof edge.id !== "string") error(`${path}.id`, "Edge ID must be a non-empty string.");
    else if (edgeIds.has(edge.id)) error(`${path}.id`, `Duplicate edge ID “${edge.id}”.`);
    else edgeIds.add(edge.id);
    if (!Array.isArray(edge.from) || edge.from.length === 0) error(`${path}.from`, "At least one premise node is required.");
    asArray(edge.from).forEach((id, sourceIndex) => {
      if (!nodeIds.has(id)) error(`${path}.from[${sourceIndex}]`, `Unknown node “${id}”.`);
    });
    if (!nodeIds.has(edge.to)) error(`${path}.to`, `Unknown node “${edge.to}”.`);
    if (!edge.method) error(`${path}.method`, "A short method description is required.");
    if (!edge.justification) error(`${path}.justification`, "A mathematical justification is required.");
    asArray(edge.uses).forEach((id, theoremIndex) => {
      if (!theoremIds.has(id)) error(`${path}.uses[${theoremIndex}]`, `Unknown theorem “${id}”.`);
    });
  });

  mistakes.forEach((mistake, index) => {
    const path = `mistakes[${index}]`;
    if (!isObject(mistake)) return error(path, "Expected a mistake mapping.");
    asArray(mistake.related_edges).forEach((id, edgeIndex) => {
      if (!edgeIds.has(id)) error(`${path}.related_edges[${edgeIndex}]`, `Unknown edge “${id}”.`);
    });
  });

  const goals = nodes.filter((node) => node.type === "goal");
  if (goals.length === 0) warning("nodes", "No goal node is defined.");
  const reachable = computeReachableNodes(nodes, edges);
  goals.forEach((goal) => {
    if (!reachable.has(goal.id)) warning(`nodes.${goal.id}`, "Goal is not reachable from the premise nodes.");
  });
  detectCycles(nodes, edges).forEach((id) => warning(`nodes.${id}`, "This node participates in a dependency cycle."));

  return { errors, warnings };
}

export function computeReachableNodes(nodes, edges) {
  const reachable = new Set(nodes.filter((node) => node.type === "premise").map((node) => node.id));
  let changed = true;
  while (changed) {
    changed = false;
    for (const edge of edges) {
      if (edge.from.every((id) => reachable.has(id)) && !reachable.has(edge.to)) {
        reachable.add(edge.to);
        changed = true;
      }
    }
  }
  return reachable;
}

function detectCycles(nodes, edges) {
  const adjacency = new Map(nodes.map((node) => [node.id, []]));
  edges.forEach((edge) => edge.from.forEach((source) => adjacency.get(source)?.push(edge.to)));
  const visiting = new Set();
  const visited = new Set();
  const inCycle = new Set();
  const visit = (id, trail) => {
    if (visiting.has(id)) {
      const start = trail.indexOf(id);
      trail.slice(start).forEach((nodeId) => inCycle.add(nodeId));
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const next of adjacency.get(id) ?? []) visit(next, [...trail, next]);
    visiting.delete(id);
    visited.add(id);
  };
  nodes.forEach((node) => visit(node.id, [node.id]));
  return inCycle;
}

export function buildVisualGraph(graph, filters = new Set(NODE_TYPES), query = "") {
  const search = query.trim().toLowerCase();
  const baseNodes = graph.nodes.filter((node) => filters.has(node.type));
  const visibleIds = new Set(baseNodes.map((node) => node.id));
  const matchesSearch = (value) => !search || String(value ?? "").toLowerCase().includes(search);
  const visibleEdges = graph.edges.filter((edge) => edge.from.every((id) => visibleIds.has(id)) && visibleIds.has(edge.to));
  const connectedMatches = new Set();

  if (search) {
    baseNodes.forEach((node) => {
      if (matchesSearch(node.id) || matchesSearch(node.claim)) connectedMatches.add(node.id);
    });
    visibleEdges.forEach((edge) => {
      if (matchesSearch(edge.id) || matchesSearch(edge.method) || matchesSearch(edge.justification)) {
        edge.from.forEach((id) => connectedMatches.add(id));
        connectedMatches.add(edge.to);
      }
    });
  }

  const nodes = search ? baseNodes.filter((node) => connectedMatches.has(node.id)) : baseNodes;
  const retainedIds = new Set(nodes.map((node) => node.id));
  const edges = visibleEdges.filter((edge) => edge.from.every((id) => retainedIds.has(id)) && retainedIds.has(edge.to));
  return layoutGraph(nodes, edges);
}

export function layoutGraph(nodes, edges) {
  const layerByNode = new Map(nodes.map((node) => [node.id, node.type === "premise" ? 0 : 1]));
  for (let pass = 0; pass < nodes.length + 1; pass += 1) {
    let changed = false;
    for (const edge of edges) {
      const sourceLayers = edge.from.map((id) => layerByNode.get(id) ?? 0);
      const next = Math.max(...sourceLayers) + 2;
      if (next > (layerByNode.get(edge.to) ?? 0)) {
        layerByNode.set(edge.to, next);
        changed = true;
      }
    }
    if (!changed) break;
  }
  const visualNodes = nodes.map((node) => ({ ...node, visualType: "assertion", layer: layerByNode.get(node.id) ?? 0 }));
  edges.forEach((edge) => {
    const sourceLayer = Math.max(...edge.from.map((id) => layerByNode.get(id) ?? 0));
    visualNodes.push({ ...edge, visualType: "method", layer: sourceLayer + 1 });
  });
  const layers = new Map();
  visualNodes.forEach((node) => {
    if (!layers.has(node.layer)) layers.set(node.layer, []);
    layers.get(node.layer).push(node);
  });

  const xGap = 284;
  const yGap = 170;
  const positioned = [];
  let maxWidth = 0;
  [...layers.entries()].sort(([a], [b]) => a - b).forEach(([layer, layerNodes]) => {
    const width = Math.max(0, (layerNodes.length - 1) * xGap);
    maxWidth = Math.max(maxWidth, width);
    layerNodes.forEach((node, index) => {
      positioned.push({ ...node, x: index * xGap - width / 2, y: layer * yGap + 72 });
    });
  });
  const positionById = new Map(positioned.map((node) => [node.id, node]));
  const links = [];
  edges.forEach((edge) => {
    edge.from.forEach((source) => links.push({ id: `${source}--${edge.id}`, from: positionById.get(source), to: positionById.get(edge.id), edgeId: edge.id }));
    links.push({ id: `${edge.id}--${edge.to}`, from: positionById.get(edge.id), to: positionById.get(edge.to), edgeId: edge.id });
  });
  return { nodes: positioned, links, width: Math.max(760, maxWidth + 420), height: Math.max(560, (Math.max(0, ...positioned.map((node) => node.layer)) + 1) * yGap + 180) };
}

export function enumerateProofPaths(graph, goalId, limit = 12) {
  const incoming = new Map();
  graph.edges.forEach((edge) => {
    if (!incoming.has(edge.to)) incoming.set(edge.to, []);
    incoming.get(edge.to).push(edge);
  });

  const solve = (nodeId, trail = new Set()) => {
    if (trail.has(nodeId)) return [];
    const node = graph.nodes.find((item) => item.id === nodeId);
    if (!node) return [];
    if (node.type === "premise") return [{ nodeIds: new Set([nodeId]), edgeIds: new Set() }];
    const choices = incoming.get(nodeId) ?? [];
    const results = [];
    for (const edge of choices) {
      const sourceChoices = edge.from.map((source) => solve(source, new Set([...trail, nodeId])));
      if (sourceChoices.some((paths) => paths.length === 0)) continue;
      let combinations = [{ nodeIds: new Set([nodeId]), edgeIds: new Set([edge.id]) }];
      for (const paths of sourceChoices) {
        const next = [];
        for (const base of combinations) {
          for (const path of paths) {
            next.push({
              nodeIds: new Set([...base.nodeIds, ...path.nodeIds]),
              edgeIds: new Set([...base.edgeIds, ...path.edgeIds]),
            });
            if (next.length >= limit) break;
          }
          if (next.length >= limit) break;
        }
        combinations = next;
      }
      results.push(...combinations);
      if (results.length >= limit) break;
    }
    return results.slice(0, limit);
  };
  return solve(goalId).slice(0, limit);
}

export function getRelatedMistakes(graph, edgeId) {
  return graph.mistakes.filter((mistake) => asArray(mistake.related_edges).includes(edgeId));
}
