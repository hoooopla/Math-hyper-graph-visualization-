import { buildVisualGraph, enumerateProofPaths, getRelatedMistakes, NODE_TYPES, parseGraphYaml } from "./graph-core.js?v=canonical-schema-v1";
import { sampleGraphYaml } from "./sampleGraph.js?v=canonical-sample-v1";
import { renderMath } from "./math-render.js";
import { contextCardsHtml, contextInspectorHtml, theoremInspectorHtml } from "./context-ui.js";
const root = document.querySelector("#root");
const TYPE_LABELS = { premise: "Premises", milestone: "Milestones", goal: "Goals" };
const state = {
  report: parseGraphYaml(sampleGraphYaml),
  fileName: "example-graph.yaml",
  query: "",
  filters: new Set(NODE_TYPES),
  selection: { type: "node", id: "goal_roots_commute" },
  activePath: null,
  goalId: null,
  view: { x: 0, y: 42, scale: 1 },
  mobilePanel: null,
};

root.innerHTML = `
  <main class="app-shell">
    <header class="topbar"></header>
    <aside class="sidebar"></aside>
    <section class="workspace"></section>
    <div class="inspector-resizer" role="separator" aria-label="Resize details panel" aria-orientation="vertical" tabindex="0" aria-valuemin="300" aria-valuemax="900" aria-valuenow="420" title="Drag to resize details panel"></div>
    <aside class="inspector"></aside>
    <nav class="mobile-nav" aria-label="Mobile panels">
      <button data-mobile="sidebar">${icon("layers")} Explore</button>
      <button data-action="upload">${icon("upload")} Upload</button>
      <button data-mobile="inspector">${icon("info")} Inspect</button>
    </nav>
    <input id="yaml-file" hidden type="file" accept=".yaml,.yml,text/yaml">
    <div class="drop-overlay" hidden>${icon("upload", 28)}<strong>Drop YAML to inspect</strong><span>Nothing is uploaded to a server</span></div>
  </main>`;

const shell = root.querySelector(".app-shell");
const topbar = root.querySelector(".topbar");
const sidebar = root.querySelector(".sidebar");
const workspace = root.querySelector(".workspace");
const inspector = root.querySelector(".inspector");
const resizer = root.querySelector(".inspector-resizer");
const savedWidth = Number(localStorage.getItem("proof-atlas-inspector-width"));
if (savedWidth >= 300 && savedWidth <= 900) setInspectorWidth(savedWidth);

function setInspectorWidth(width) {
  const max = Math.max(300, window.innerWidth - (window.innerWidth <= 1050 ? 248 : 282) - 300);
  const value = Math.round(Math.max(300, Math.min(width, Math.min(900, max))));
  shell.style.setProperty("--inspector-width", `${value}px`);
  resizer.setAttribute("aria-valuenow", value);
  localStorage.setItem("proof-atlas-inspector-width", value);
}
let resizeStart = null;
resizer.addEventListener("pointerdown", (event) => {
  resizeStart = { x: event.clientX, width: inspector.getBoundingClientRect().width };
  resizer.setPointerCapture(event.pointerId);
  document.body.classList.add("resizing-inspector");
});
resizer.addEventListener("pointermove", (event) => {
  if (resizeStart) setInspectorWidth(resizeStart.width + resizeStart.x - event.clientX);
});
function finishResize() {
  if (!resizeStart) return;
  resizeStart = null;
  document.body.classList.remove("resizing-inspector");
}
resizer.addEventListener("pointerup", finishResize);
resizer.addEventListener("pointercancel", finishResize);
resizer.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    setInspectorWidth(inspector.getBoundingClientRect().width + (event.key === "ArrowLeft" ? 30 : -30));
  }
});
const fileInput = root.querySelector("#yaml-file");
const overlay = root.querySelector(".drop-overlay");

function render() {
  renderHeader();
  renderSidebar();
  renderWorkspace();
  renderInspector();
  sidebar.classList.toggle("mobile-open", state.mobilePanel === "sidebar");
  inspector.classList.toggle("mobile-open", state.mobilePanel === "inspector");
}

function renderHeader() {
  const valid = state.report.errors.length === 0;
  topbar.innerHTML = `
    <div class="brand-mark">${icon("atlas")}<span>PROOF ATLAS</span><em>01</em></div>
    <div class="file-chip">${icon("file")}<span>${escapeHtml(state.fileName)}</span></div>
    <button type="button" class="status-chip ${valid ? "valid" : "invalid"}" data-select-type="validation" data-select-id="report" aria-label="Inspect structural validation results">
      ${icon(valid ? "shield" : "warning")}<span>${valid ? `Valid · ${state.report.warnings.length} warnings` : `${state.report.errors.length} errors`}</span>
    </button>
    <button class="upload-button" data-action="upload">${icon("upload")}<span>Open YAML</span></button>`;
}

