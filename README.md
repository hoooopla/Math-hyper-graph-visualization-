# Proof Atlas

A dependency-free, client-side viewer for mathematical solution hypergraphs expressed as YAML. Uploaded files never leave the browser.

## Run locally

```bash
npm run dev
```

Then open <http://127.0.0.1:4173>.

## Verify

```bash
npm run check
```

Phase 1 supports YAML upload and drag-and-drop, schema/reference validation, explicit AND-hyperedge rendering, node and inference inspection, theorem and mistake details, filters, search, path highlighting, zoom/pan, readable LaTeX source, and a responsive dark-mode layout.

## Canonical YAML contract (v1.0)

The authoritative mathematical format is documented in the private
[Math-homework-audit repository](https://github.com/hoooopla/Math-homework-audit/blob/main/SCHEMA.md).
This viewer also bundles a copy at `schema/solution-graph.schema.json`.

- Use `schema_version: "1.0"`, `nodes[].assertion`, and
  `theorems[].required_hypotheses`.
- Write **inline LaTeX** as `$A+B=C$`.
- Write **display LaTeX** as `\\[ A+B=C \\]` in YAML literal blocks (`|-`).
- Use YAML single-quoted scalars or literal blocks so backslashes survive
  without double-escaping.
- Inferences are AND-hyperedges: `edges[].from` is a nonempty list of
  prerequisite node IDs, `edges[].to` is one conclusion.
- `claim` and `\\( ... \\)` remain accepted only for legacy uploads.
- The full mathematical statement, edge justification, theorem hypotheses,
  and known mistakes render in the clickable dark-mode inspector.

### Test and build

Run `npm run check` (Node.js 20+). It validates the parser, graph structure,
math rendering, and static-site build. This is a schema/structural check;
mathematical soundness still requires independent proof verification.

For the current Analysis I graphs, upload any
`analysis-I-homework-I/problem-{I,II,III,IV,V}/graph.yaml` from the homework
repository; the browser parses each without requiring a server.
