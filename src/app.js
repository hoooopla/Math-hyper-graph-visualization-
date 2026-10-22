import { buildVisualGraph, enumerateProofPaths, getRelatedMistakes, NODE_TYPES, parseGraphYaml, validateGraph } from "./graph-core.js?v=cycle-safe-layout-v1";
import { sampleGraphYaml } from "./sampleGraph.js?v=canonical-sample-v1";
import { renderMath } from "./math-render.js";
import { contextCardsHtml, contextInspectorHtml } from "./context-ui.js";
import { serializeYaml, compareGraphs, changeRequest } from "./review-core.js";
import { edgeFingerprint, nodeFingerprint, pathFingerprint, pathKey, reviewState, sourceKey, validReviewState } from "./verification-core.js";
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
  sidebarCollapsed: localStorage.getItem("proof-atlas-sidebar-collapsed") === "true",
  documents: [],
  activeDocument: null,
  compare: null,
  exportOpen: false,
  showIds: localStorage.getItem("proof-atlas-show-ids") === "true",
};

root.innerHTML = `
  <main class="app-shell">
    <header class="topbar"></header>
    <div class="tabbar" role="tablist" aria-label="Open graphs"></div>
    <aside class="sidebar"></aside>
    <section class="workspace"></section>
    <div class="inspector-resizer" role="separator" aria-label="Resize details panel" aria-orientation="vertical" tabindex="0" aria-valuemin="300" aria-valuemax="900" aria-valuenow="420" title="Drag to resize details panel"></div>
    <aside class="inspector"></aside>
    <nav class="mobile-nav" aria-label="Mobile panels">
      <button data-mobile="sidebar">${icon("layers")} Explore</button>
      <button data-action="upload">${icon("upload")} Upload</button>
      <button data-mobile="inspector">${icon("info")} Inspect</button>
    </nav>
    <input id="yaml-file" hidden type="file" multiple accept=".yaml,.yml,text/yaml">
    <div class="drop-overlay" hidden>${icon("upload", 28)}<strong>Drop YAML to inspect</strong><span>Nothing is uploaded to a server</span></div>
    <div class="workflow-overlay" hidden>
      <div class="workflow-scrim" data-action="close-workflow"></div>
      <section class="workflow-dialog" role="dialog" aria-modal="true" aria-labelledby="workflow-title">
        <button class="workflow-close" data-action="close-workflow" aria-label="Close workflow guide">${icon("close", 20)}</button>
        <span class="eyebrow">Instructor onboarding</span>
        <h2 id="workflow-title">Start a Math Homework Audit workspace</h2>
        <p>Use your own GitHub repository and GPT Work. Proof Atlas only displays and edits local YAML; AI tasks run in your GPT Work session.</p>
        <ol>
          <li>Copy the setup instructions into GPT Work and connect <strong>your own</strong> GitHub repository.</li>
          <li>Attach a problem PDF. GPT Work will ask which theorems may be cited, derived, or excluded <strong>before committing</strong>.</li>
          <li>Review each proposed YAML and verification report in your own repository. Keep student submissions private.</li>
        </ol>
        <label for="workflow-prompt">Copy into GPT Work</label>
        <textarea id="workflow-prompt" readonly spellcheck="false" aria-label="GPT Work setup prompt" placeholder="Loading instructions…"></textarea>
        <p class="workflow-message" role="status" aria-live="polite"></p>
        <div class="workflow-actions">
          <button class="upload-button" data-action="copy-workflow" disabled>Copy prompt</button>
          <a class="header-action" href="https://github.com/hoooopla/Math-hyper-graph-visualization-/blob/main/docs/GETTING_STARTED.md" target="_blank" rel="noopener noreferrer">Setup guide ↗</a>
          <a class="header-action" href="https://github.com/hoooopla/Math-hyper-graph-visualization-" target="_blank" rel="noopener noreferrer">Source ↗</a>
        </div>
      </section>
    </div>
  </main>`;

const shell = root.querySelector(".app-shell");
const topbar = root.querySelector(".topbar");
const tabbar = root.querySelector(".tabbar");
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
const workflowModal = root.querySelector(".workflow-overlay");
const workflowPrompt = root.querySelector("#workflow-prompt");
const workflowMessage = root.querySelector(".workflow-message");
const workflowCopy = root.querySelector('[data-action="copy-workflow"]');
let workflowLoaded = false;

async function showWorkflow() {
  workflowModal.hidden = false;
  workflowModal.querySelector(".workflow-close").focus();
  if (workflowLoaded) return;
  workflowMessage.textContent = "Loading the public workflow prompt…";
  try {
    const response = await fetch("./prompts/start-with-gpt-work.md");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    workflowPrompt.value = (await response.text()).trim();
    workflowCopy.disabled = !workflowPrompt.value;
    workflowMessage.textContent = "Use this prompt in your own GPT Work conversation.";
    workflowLoaded = true;
  } catch {
    workflowMessage.textContent = "Could not load the setup prompt. Open prompts/start-with-gpt-work.md in the public GitHub repository.";
  }
}