function currentGoal(graph) {
  const goals = graph?.nodes?.filter((node) => node.type === "goal") ?? [];
  return goals.find((goal) => goal.id === state.goalId) ?? goals[0] ?? null;
}

function renderSidebar() {
  const graph = state.report.graph;
  const valid = graph && state.report.errors.length === 0;
  const goals = valid ? graph.nodes.filter((node) => node.type === "goal") : [];
  const chosenGoal = valid ? currentGoal(graph) : null;
  const paths = chosenGoal ? enumerateProofPaths(graph, chosenGoal.id) : [];
  sidebar.innerHTML = `
    <button class="mobile-close" data-mobile="close" aria-label="Close panel">${icon("close")}</button>
    <section class="sidebar-section problem-summary">
      <span class="eyebrow">Current problem</span>
      <h1>${escapeHtml(graph?.problem?.title || graph?.problem?.id || "No valid graph")}</h1>
      ${graph?.problem?.statement ? `<span class="problem-statement math-text">${mathHtml(graph.problem.statement)}</span>` : ""}
    </section>
    <section class="sidebar-section">
      <label class="search-box">${icon("search")}<input value="${escapeAttribute(state.query)}" placeholder="Search graph" aria-label="Search graph"><button data-action="clear-search" aria-label="Clear search" style="visibility:${state.query ? "visible" : "hidden"}">${icon("close", 14)}</button></label>
    </section>
    <section class="sidebar-section">
      <div class="section-heading"><span>Layers</span>${icon("layers")}</div>
      <div class="filter-list">
        ${NODE_TYPES.map((type) => `<label class="filter-row"><input type="checkbox" data-filter="${type}" ${state.filters.has(type) ? "checked" : ""}><span class="type-dot ${type}"></span><span>${TYPE_LABELS[type]}</span><span class="count">${graph?.nodes?.filter((node) => node.type === type).length ?? 0}</span></label>`).join("")}
      </div>
    </section>
    <section class="sidebar-section path-section">
      <div class="section-heading"><span>Solution paths</span>${icon("branch")}</div>
      ${goals.length ? `<label class="goal-picker-label" for="proof-goal">Target goal
        <select id="proof-goal" data-goal aria-label="Select proof goal">
          ${goals.map((goal) => `<option value="${escapeAttribute(goal.id)}" ${goal.id === chosenGoal?.id ? "selected" : ""}>${escapeHtml(goal.id)}</option>`).join("")}
        </select></label>` : ""}
      ${paths.length ? paths.map((path, index) => `<button class="path-card ${state.activePath === index ? "active" : ""}" data-path="${index}"><span class="path-number">${String(index + 1).padStart(2, "0")}</span><span><strong>Path ${index + 1}</strong><small>${path.edgeIds.size} inferences · ${path.nodeIds.size} assertions</small></span>${icon("right")}</button>`).join("") : `<p class="empty-note">No complete proof path reaches this goal.</p>`}
    </section>
    <button class="load-example" data-action="example">${icon("spark")} Reload example</button>`;
}

function renderWorkspace() {
  if (state.report.errors.length) {
    workspace.innerHTML = `<div class="validation-panel"><span class="error-icon">${icon("warning", 26)}</span><span class="eyebrow">Validation stopped</span><h2>The graph needs attention</h2><p>Fix the referenced YAML fields, then open the file again. No data has left your browser.</p><div class="validation-list">${state.report.errors.map((item) => `<div><code>${escapeHtml(item.path)}</code><span>${escapeHtml(item.message)}</span></div>`).join("")}</div><button class="primary-action" data-action="upload">${icon("upload")}Choose another YAML</button></div>`;
    return;
  }

  const graph = state.report.graph;
  const visual = buildVisualGraph(graph, state.filters, state.query);
  const goal = currentGoal(graph);
  const paths = goal ? enumerateProofPaths(graph, goal.id) : [];
  const selectedPath = state.activePath === null ? null : paths[state.activePath];
  workspace.innerHTML = `<div class="canvas-meta"><span><i class="live-dot"></i> Graph workspace</span><span>${visual.nodes.filter((node) => node.visualType === "assertion").length} assertions · ${visual.nodes.filter((node) => node.visualType === "method").length} inferences</span></div>
    <div class="graph-context-cards" role="group" aria-label="Graph reference cards">
      ${contextCardsHtml(graph, state.selection, escapeHtml)}
    </div>
    <div class="graph-viewport">
    <div class="canvas-tools"><button data-action="zoom-in" aria-label="Zoom in">${icon("plus")}</button><button data-action="zoom-out" aria-label="Zoom out">${icon("minus")}</button><button data-action="fit" aria-label="Fit graph">${icon("fit")}</button></div>
    ${visual.nodes.length ? graphWorldHtml(visual, selectedPath) : `<div class="empty-canvas">${icon("search", 24)}<span>No matching graph elements</span></div>`}
  </div>`;
  requestAnimationFrame(() => {
    if (!state.view.x) fitGraph(visual);
    else applyView();
    bindPanZoom(visual);
  });
}

