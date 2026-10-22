/** Presentation-only reference cards; they never become proof-graph dependencies. */
export const CONTEXT_SECTIONS = ["problem", "notation", "theorems"];

export function contextCardsHtml(graph, selection, escapeHtml) {
  const count = Object.keys(graph.canonical_notation ?? {}).length;
  const entries = [
    { id: "problem", label: "Problem", detail: graph.problem?.title || graph.problem?.id || "Problem statement" },
    { id: "notation", label: "Notation", detail: `${count} symbol${count === 1 ? "" : "s"}` },
    { id: "theorems", label: "Theorems", detail: `${graph.theorems?.length ?? 0} reference${graph.theorems?.length === 1 ? "" : "s"}` },
  ];
  return entries.map((item) => {
    const selected = selection?.type === "context" && selection.id === item.id;
    return '<button type="button" class="context-card' + (selected ? " selected" : "")
      + '" data-select-type="context" data-select-id="' + item.id
      + '" aria-pressed="' + String(selected) + '">'
      + '<span class="context-eyebrow">Reference</span>'
      + '<strong>' + escapeHtml(item.label) + '</strong>'
      + '<small title="' + escapeHtml(item.detail) + '">' + escapeHtml(item.detail) + '</small></button>';
  }).join("");
}

function valueHtml(value, { mathHtml, escapeHtml }) {
  if (value == null) return '<em class="empty-note">Not specified</em>';
  if (Array.isArray(value)) {
    if (!value.length) return '<span class="empty-note">None recorded</span>';
    return '<ul class="reference-list">' + value.map((item) => '<li>' + valueHtml(item, {mathHtml, escapeHtml}) + '</li>').join("") + '</ul>';
  }
  if (typeof value === "object") {
    return '<dl class="reference-rows">' + Object.entries(value).map(([key, entry]) =>
      '<div><dt>' + escapeHtml(key) + '</dt><dd class="math-text">' + valueHtml(entry, {mathHtml, escapeHtml}) + '</dd></div>'
    ).join("") + '</dl>';
  }
  return '<span class="math-text">' + mathHtml(String(value)) + '</span>';
}

function heading(kind, title, escapeHtml) {
  return '<header class="reading-header context-reading-header">'
    + '<div class="reading-header-label">Reference · ' + escapeHtml(kind) + '</div>'
    + '<h2 class="context-heading">' + escapeHtml(title) + '</h2></header>';
}

function theoremCard(theorem, graph, api) {
  const { mathHtml, escapeHtml } = api;
  const uses = (graph.edges ?? []).filter((edge) => (edge.uses ?? []).includes(theorem.id));
  const hypotheses = theorem.required_hypotheses ?? theorem.hypotheses ?? [];
  return '<article class="theorem-card reference-theorem">'
    + '<button type="button" class="reference-link" data-select-type="theorem" data-select-id="' + escapeHtml(theorem.id) + '">'
    + escapeHtml(theorem.id) + '<span aria-hidden="true">↗</span></button>'
    + '<div class="math-text">' + mathHtml(theorem.statement) + '</div>'
    + (hypotheses.length ? '<div class="hypotheses-list"><strong>Required hypotheses</strong>'
       + hypotheses.map((hypothesis) => '<span class="math-text">' + mathHtml(hypothesis) + '</span>').join("") + '</div>' : "")
    + (theorem.source ? '<div class="reference-source"><strong>Source</strong><div>' + escapeHtml(theorem.source) + '</div></div>' : "")
    + (uses.length ? '<div class="reference-related"><strong>Used by</strong>'
       + uses.map((edge) => '<button type="button" data-select-type="edge" data-select-id="' + escapeHtml(edge.id)
           + '">' + escapeHtml(edge.method || edge.id) + '</button>').join("") + '</div>' : "")
    + '</article>';
}

export function contextInspectorHtml(graph, id, api) {
  const { detail, escapeHtml, mathHtml } = api;
  if (id === "problem") {
    const problem = graph.problem ?? {};
    const extras = Object.entries(problem).filter(([key]) => !["id", "title", "statement", "source", "ambiguities"].includes(key));
    return '<div class="inspector-content context-inspector reading-inspector">'
      + heading("problem", problem.title || problem.id || "Problem", escapeHtml)
      + '<div class="reading-body"><div class="reference-id">' + escapeHtml(problem.id ?? "") + '</div>'
      + detail("Statement", '<div class="math-text">' + mathHtml(problem.statement ?? "") + '</div>', "important")
      + (problem.source !== undefined ? detail("Source", valueHtml(problem.source, api)) : "")
      + detail("Ambiguities", valueHtml(problem.ambiguities ?? [], api))
      + extras.map(([key, val]) => detail(key, valueHtml(val, api))).join("")
      + detail("YAML schema", '<code>' + escapeHtml(graph.schema_version ?? "Unknown") + '</code>')
      + '</div></div>';
  }
  if (id === "notation") {
    const notation = graph.canonical_notation ?? {};
    return '<div class="inspector-content context-inspector">'
      + heading("notation", "Canonical notation", escapeHtml)
      + '<div class="reading-body">' + detail("Definitions", valueHtml(notation, api), "important")
      + '</div></div>';
  }
  if (id === "theorems") {
    const theorems = graph.theorems ?? [];
    return '<div class="inspector-content context-inspector">'
      + heading("theorems", "Theorem library", escapeHtml)
      + '<div class="reading-body">' + detail(`${theorems.length} reference${theorems.length === 1 ? "" : "s"}`,
        theorems.length ? theorems.map((theorem) => theoremCard(theorem, graph, api)).join("")
          : '<span class="empty-note">No theorem references recorded.</span>', "important")
      + '</div></div>';
  }
  return '<div class="inspector-empty"><p>Unknown reference section.</p></div>';
}

export function theoremInspectorHtml(graph, theoremId, api) {
  const theorem = (graph.theorems ?? []).find((item) => item.id === theoremId);
  if (!theorem) return '<div class="inspector-empty"><p>Theorem not found.</p></div>';
  return '<div class="inspector-content context-inspector reading-inspector">'
    + heading("theorem", theorem.id, api.escapeHtml)
    + '<div class="reading-body">' + theoremCard(theorem, graph, api)
    + '</div></div>';
}