function hideWorkflow() {
  workflowModal.hidden = true;
  topbar.querySelector('[data-action="start-workflow"]')?.focus();
}


function render() {
  shell.classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
  renderHeader();
  renderTabs();
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
    <button class="sidebar-toggle" data-action="toggle-sidebar" aria-label="${state.sidebarCollapsed ? "Show left panel" : "Hide left panel"}" aria-pressed="${state.sidebarCollapsed}">${icon(state.sidebarCollapsed ? "panel-open" : "panel-close")}<span>${state.sidebarCollapsed ? "Show panel" : "Hide panel"}</span></button>
    <button class="header-action start-workflow-cta" data-action="start-workflow" aria-haspopup="dialog">${icon("branch", 14)}<span>Start Workflow</span></button>
    <div class="file-chip">${icon("file")}<span>${escapeHtml(state.fileName)}</span></div>
    <button type="button" class="status-chip ${valid ? "valid" : "invalid"}" data-select-type="validation" data-select-id="report" aria-label="Inspect structural validation results">
      ${icon(valid ? "shield" : "warning")}<span>${valid ? `Valid · ${state.report.warnings.length} warnings` : `${state.report.errors.length} errors`}</span>
    </button>
    <button class="header-action ${state.compare ? "active" : ""}" data-action="compare" ${state.documents.length < 2 ? "disabled title=\"Open another YAML to compare\"" : ""}>Compare</button>
    <button class="header-action" data-action="export">Export</button>
    <button class="upload-button" data-action="upload">${icon("upload")}<span>Open YAML</span></button>`;
}

function activeDoc() { return state.documents.find((doc) => doc.key === state.activeDocument); }
function saveVerification(doc = activeDoc()) {
  doc.report.graph.review_state = reviewState(doc);
  try { localStorage.setItem(sourceKey(doc.source), JSON.stringify(doc.report.graph.review_state)); } catch { /* YAML export still carries the marks. */ }
}
function pathVerified(doc, goalId, path) {
  return doc.verification.paths.get(pathKey(goalId, path)) === pathFingerprint(doc.report.graph, path);
}
function renderTabs() {
  tabbar.innerHTML = state.documents.map((doc) => `<button role="tab" aria-selected="${doc.key === state.activeDocument}" class="graph-tab ${doc.key === state.activeDocument ? "active" : ""}" data-tab="${doc.key}" title="${escapeAttribute(doc.name)}">${escapeHtml(doc.name)}${compareGraphs(doc.originalGraph, doc.report.graph).changes.length || doc.comments.length ? `<span class="tab-dot" aria-label="Draft changes"></span>` : ""}</button>`).join("") + `<button class="tab-add" data-action="upload" aria-label="Add YAML files">＋</button>`;
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
      ${paths.length ? paths.map((path, index) => `<div class="path-row"><button class="path-card ${state.activePath === index ? "active" : ""}" data-path="${index}"><span class="path-number">${String(index + 1).padStart(2, "0")}</span><span><strong>Path ${index + 1} ${pathVerified(activeDoc(), chosenGoal.id, path) ? icon("check", 13) : ""}</strong><small>${path.edgeIds.size} inferences · ${path.nodeIds.size} assertions</small></span>${icon("right")}</button><label class="verify-path" title="Mark path ${index + 1} verified"><input type="checkbox" data-verify-path="${index}" aria-label="Path ${index + 1} verified" ${pathVerified(activeDoc(), chosenGoal.id, path) ? "checked" : ""}><span>Verified</span></label></div>`).join("") : `<p class="empty-note">No complete proof path reaches this goal.</p>`}
    </section>
    <button class="load-example" data-action="example">${icon("spark")} Reload example</button>`;
}