function graphWorldHtml(visual, selectedPath) {
  const activeNode = (id) => !selectedPath || selectedPath.nodeIds.has(id);
  const activeEdge = (id) => !selectedPath || selectedPath.edgeIds.has(id);
  const links = visual.links.map((link) => {
    if (!link.from || !link.to) return "";
    const x1 = link.from.x;
    const y1 = link.from.y + (link.from.visualType === "method" ? 27 : 45);
    const x2 = link.to.x;
    const y2 = link.to.y - (link.to.visualType === "method" ? 27 : 45);
    const mid = (y1 + y2) / 2;
    return `<path class="${activeEdge(link.edgeId) ? "" : "dimmed"}" d="M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}" marker-end="url(#arrow)"></path>`;
  }).join("");
  const nodes = visual.nodes.map((node) => {
    const style = `left:${node.x}px;top:${node.y}px`;
    if (node.visualType === "method") {
      const selected = state.selection?.type === "edge" && state.selection.id === node.id;
      return `<button class="method-node ${selected ? "selected" : ""} ${activeEdge(node.id) ? "" : "dimmed"}" style="${style}" data-select-type="edge" data-select-id="${escapeAttribute(node.id)}" title="${escapeAttribute(node.method)}">${icon("branch", 14)}<span>${escapeHtml(node.method)}</span></button>`;
    }
    const selected = state.selection?.type === "node" && state.selection.id === node.id;
    return `<button class="assertion-node ${node.type} ${selected ? "selected" : ""} ${activeNode(node.id) ? "" : "dimmed"}" style="${style}" data-select-type="node" data-select-id="${escapeAttribute(node.id)}"><span class="node-topline"><em>${node.type}</em><small>${escapeHtml(node.id)}</small></span><span class="node-claim math-text">${mathHtml(node.claim)}</span></button>`;
  }).join("");
  return `<div class="graph-world" style="width:${visual.width}px;height:${visual.height}px"><svg class="links" width="${visual.width}" height="${visual.height}" viewBox="0 0 ${visual.width} ${visual.height}"><defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker></defs>${links}</svg>${nodes}</div>`;
}

function renderInspector() {
  const graph = state.report.graph;
  const selection = state.selection;
  if (!graph || !selection) {
    inspector.innerHTML = `<button class="mobile-close" data-mobile="close">${icon("close")}</button><div class="inspector-empty">${icon("fit", 22)}<p>Select an assertion or inference to inspect it.</p></div>`;
    return;
  }
  const item = selection.type === "node" ? graph.nodes?.find((node) => node.id === selection.id) : graph.edges?.find((edge) => edge.id === selection.id);
  if (!item) {
    inspector.innerHTML = `<button class="mobile-close" data-mobile="close">${icon("close")}</button><div class="inspector-empty"><p>This item is hidden or unavailable.</p></div>`;
    return;
  }
  inspector.innerHTML = `<button class="mobile-close" data-mobile="close">${icon("close")}</button>${selection.type === "node" ? nodeInspector(graph, item) : edgeInspector(graph, item)}`;
}

function nodeInspector(graph, node) {
  const incoming = graph.edges.filter((edge) => edge.to === node.id);
  const outgoing = graph.edges.filter((edge) => edge.from.includes(node.id));
  return `<div class="inspector-content"><div class="inspector-kicker"><span class="type-dot ${node.type}"></span>${node.type} assertion</div><h2 class="math-text">${mathHtml(node.claim)}</h2>${copyId(node.id)}${node.scope ? detail("Scope / local assumptions", mathHtml(formatValue(node.scope)), "important") : ""}${detail("Proof dependencies", `${linkList("Incoming", incoming, "edge")}${linkList("Outgoing", outgoing, "edge")}`)}</div>`;
}

