# Solution hypergraph YAML — canonical v1.0

This repository uses one **canonical** YAML representation for a mathematical proof
hypergraph. The normative structural schema is
[`schema/solution-graph.schema.json`](schema/solution-graph.schema.json).
The public [Proof Atlas](https://hoooopla.github.io/proof-atlas/) viewer consumes the same
format. The graph is mathematical data, not a grading or UI-layout document.

## Required top-level keys

`schema_version`, `problem`, `canonical_notation`, `theorems`,
`nodes`, `edges`, `mistakes`.

- **Nodes** are a list of `{id, type, assertion}`. The node `type` is
  `premise`, `milestone`, or `goal`. Use **`assertion`**, not `claim`.
- **Edges** are a list of `{id, from, to, method, justification}` where
  `from` is a *nonempty list* of simultaneously required premise node IDs
  (AND). Different edges leading to the same conclusion are alternatives (OR).
  Optional fields include `uses` (theorem IDs), `obligations`, and `scope`.
- **Theorems** are a list of `{id, statement}`, optionally with
  `required_hypotheses` (list) and `source`. Do not invent citations.
  `edges[].uses` names mathematical theorem dependencies;
  `required_hypotheses` names mathematical assumptions, **not whether a
  course permits citing the result without proof**. Instructor decisions
  (cite / derive / exclude) belong in
  `assignments/<assignment-id>/policy.yaml` **directly inside the
  assignment directory**, alongside problem folders—not in a separate
  `policies/` folder—outside the solution-graph schema, and are referenced
  in each problem's `verification.md` with precise scope. Obtain explicit
  decisions early, before generating full proof graphs; request approval
  for new dependencies discovered later before committing affected routes.
  **Every** theorem listed in a graph must have an approved policy
  decision covering that problem folder and the same theorem statement.
  Every direct `edges[].uses` citation requires effective treatment
  `cite`; `derive` and `exclude` cannot be invoked without proof.
  Run `scripts/validate_policies.py` as a separate permission check;
  it does not prove theorem applicability or verify actual instructor
  evidence.
- **Mistakes** are a list of `{id, related_edges, pattern, defect, category}`.
  Mistakes annotate invalid or incomplete reasoning, never valid proof edges.
  No grading points or penalties.
- Mathematical scope and temporary assumptions must be explicit when relevant.
  IDs are stable across revisions. All referenced node, theorem, and edge IDs
  must resolve.

## Math notation conventions

- **Inline:** `$A+B=C$`.
- **Display:** `\[ A+B=C \]`, preferably on separate lines.
- For LaTeX-containing scalars, use YAML single quotes or a literal block
  (`|-`) to avoid escaping backslashes. YAML double-quoted strings require
  `\\` for each TeX backslash.
- Do **not** use legacy `\( ... \)` notation in canonical graph files.
  The viewer still accepts it in older imported YAML files for compatibility.
- Use `assertion` uniformly; `claim` is a legacy viewer alias only.

## Minimal example

```yaml
schema_version: "1.0"
problem:
  id: "LA_HW04_Q2"
  statement: |-
    Let $A,B$ be positive definite Hermitian matrices with $AB=BA$.
    Prove:
    \[
    \sqrt A\sqrt B=\sqrt B\sqrt A.
    \]
canonical_notation:
  A: 'A positive definite Hermitian matrix.'
  B: 'A positive definite Hermitian matrix.'
theorems:
  - id: THM_SIMULT_DIAG
    statement: 'Commuting Hermitian matrices are simultaneously unitarily diagonalizable.'
    required_hypotheses:
      - '$A$ and $B$ are Hermitian.'
      - '$AB=BA$.'
nodes:
  - id: N0_GIVEN
    type: premise
    assertion: '$A,B>0$ and $AB=BA$.'
  - id: N1_DIAG
    type: milestone
    assertion: 'There is one unitary basis in which $A$ and $B$ are diagonal.'
  - id: N2_GOAL
    type: goal
    assertion: |-
      \[
      \sqrt A\sqrt B=\sqrt B\sqrt A.
      \]
edges:
  - id: E1_DIAG
    from: [N0_GIVEN]
    to: N1_DIAG
    method: "Simultaneous diagonalization"
    uses: [THM_SIMULT_DIAG]
    justification: 'The hypotheses of THM_SIMULT_DIAG hold.'
  - id: E2_ROOTS
    from: [N1_DIAG]
    to: N2_GOAL
    method: "Take positive diagonal square roots"
    justification: |-
      The positive square roots are represented by diagonal matrices
      in the common unitary basis, hence commute.
mistakes:
  - id: M1_BASES
    related_edges: [E1_DIAG]
    category: invalid_inference
    pattern: 'Diagonalize $A$ and $B$ independently and assume the bases agree.'
    defect: 'Separate diagonalization does not establish a common basis.'
```

## Validation

The instructor workspace runs two separate checks:
`python scripts/validate_graphs.py` for graph structure and
`python scripts/validate_policies.py` for recorded assignment-local
theorem permission. The latter uses a **separate**
`schema/assignment-policy.schema.json`, without modifying canonical
solution-graph v1.0.

The JSON Schema verifies the *shape* of the graph. The viewer additionally
checks duplicate IDs, references, AND-reachability of goals, and dependency
cycles. Neither check substitutes for a mathematical verification of each
inference. The YAML and graph IDs are the source of truth; the viewer constructs
layout and LaTeX rendering separately. **Do not generate or maintain
`visualization.md`**: the interactive graph is computed directly from
`graph.yaml` by Proof Atlas. Existing Mermaid markdown diagrams are legacy,
non-authoritative artifacts. Changes to verified mathematics should be
reviewed independently of format-only migrations.