function renderWorkspace() {
  if (state.exportOpen) {
    const doc = activeDoc();
    const request = changeRequest(doc);
    workspace.innerHTML = `<div class="review-screen"><div class="review-heading"><span class="eyebrow">Handoff review</span><h2>Export ${escapeHtml(doc.name)}</h2><p>Review changes and comments before downloading. The full graph preserves a clear starting point for GPT Work.</p></div><div class="review-summary">${request.changes.length} graph changes · ${request.comments.length} comments · ${request.review_state.verified_nodes.length} verified nodes · ${request.review_state.verified_edges.length} verified inferences · ${request.review_state.verified_paths.length} verified paths · ${state.report.errors.length} validation errors</div>${changeListHtml(compareGraphs(doc.originalGraph, doc.report.graph), "draft")}${request.comments.map((c) => `<div class="review-row"><strong>Comment · ${escapeHtml(c.type)} ${escapeHtml(c.id)} · ${escapeHtml(c.field)}</strong><p>${escapeHtml(c.text)}</p></div>`).join("")}<div class="export-actions"><button class="primary-action" data-action="download-yaml" ${state.report.errors.length ? "disabled" : ""}>Download complete YAML</button><button class="header-action" data-action="download-request">Download change request</button><button class="header-action" data-action="export">Back to graph</button></div></div>`;
    return;
  }
  if (state.compare) {
    const before = state.documents.find((doc) => doc.key === state.compare.before);
    const after = state.documents.find((doc) => doc.key === state.compare.after);
    const diff = before?.report.graph && after?.report.graph ? compareGraphs(before.report.graph, after.report.graph) : { changes: [], affected: [] };
    workspace.innerHTML = `<div class="review-screen"><div class="review-heading"><span class="eyebrow">Version comparison</span><h2>Review what changed</h2><div class="compare-pickers"><label>Previous<select data-compare="before">${state.documents.map((doc) => `<option value="${doc.key}" ${doc.key === state.compare.before ? "selected" : ""}>${escapeHtml(doc.name)}</option>`).join("")}</select></label><label>Revised<select data-compare="after">${state.documents.map((doc) => `<option value="${doc.key}" ${doc.key === state.compare.after ? "selected" : ""}>${escapeHtml(doc.name)}</option>`).join("")}</select></label></div></div>${before?.report.errors.length || after?.report.errors.length ? `<p class="compare-warning">Fix structural errors in both files before comparing.</p>` : `<div class="review-summary">${diff.changes.length} changed items · ${diff.affected.length} dependent items to reconsider</div>${changeListHtml(diff, "compare")}`}</div>`;
    return;
  }
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
    <div class="canvas-tools"><button data-action="zoom-in" aria-label="Zoom in">${icon("plus")}</button><button data-action="zoom-out" aria-label="Zoom out">${icon("minus")}</button><button data-action="fit" aria-label="Fit graph">${icon("fit")}</button><button class="id-toggle ${state.showIds ? "active" : ""}" data-action="toggle-ids" aria-label="${state.showIds ? "Hide" : "Show"} graph IDs" aria-pressed="${state.showIds}">IDs</button></div>
    ${visual.nodes.length ? graphWorldHtml(visual, selectedPath) : `<div class="empty-canvas">${icon("search", 24)}<span>No matching graph elements</span></div>`}
  </div>`;
  requestAnimationFrame(() => {
    if (!state.view.x) fitGraph(visual);
    else applyView();
    bindPanZoom(visual);
  });
}

function changeListHtml(diff, mode) {
  if (!diff.changes.length && !diff.affected.length) return `<p class="empty-note">No semantic changes found.</p>`;
  return `<div class="review-list">${diff.changes.map((change) => `<button class="review-row ${state.selection?.type === "difference" && state.selection.id === change.key ? "selected" : ""}" data-difference="${escapeAttribute(change.key)}"><span class="change-status ${change.status}">${change.status}</span><strong>${escapeHtml(change.kind)} · ${escapeHtml(change.id)}</strong><small>${escapeHtml(change.fields.join(", ") || "Entire item")}</small></button>`).join("")}${mode === "compare" ? diff.affected.map((key) => `<button class="review-row affected" data-difference="${escapeAttribute(key)}"><span class="change-status affected">affected</span><strong>${escapeHtml(key)}</strong><small>Dependency changed; check this result again</small></button>`).join("") : ""}</div>`;
}

function graphWorldHtml(visual, selectedPath) {
  const activeNode = (id) => !selectedPath || selectedPath.nodeIds.has(id);
  const activeEdge = (id) => !selectedPath || selectedPath.edgeIds.has(id);
  const selectedNodeId = state.selection?.type === "node" ? state.selection.id : null;
  const incoming = new Set(state.report.graph.edges.filter((edge) => edge.to === selectedNodeId).map((edge) => edge.id));
  const outgoing = new Set(state.report.graph.edges.filter((edge) => edge.from.includes(selectedNodeId)).map((edge) => edge.id));
  const links = visual.links.map((link) => {
    if (!link.from || !link.to) return "";
    const x1 = link.from.x;
    const y1 = link.from.y + (link.from.visualType === "method" ? 27 : 45);
    const x2 = link.to.x;
    const y2 = link.to.y - (link.to.visualType === "method" ? 27 : 45);
    const mid = (y1 + y2) / 2;
    const selectedEdge = state.selection?.type === "edge" && state.selection.id === link.edgeId;
    const role = selectedEdge ? (link.from.visualType === "method" ? "selected-outgoing" : "selected-incoming")
      : incoming.has(link.edgeId) ? "selected-incoming"
      : outgoing.has(link.edgeId) ? "selected-outgoing" : "";
    return `<path class="${activeEdge(link.edgeId) ? "" : "dimmed"} ${role}" d="M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}" marker-end="url(#${role === "selected-incoming" ? "arrow-in" : role === "selected-outgoing" ? "arrow-out" : "arrow"})"></path>`;
  }).join("");
  const nodes = visual.nodes.map((node) => {
    const style = `left:${node.x}px;top:${node.y}px`;
    if (node.visualType === "method") {
      const selected = state.selection?.type === "edge" && state.selection.id === node.id;
      const verified = activeDoc().verification.edges.get(node.id) === edgeFingerprint(state.report.graph, node.id);
      return `<button class="method-node ${state.showIds ? "with-id" : ""} ${verified ? "is-verified" : ""} ${selected ? "selected" : ""} ${activeEdge(node.id) ? "" : "dimmed"}" style="${style}" data-select-type="edge" data-select-id="${escapeAttribute(node.id)}" title="${escapeAttribute(node.method)}">${icon("branch", 14)}<span class="method-label">${escapeHtml(node.method)}</span>${state.showIds ? `<small class="method-id">${escapeHtml(node.id)}</small>` : ""}${verified ? `<span class="verified-badge" role="img" aria-label="Verified" title="Verified">${icon("check", 12)}</span>` : ""}</button>`;
    }
    const selected = state.selection?.type === "node" && state.selection.id === node.id;
    const edge = state.selection?.type === "edge" ? state.report.graph.edges.find((item) => item.id === state.selection.id) : null;
    const role = edge?.from.includes(node.id) ? "source-highlight" : edge?.to === node.id ? "target-highlight" : "";
    const verified = activeDoc().verification.nodes.get(node.id) === nodeFingerprint(state.report.graph, node.id);
    return `<button class="assertion-node ${node.type} ${selected ? "selected" : ""} ${role} ${activeNode(node.id) ? "" : "dimmed"}" style="${style}" data-select-type="node" data-select-id="${escapeAttribute(node.id)}"><span class="node-topline"><em>${node.type}</em>${verified ? `<span class="verified-badge" role="img" aria-label="Verified" title="Verified">${icon("check", 12)}</span>` : ""}</span>${state.showIds ? `<small class="graph-id">${escapeHtml(node.id)}</small>` : ""}<span class="node-claim math-text">${mathHtml(node.claim)}</span></button>`;
  }).join("");
  return `<div class="graph-world" style="width:${visual.width}px;height:${visual.height}px"><svg class="links" width="${visual.width}" height="${visual.height}" viewBox="0 0 ${visual.width} ${visual.height}"><defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker><marker id="arrow-in" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker><marker id="arrow-out" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker></defs>${links}</svg>${nodes}</div>`;
}

function renderInspector() {
  const graph = state.report.graph;
  const selection = state.selection;
  const close = `<button class="mobile-close" data-mobile="close" aria-label="Close details">${icon("close")}</button>`;
  if (state.selection?.type === "difference" && state.compare) {
    inspector.innerHTML = close + differenceInspector(state.selection.id);
    return;
  }
  if (selection?.type === "validation") {
    inspector.innerHTML = close + validationInspectorHtml();
    return;
  }
  if (!graph || !selection) {
    inspector.innerHTML = close + `<div class="inspector-empty"><p>Select a reference card, assertion or inference to inspect it.</p></div>`;
    return;
  }
  const api = { mathHtml, escapeHtml, detail };
  if (selection.type === "context") {
    inspector.innerHTML = close + (selection.id === "problem" ? problemEditor(graph) : contextInspectorHtml(graph, selection.id, api));
    return;
  }
  if (selection.type === "theorem") {
    inspector.innerHTML = close + theoremEditor(graph, selection.id);
    return;
  }
  if (selection.type === "mistake") {
    inspector.innerHTML = close + mistakeInspector(graph, selection.id);
    return;
  }
  const item = selection.type === "node"
    ? graph.nodes?.find((node) => node.id === selection.id)
    : graph.edges?.find((edge) => edge.id === selection.id);
  if (!item) {
    inspector.innerHTML = close + `<div class="inspector-empty"><p>This item is hidden or unavailable.</p></div>`;
    return;
  }
  inspector.innerHTML = close + (selection.type === "node" ? nodeInspector(graph, item) : edgeInspector(graph, item));
}

function editable(kind, id, field, label, value, multiline = true) {
  const text = Array.isArray(value) ? value.join("\n") : String(value ?? "");
  const attr = `data-edit-kind="${escapeAttribute(kind)}" data-edit-id="${escapeAttribute(id)}" data-edit-field="${escapeAttribute(field)}"`;
  return `<label class="editable-field"><span>${escapeHtml(label)}</span>${multiline ? `<textarea rows="${Math.max(3, Math.min(7, text.split("\n").length + 1))}" ${attr}>${escapeHtml(text)}</textarea>` : `<input value="${escapeAttribute(text)}" ${attr}>`}<div class="edit-preview math-text">${mathHtml(text) || "<em>Empty</em>"}</div></label>`;
}
function commentBox(type, id, field = "general") {
  const doc = activeDoc();
  const comments = doc.comments.filter((item) => item.type === type && item.id === id);
  return `<section class="comment-block"><h3>Review comments</h3>${comments.map((item) => `<div class="comment-item"><strong>${escapeHtml(item.field)}</strong><p>${escapeHtml(item.text)}</p><button data-remove-comment="${item.key}" aria-label="Remove comment">×</button></div>`).join("")}<label>Field<select data-comment-field>${["general", "claim", "method", "justification", "statement", "pattern", "defect", "required_hypotheses", "obligations"].map((option) => `<option ${option === field ? "selected" : ""}>${option}</option>`).join("")}</select></label><textarea data-comment-text placeholder="What should GPT Work check or change?"></textarea><button class="header-action" data-add-comment="${escapeAttribute(type)}:${escapeAttribute(id)}">Add comment</button></section>`;
}
function problemEditor(graph) {
  return `<div class="inspector-content"><div class="inspector-kicker">Reference · problem</div>${editable("problem", "problem", "title", "Title", graph.problem?.title, false)}${editable("problem", "problem", "statement", "Statement", graph.problem?.statement)}${commentBox("problem", "problem", "statement")}</div>`;
}
function theoremEditor(graph, id) {
  const item = graph.theorems.find((entry) => entry.id === id);
  if (!item) return `<div class="inspector-empty">Theorem unavailable.</div>`;
  return `<div class="inspector-content"><div class="inspector-kicker">Theorem</div>${copyId(id)}${editable("theorems", id, "statement", "Statement", item.statement)}${editable("theorems", id, "required_hypotheses", "Required hypotheses · one per line", item.required_hypotheses ?? [])}${editable("theorems", id, "source", "Source", item.source)}${commentBox("theorem", id, "statement")}</div>`;
}
function differenceInspector(key) {
  const before = state.documents.find((doc) => doc.key === state.compare.before)?.report.graph;
  const after = state.documents.find((doc) => doc.key === state.compare.after)?.report.graph;
  const diff = compareGraphs(before, after);
  const change = diff.changes.find((entry) => entry.key === key);
  const [kind, id] = key.split(":");
  const oldItem = change?.before ?? (kind === "problem" || kind === "canonical_notation" ? before?.[kind] : before?.[kind]?.find((item) => item.id === id));
  const newItem = change?.after ?? (kind === "problem" || kind === "canonical_notation" ? after?.[kind] : after?.[kind]?.find((item) => item.id === id));
  const fields = change?.fields ?? [...new Set([...Object.keys(oldItem ?? {}), ...Object.keys(newItem ?? {})])];
  const reviewKey = `${state.compare.before}:${state.compare.after}:${key}`;
  const reviewed = state.documents.find((doc) => doc.key === state.compare.after)?.reviewed.has(reviewKey);
  return `<div class="inspector-content difference-panel"><div class="inspector-kicker">${change?.status ?? "Dependent result"} · ${escapeHtml(kind)}</div><h2>${escapeHtml(id)}</h2>${!change ? `<p class="compare-warning">An upstream dependency changed; reconsider this result.</p>` : ""}${fields.map((field) => `<section class="diff-field"><h3>${escapeHtml(field)}</h3><div class="diff-columns"><div><small>Previous</small><div class="math-text">${mathHtml(formatValue(oldItem?.[field] ?? "—"))}</div></div><div><small>Revised</small><div class="math-text">${mathHtml(formatValue(newItem?.[field] ?? "—"))}</div></div></div></section>`).join("")}<button class="primary-action" data-review="${escapeAttribute(reviewKey)}">${reviewed ? "Reviewed ✓" : "Mark reviewed"}</button></div>`;
}

function validationInspectorHtml() {
  const { errors = [], warnings = [], graph } = state.report;
  const rows = (items) => items.length
    ? `<div class="validation-list inspector-validation-list">${items.map((item) => `<div><code>${escapeHtml(item.path)}</code><span>${escapeHtml(item.message)}</span></div>`).join("")}</div>`
    : `<span class="empty-note">None</span>`;
  return `<div class="inspector-content context-inspector">
    <div class="inspector-kicker">Structural validation</div>
    <h2>${errors.length ? "Action required" : "Graph validation"}</h2>
    ${detail("Errors · " + errors.length, rows(errors), "important")}
    ${detail("Warnings · " + warnings.length, rows(warnings), "important")}
    ${detail("Schema", `<code>${escapeHtml(graph?.schema_version ?? "Unknown")}</code>`)}
    <p class="validation-disclaimer">Schema, reference and reachability checks do not establish mathematical correctness.</p>
  </div>`;
}

function mistakeInspector(graph, id) {
  const mistake = graph.mistakes?.find((item) => item.id === id);
  if (!mistake) return `<div class="inspector-empty"><p>Mistake reference not found.</p></div>`;
  const related = (mistake.related_edges ?? [])
    .map((edgeId) => graph.edges.find((edge) => edge.id === edgeId)).filter(Boolean);
  return `<div class="inspector-content"><div class="inspector-kicker">Common mistake</div>
    ${copyId(mistake.id)}${editable("mistakes", id, "category", "Category", mistake.category, false)}
    ${editable("mistakes", id, "pattern", "Mistaken pattern", mistake.pattern)}
    ${editable("mistakes", id, "defect", "Why it fails", mistake.defect)}
    ${detail("Related inferences", linkList("", related, "edge"))}
    ${commentBox("mistake", id, "pattern")}
  </div>`;
}

function nodeInspector(graph, node) {
  const incoming = graph.edges.filter((edge) => edge.to === node.id);
  const outgoing = graph.edges.filter((edge) => edge.from.includes(node.id));
  const verified = activeDoc().verification.nodes.get(node.id) === nodeFingerprint(graph, node.id);
  return `<div class="inspector-content"><div class="inspector-kicker"><span class="type-dot ${node.type}"></span>${node.type} assertion</div>${copyId(node.id)}<label class="verify-node"><input type="checkbox" data-verify-node="${escapeAttribute(node.id)}" ${verified ? "checked" : ""}><span>${icon("check", 16)} Verified assertion</span></label>${editable("nodes", node.id, "claim", "Claim", node.claim)}${node.scope ? detail("Scope / local assumptions", mathHtml(formatValue(node.scope)), "important") : ""}${detail("Proof dependencies", `${linkList("Incoming", incoming, "edge")}${linkList("Outgoing", outgoing, "edge")}`)}${commentBox("node", node.id, "claim")}</div>`;
}

function edgeInspector(graph, edge) {
  const sources = edge.from.map((id) => graph.nodes.find((node) => node.id === id)).filter(Boolean);
  const target = graph.nodes.find((node) => node.id === edge.to);
  const theorems = (edge.uses ?? []).map((id) => graph.theorems.find((theorem) => theorem.id === id)).filter(Boolean);
  const mistakes = getRelatedMistakes(graph, edge.id);
  const verified = activeDoc().verification.edges.get(edge.id) === edgeFingerprint(graph, edge.id);
  return `<div class="inspector-content"><div class="inspector-kicker edge">${icon("branch", 14)}inference</div>${copyId(edge.id)}<label class="verify-node"><input type="checkbox" data-verify-edge="${escapeAttribute(edge.id)}" ${verified ? "checked" : ""}><span>${icon("check", 16)} Verified inference</span></label>${editable("edges", edge.id, "method", "Method", edge.method, false)}${detail("From · all required", linkList("", sources, "node"), "important")}${detail("To", linkList("", target ? [target] : [], "node"), "important")}${editable("edges", edge.id, "justification", "Justification", edge.justification)}${edge.obligations ? editable("edges", edge.id, "obligations", "Obligations · one per line", edge.obligations) : ""}${edge.scope ? detail("Scope / local assumptions", mathHtml(formatValue(edge.scope)), "important") : ""}${theorems.length ? detail("Theorems", theorems.map((theorem) => `<article class="theorem-card"><button type="button" class="reference-link" data-select-type="theorem" data-select-id="${escapeAttribute(theorem.id)}">${escapeHtml(theorem.id)} ↗</button><span class="math-text">${mathHtml(theorem.statement)}</span></article>`).join("")) : ""}${mistakes.length ? detail("Common mistakes", mistakes.map((mistake) => `<article class="mistake-card"><header class="mistake-header"><span class="mistake-category">${icon("warning", 16)}${escapeHtml(mistake.category)}</span><button type="button" class="reference-link mistake-id" data-select-type="mistake" data-select-id="${escapeAttribute(mistake.id)}">Edit ${escapeHtml(mistake.id)} ↗</button></header><section class="mistake-section"><strong>Mistaken pattern</strong><div class="math-text mistake-pattern">${mathHtml(mistake.pattern)}</div></section><section class="mistake-section defect"><strong>Why it fails</strong><div class="math-text">${mathHtml(mistake.defect)}</div></section></article>`).join("")) : ""}${commentBox("edge", edge.id, "justification")}</div>`;
}

function detail(title, content, priority = "") { return `<section class="detail-block ${priority}"><h3>${escapeHtml(title)}</h3>${content}</section>`; }
function copyId(id) { return `<button class="copy-id" data-copy="${escapeAttribute(id)}">#${escapeHtml(id)}</button>`; }
function linkList(label, items, type) {
  return `<div class="link-list">${label ? `<small>${label}</small>` : ""}${items.length ? items.map((item) => `<button data-select-type="${type}" data-select-id="${escapeAttribute(item.id)}"><span>${escapeHtml(item.method || item.id)}</span>${icon("right", 14)}</button>`).join("") : `<em>None</em>`}</div>`;
}

function loadSource(source, name) {
  const report = parseGraphYaml(source);
  const key = String(Date.now()) + "-" + String(Math.random()).slice(2);
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem(sourceKey(source))); } catch { /* Local storage is optional. */ }
  const verification = report.graph && !report.errors.length ? validReviewState(report.graph, report.graph.review_state ?? stored ?? {}) : { nodes: new Map(), edges: new Map(), paths: new Map() };
  const doc = { key, name, source, originalGraph: report.graph ? structuredClone(report.graph) : null, report, verification, comments: [], reviewed: new Set(), selection: null, view: { x: 0, y: 42, scale: 1 }, goalId: null };
  state.documents.push(doc);
  activateDocument(key);
}