function edgeInspector(graph, edge) {
  const sources = edge.from.map((id) => graph.nodes.find((node) => node.id === id)).filter(Boolean);
  const target = graph.nodes.find((node) => node.id === edge.to);
  const theorems = (edge.uses ?? []).map((id) => graph.theorems.find((theorem) => theorem.id === id)).filter(Boolean);
  const mistakes = getRelatedMistakes(graph, edge.id);
  return `<div class="inspector-content"><div class="inspector-kicker edge">${icon("branch", 14)}inference</div><h2>${escapeHtml(edge.method)}</h2>${copyId(edge.id)}${detail("From · all required", linkList("", sources, "node"), "important")}${detail("To", linkList("", target ? [target] : [], "node"), "important")}${detail("Justification", mathHtml(edge.justification), "important")}${edge.obligations ? detail("Check these obligations", mathHtml(formatValue(edge.obligations)), "important") : ""}${theorems.length ? detail("Theorems", theorems.map((theorem) => `<article class="theorem-card"><strong>${escapeHtml(theorem.id)}</strong><span class="math-text">${mathHtml(theorem.statement)}</span>${Array.isArray(theorem.required_hypotheses) && theorem.required_hypotheses.length ? `<div class="hypotheses-list"><strong>Required hypotheses</strong>${theorem.required_hypotheses.map((h) => `<span class="math-text">${mathHtml(h)}</span>`).join("")}</div>` : ""}${theorem.source ? `<small>${escapeHtml(theorem.source)}</small>` : ""}</article>`).join("")) : ""}${mistakes.length ? detail("Common mistakes", mistakes.map((mistake) => `<article class="mistake-card"><span>${icon("warning", 14)}${escapeHtml(mistake.category)}</span><span class="math-text">${mathHtml(mistake.pattern)}</span><small>${mathHtml(mistake.defect)}</small></article>`).join("")) : ""}</div>`;
}

function detail(title, content, priority = "") { return `<section class="detail-block ${priority}"><h3>${escapeHtml(title)}</h3>${content}</section>`; }
function copyId(id) { return `<button class="copy-id" data-copy="${escapeAttribute(id)}">#${escapeHtml(id)}</button>`; }
function linkList(label, items, type) {
  return `<div class="link-list">${label ? `<small>${label}</small>` : ""}${items.length ? items.map((item) => `<button data-select-type="${type}" data-select-id="${escapeAttribute(item.id)}"><span>${escapeHtml(item.method || item.id)}</span>${icon("right", 14)}</button>`).join("") : `<em>None</em>`}</div>`;
}

function loadSource(source, name) {
  state.report = parseGraphYaml(source);
  state.fileName = name;
  state.activePath = null;
  state.goalId = state.report.graph?.nodes?.find((node) => node.type === "goal")?.id ?? null;
  state.view = { x: 0, y: 42, scale: 1 };
  state.selection = state.report.errors.length ? { type: "validation", id: "report" } : { type: "context", id: "problem" };
  render();
}

async function loadFile(file) {
  if (!file) return;
  if (!/\.ya?ml$/i.test(file.name)) {
    state.report = { graph: null, warnings: [], errors: [{ path: "file", message: "Choose a .yaml or .yml file." }] };
    state.fileName = file.name;
    render();
    return;
  }
  loadSource(await file.text(), file.name);
}

function bindPanZoom(visual) {
  const viewport = workspace.querySelector(".graph-viewport");
  if (!viewport) return;
  let pan = null;
  viewport.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    pan = { id: event.pointerId, x: event.clientX, y: event.clientY, originX: state.view.x, originY: state.view.y };
    viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener("pointermove", (event) => {
    if (!pan || pan.id !== event.pointerId) return;
    state.view.x = pan.originX + event.clientX - pan.x;
    state.view.y = pan.originY + event.clientY - pan.y;
    applyView();
  });
  viewport.addEventListener("pointerup", () => { pan = null; });
  viewport.addEventListener("wheel", (event) => {
    event.preventDefault();
    zoom(event.deltaY > 0 ? .92 : 1.08);
  }, { passive: false });
  workspace.querySelector('[data-action="fit"]')?.addEventListener("click", () => fitGraph(visual));
}

function fitGraph(visual) {
  const rect = workspace.querySelector(".graph-viewport")?.getBoundingClientRect();
  if (!rect) return;
  state.view.scale = Math.max(.35, Math.min(1.05, (rect.width - 56) / visual.width, (rect.height - 74) / visual.height));
  state.view.x = (rect.width - visual.width * state.view.scale) / 2;
  state.view.y = 42;
  applyView();
}

