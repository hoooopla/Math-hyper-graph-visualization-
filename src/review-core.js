import { parseYaml } from "./yaml-lite.js";

const lists = ["nodes", "edges", "theorems", "mistakes"];
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const canonical = (value) => JSON.stringify(value, (_, entry) => object(entry)
  ? Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a.localeCompare(b))) : entry);

export function serializeYaml(value) {
  const scalar = (entry) => JSON.stringify(entry);
  // Arrays and nested mappings use the parser's supported indentation form.
  const lines = (entry, depth = 0) => {
    const pad = " ".repeat(depth);
    if (Array.isArray(entry)) return entry.length ? entry.map((item) =>
      object(item) || Array.isArray(item) ? `${pad}-\n${lines(item, depth + 2)}` : `${pad}- ${scalar(item)}`
    ).join("\n") : `${pad}[]`;
    if (object(entry)) return Object.keys(entry).length ? Object.entries(entry).map(([key, item]) =>
      object(item) || Array.isArray(item) && item.length
        ? `${pad}${scalar(key)}:\n${lines(item, depth + 2)}`
        : `${pad}${scalar(key)}: ${Array.isArray(item) ? "[]" : scalar(item)}`
    ).join("\n") : `${pad}{}`;
    return `${pad}${scalar(entry)}`;
  };
  const output = lines(value) + "\n";
  if (canonical(parseYaml(output)) !== canonical(value)) throw new Error("YAML serialization round trip failed.");
  return output;
}

function entries(graph) {
  const rows = new Map();
  for (const kind of lists) for (const item of graph?.[kind] ?? []) {
    if (item?.id) rows.set(`${kind}:${item.id}`, { kind, id: item.id, value: item });
  }
  for (const kind of ["problem", "canonical_notation"]) {
    if (graph?.[kind] !== undefined) rows.set(`${kind}:${kind}`, { kind, id: kind, value: graph[kind] });
  }
  return rows;
}

export function compareGraphs(before, after) {
  if (!before || !after) return { changes: [], affected: [] };
  const oldEntries = entries(before), newEntries = entries(after);
  const keys = new Set([...oldEntries.keys(), ...newEntries.keys()]);
  const changes = [];
  for (const key of keys) {
    const oldItem = oldEntries.get(key), newItem = newEntries.get(key);
    if (oldItem && newItem && canonical(oldItem.value) === canonical(newItem.value)) continue;
    const { kind, id } = newItem ?? oldItem;
    const oldValue = oldItem?.value ?? null, newValue = newItem?.value ?? null;
    const fields = [...new Set([...Object.keys(oldValue ?? {}), ...Object.keys(newValue ?? {})])]
      .filter((field) => canonical(oldValue?.[field]) !== canonical(newValue?.[field]));
    changes.push({ key, kind, id, status: !oldItem ? "added" : !newItem ? "removed" : "changed", fields, before: oldValue, after: newValue });
  }
  const affected = new Set();
  const changedNodes = new Set(changes.filter((c) => c.kind === "nodes").map((c) => c.id));
  const changedTheorems = new Set(changes.filter((c) => c.kind === "theorems").map((c) => c.id));
  const changedEdges = new Set(changes.filter((c) => c.kind === "edges").map((c) => c.id));
  for (const change of changes.filter((c) => c.kind === "edges")) {
    if (change.before?.to) changedNodes.add(change.before.to);
    if (change.after?.to) changedNodes.add(change.after.to);
  }
  let updated = true;
  while (updated) {
    updated = false;
    for (const edge of after.edges ?? []) {
      if (!changedEdges.has(edge.id) && !edge.from?.some((id) => changedNodes.has(id)) && !edge.uses?.some((id) => changedTheorems.has(id))) continue;
      if (!changedNodes.has(edge.to)) { changedNodes.add(edge.to); updated = true; }
      if (!changedEdges.has(edge.id)) { changedEdges.add(edge.id); affected.add(`edges:${edge.id}`); }
    }
  }
  for (const id of changedNodes) if (!changes.some((c) => c.kind === "nodes" && c.id === id)) affected.add(`nodes:${id}`);
  return { changes, affected: [...affected] };
}

export function changeRequest(document) {
  const { changes } = compareGraphs(document.originalGraph, document.report.graph);
  return {
    source_file: document.name,
    changes: changes.map(({ kind, id, status, fields }) => ({ kind, id, status, fields })),
    comments: document.comments.map(({ type, id, field, text }) => ({ type, id, field, text })),
  };
}