function activateDocument(key) {
  const current = activeDoc();
  if (current) { if (state.selection?.type !== "difference") current.selection = state.selection; current.view = { ...state.view }; current.goalId = state.goalId; }
  const doc = state.documents.find((entry) => entry.key === key);
  if (!doc) return;
  state.activeDocument = key;
  state.report = doc.report;
  state.fileName = doc.name;
  state.activePath = null;
  state.goalId = doc.goalId ?? doc.report.graph?.nodes?.find((node) => node.type === "goal")?.id ?? null;
  state.view = { ...doc.view };
  state.selection = doc.selection ?? (doc.report.errors.length ? { type: "validation", id: "report" } : { type: "context", id: "problem" });
  state.exportOpen = false;
  render();
}

async function loadFiles(files) {
  for (const file of files) if (/\.ya?ml$/i.test(file.name)) loadSource(await file.text(), file.name);
  fileInput.value = "";
}

function updateField(input) {
  const doc = activeDoc(), graph = doc.report.graph;
  const { editKind: kind, editId: id, editField: field } = input.dataset;
  const target = kind === "problem" ? graph.problem : graph[kind]?.find((item) => item.id === id);
  if (!target) return;
  const old = target[field];
  const value = Array.isArray(old) || field === "required_hypotheses"
    ? input.value.split("\n").map((line) => line.trim()).filter(Boolean) : input.value;
  if (JSON.stringify(old) === JSON.stringify(value)) return;
  target[field] = value;
  if (kind === "nodes" && field === "claim") target.assertion = value;
  doc.report = { graph, ...validateGraph(graph) };
  state.report = doc.report;
  doc.reviewed.clear();
  if (!doc.report.errors.length) {
    doc.verification = validReviewState(graph, reviewState(doc));
    saveVerification(doc);
  }
  const scrollTop = inspector.scrollTop;
  render();
  inspector.scrollTop = scrollTop;
}