function zoom(factor) {
  state.view.scale = Math.min(1.9, Math.max(.3, state.view.scale * factor));
  applyView();
}

function applyView() {
  const world = workspace.querySelector(".graph-world");
  if (world) world.style.transform = `translate(${state.view.x}px, ${state.view.y}px) scale(${state.view.scale})`;
}

root.addEventListener("click", async (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "upload") fileInput.click();
  if (action === "clear-search") { state.query = ""; render(); }
  if (action === "example") loadSource(sampleGraphYaml, "example-graph.yaml");
  if (action === "zoom-in") zoom(1.15);
  if (action === "zoom-out") zoom(.87);
  const selection = event.target.closest("[data-select-id]");
  if (selection) {
    state.selection = { type: selection.dataset.selectType, id: selection.dataset.selectId };
    if (state.selection.type === "node") {
      const selectedNode = state.report.graph?.nodes?.find((node) => node.id === state.selection.id);
      if (selectedNode?.type === "goal" && selectedNode.id !== state.goalId) {
        state.goalId = selectedNode.id;
        state.activePath = null;
      }
    }
    state.mobilePanel = window.innerWidth <= 760 ? "inspector" : state.mobilePanel;
    render();
  }
  const path = event.target.closest("[data-path]");
  if (path) { const index = Number(path.dataset.path); state.activePath = state.activePath === index ? null : index; render(); }
  const mobile = event.target.closest("[data-mobile]")?.dataset.mobile;
  if (mobile) { state.mobilePanel = mobile === "close" ? null : mobile; render(); }
  const copy = event.target.closest("[data-copy]");
  if (copy) {
    await navigator.clipboard?.writeText(copy.dataset.copy);
    const original = copy.textContent;
    copy.textContent = `✓ ${copy.dataset.copy}`;
    setTimeout(() => { copy.textContent = original; }, 1200);
  }
});

root.addEventListener("input", (event) => {
  if (event.target.matches(".search-box input")) {
    state.query = event.target.value;
    state.activePath = null;
    state.view.x = 0;
    renderWorkspace();
    const clear = sidebar.querySelector('[data-action="clear-search"]');
    if (clear) clear.style.visibility = state.query ? "visible" : "hidden";
  }
});

root.addEventListener("change", (event) => {
  if (event.target.matches("[data-goal]")) {
    state.goalId = event.target.value;
    state.activePath = null;
    render();
    return;
  }
  if (event.target.matches("[data-filter]")) {
    const type = event.target.dataset.filter;
    event.target.checked ? state.filters.add(type) : state.filters.delete(type);
    state.activePath = null;
    render();
  }
});

fileInput.addEventListener("change", () => loadFile(fileInput.files[0]));
shell.addEventListener("dragover", (event) => { event.preventDefault(); overlay.hidden = false; });
shell.addEventListener("dragleave", (event) => { if (!shell.contains(event.relatedTarget)) overlay.hidden = true; });
shell.addEventListener("drop", (event) => { event.preventDefault(); overlay.hidden = true; loadFile(event.dataTransfer.files[0]); });
window.addEventListener("resize", () => { if (window.innerWidth > 760) setInspectorWidth(inspector.getBoundingClientRect().width); if (window.innerWidth > 760 && state.mobilePanel) { state.mobilePanel = null; render(); } });

function mathHtml(value) { return renderMath(value, window.katex); }
function formatValue(value) { return Array.isArray(value) ? value.join(" · ") : typeof value === "object" ? JSON.stringify(value) : String(value); }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]); }
function escapeAttribute(value) { return escapeHtml(value).replace(/`/g, "&#096;"); }
function icon(name, size = 16) {
  const paths = {
    atlas: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/>',
    file: '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5"/>',
    shield: '<path d="M12 2l8 3v6c0 5-3.4 8.2-8 11-4.6-2.8-8-6-8-11V5z"/><path d="M8 12l2.5 2.5L16 9"/>',
    warning: '<path d="M12 3L2 21h20z"/><path d="M12 9v5M12 18h.01"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M16 16l5 5"/>',
    layers: '<path d="M12 3L3 8l9 5 9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/>',
    branch: '<circle cx="6" cy="5" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="19" r="2"/><path d="M7.5 6.5L11 17M16.5 7.5L13 17"/>',
    right: '<path d="M9 18l6-6-6-6"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
    spark: '<path d="M12 2l1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
    fit: '<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',
  };
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name] ?? ""}</svg>`;
}

render();