function downloadText(name, text) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(new Blob([text], { type: "text/yaml;charset=utf-8" }));
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
    zoom(event.deltaY > 0 ? .975 : 1.025, event.clientX, event.clientY);
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

function zoom(factor, clientX, clientY) {
  const viewport = workspace.querySelector(".graph-viewport");
  const rect = viewport?.getBoundingClientRect();
  const oldScale = state.view.scale;
  const newScale = Math.min(1.9, Math.max(.3, oldScale * factor));
  if (newScale === oldScale) return;

  const anchorX = rect && Number.isFinite(clientX) ? clientX - rect.left : (rect?.width ?? 0) / 2;
  const anchorY = rect && Number.isFinite(clientY) ? clientY - rect.top : (rect?.height ?? 0) / 2;
  const worldX = (anchorX - state.view.x) / oldScale;
  const worldY = (anchorY - state.view.y) / oldScale;

  state.view.scale = newScale;
  state.view.x = anchorX - worldX * newScale;
  state.view.y = anchorY - worldY * newScale;
  applyView();
}

function applyView() {
  const world = workspace.querySelector(".graph-world");
  if (world) world.style.transform = `translate(${state.view.x}px, ${state.view.y}px) scale(${state.view.scale})`;
}

root.addEventListener("click", async (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "start-workflow") { await showWorkflow(); return; }
  if (action === "close-workflow") { hideWorkflow(); return; }
  if (action === "copy-workflow") {
    if (!workflowPrompt.value) return;
    try {
      await navigator.clipboard.writeText(workflowPrompt.value);
      workflowMessage.textContent = "Prompt copied. Paste it into GPT Work.";
    } catch {
      workflowPrompt.focus();
      workflowPrompt.select();
      workflowMessage.textContent = "Copy the selected prompt manually.";
    }
    return;
  }
  if (action === "upload") fileInput.click();
  if (action === "compare") {
    state.exportOpen = false;
    state.compare = state.compare ? null : { before: state.documents[0].key, after: state.activeDocument };
    state.selection = state.compare ? { type: "validation", id: "report" } : { type: "context", id: "problem" };
    state.mobilePanel = null;
    render();
  }
  if (action === "export") { state.compare = null; state.exportOpen = !state.exportOpen; if (state.selection?.type === "difference") state.selection = { type: "context", id: "problem" }; state.mobilePanel = null; render(); }
  if (action === "download-yaml" && !state.report.errors.length) {
    try { saveVerification(); downloadText(activeDoc().name.replace(/\.ya?ml$/i, "") + ".updated.yaml", serializeYaml(state.report.graph)); }
    catch (error) { window.alert(error.message); }
  }
  if (action === "download-request") downloadText("change-request.yaml", serializeYaml(changeRequest(activeDoc())));
  const tab = event.target.closest("[data-tab]");
  if (tab) { state.compare = null; activateDocument(tab.dataset.tab); return; }
  const difference = event.target.closest("[data-difference]");
  if (difference) { state.selection = { type: "difference", id: difference.dataset.difference }; if (window.innerWidth <= 760) { state.mobilePanel = "inspector"; inspector.classList.add("mobile-open"); } renderInspector(); workspace.querySelectorAll(".review-row").forEach((row) => row.classList.toggle("selected", row === difference)); return; }
  const review = event.target.closest("[data-review]");
  if (review) {
    const revised = state.documents.find((doc) => doc.key === state.compare.after);
    revised.reviewed.has(review.dataset.review) ? revised.reviewed.delete(review.dataset.review) : revised.reviewed.add(review.dataset.review);
    renderInspector();
    return;
  }
  const addComment = event.target.closest("[data-add-comment]");
  if (addComment) {
    const text = inspector.querySelector("[data-comment-text]")?.value.trim();
    if (text) {
      const [type, ...id] = addComment.dataset.addComment.split(":");
      activeDoc().comments.push({ key: String(Date.now()) + Math.random(), type, id: id.join(":"), field: inspector.querySelector("[data-comment-field]").value, text });
      renderTabs(); renderInspector();
    }
    return;
  }
  const removeComment = event.target.closest("[data-remove-comment]");
  if (removeComment) { activeDoc().comments = activeDoc().comments.filter((item) => item.key !== removeComment.dataset.removeComment); renderTabs(); renderInspector(); return; }
  if (action === "toggle-sidebar") {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    localStorage.setItem("proof-atlas-sidebar-collapsed", String(state.sidebarCollapsed));
    state.view.x = 0;
    render();
  }
  if (action === "clear-search") { state.query = ""; render(); }
  if (action === "toggle-ids") { state.showIds = !state.showIds; localStorage.setItem("proof-atlas-show-ids", String(state.showIds)); renderWorkspace(); }
  if (action === "example") loadSource(sampleGraphYaml, "example-graph.yaml");
  if (action === "zoom-in") zoom(1.15);
  if (action === "zoom-out") zoom(.87);
  const selection = event.target.closest("[data-select-id]");
  if (selection) {
    state.selection = { type: selection.dataset.selectType, id: selection.dataset.selectId };
    if (state.selection.type === "edge" || state.selection.type === "node") state.activePath = null;
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
  if (event.target.matches("[data-edit-field]")) {
    const preview = event.target.closest(".editable-field")?.querySelector(".edit-preview");
    if (preview) preview.innerHTML = mathHtml(event.target.value);
  }
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
  if (event.target.matches("[data-verify-edge]")) {
    const doc = activeDoc(), id = event.target.dataset.verifyEdge;
    event.target.checked ? doc.verification.edges.set(id, edgeFingerprint(doc.report.graph, id)) : doc.verification.edges.delete(id);
    saveVerification(doc); renderWorkspace(); renderInspector(); return;
  }
  if (event.target.matches("[data-verify-node]")) {
    const doc = activeDoc(), id = event.target.dataset.verifyNode;
    event.target.checked ? doc.verification.nodes.set(id, nodeFingerprint(doc.report.graph, id)) : doc.verification.nodes.delete(id);
    saveVerification(doc); renderWorkspace(); renderInspector(); return;
  }
  if (event.target.matches("[data-verify-path]")) {
    const doc = activeDoc(), graph = doc.report.graph, goal = currentGoal(graph);
    const path = enumerateProofPaths(graph, goal.id)[Number(event.target.dataset.verifyPath)];
    if (!path) return;
    const key = pathKey(goal.id, path);
    event.target.checked ? doc.verification.paths.set(key, pathFingerprint(graph, path)) : doc.verification.paths.delete(key);
    saveVerification(doc); renderSidebar(); return;
  }
  if (event.target.matches("[data-edit-field]")) { updateField(event.target); return; }
  if (event.target.matches("[data-compare]")) {
    state.compare[event.target.dataset.compare] = event.target.value;
    state.selection = { type: "validation", id: "report" };
    renderWorkspace(); renderInspector();
    return;
  }
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

root.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !workflowModal.hidden) hideWorkflow();
});

fileInput.addEventListener("change", () => loadFiles([...fileInput.files]));
shell.addEventListener("dragover", (event) => { event.preventDefault(); overlay.hidden = false; });
shell.addEventListener("dragleave", (event) => { if (!shell.contains(event.relatedTarget)) overlay.hidden = true; });
shell.addEventListener("drop", (event) => { event.preventDefault(); overlay.hidden = true; loadFiles([...event.dataTransfer.files]); });
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
    "panel-close": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 9l-3 3 3 3"/>',
    "panel-open": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M12 9l3 3-3 3"/>',
    check: '<path d="M5 12l5 5L19 7"/>',
  };
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name] ?? ""}</svg>`;
}

loadSource(sampleGraphYaml, "example-graph.yaml");
