# Math Homework Audit — instructions for mathematical-proof agents

Proof Atlas is the **public canonical software/workflow repository**.
Real homework assignments, student submissions, and course decisions belong in
an **instructor-owned private workspace**, not this public repository.
When copied into that workspace, these instructions apply to that instructor's
own repository. Never write to the publisher's private repositories.


For any task that generates, audits, edits, or validates solution hypergraph YAML
in this repository:

1. Read [SCHEMA.md](SCHEMA.md), [the JSON Schema](schema/solution-graph.schema.json),
   and [the graph validator](scripts/validate_graphs.py) from the current branch
   **before** producing or modifying `graph.yaml`. The files in Git are the
   format authority, not examples or previous chat messages.
2. Follow canonical YAML schema v1.0: lists of nodes, edges, theorems,
   mistakes; `nodes[].assertion` (not `claim`); nonempty
   `edges[].from`; stable IDs; explicit premise/scope dependencies.
3. Write math as `$...$` inline and `\[...\]` for displays, using single
   quotes or literal YAML blocks to preserve LaTeX backslashes.
4. Independently verify mathematical claims and every AND-hyperedge. Never
   treat successful schema validation as proof correctness.
5. Run `python scripts/validate_graphs.py` and resolve all structural errors.
   If execution is unavailable, report that fact instead of asserting success.
6. Preserve instructor-approved proof content and IDs. Make amendments via
   reviewable diffs/PRs; do not silently overwrite or merge verified mathematics.

For Stage 1 graph generation from problem PDFs, follow both
[prompts/generate-solution-graph.md](prompts/generate-solution-graph.md) and
[prompts/verify-solution-graph.md](prompts/verify-solution-graph.md).

**Pre-commit instructor gate:** After independent mathematical analysis, show
one deduplicated list of proposed theorems and course-dependent justification
steps. Ask whether each theorem may be **cited**, must be **derived/proved**, or
must be **excluded**. Do not commit a new or changed `graph.yaml` (nor open
a graph-containing PR) until the instructor explicitly answers or confirms an
applicable existing policy. If no answer is available, stop with the questions;
never treat silence as approval. Recheck affected proofs after the answers.
The `uses` and `required_hypotheses` fields express mathematical dependencies,
**not** course-level theorem permissions.

Write `verification.md` as an **exception-focused instructor decision report**:
track the course decisions, pending questions, identified defects and aggregate
AI verification/structural-validation status with precise graph IDs. Avoid
repeating every successful proof path or inference already in the YAML.

For every problem, deliver exactly the canonical `graph.yaml` and mathematical
`verification.md` as the standard per-problem outputs. Do **not** create or
update `visualization.md` or any separate Mermaid proof map: Proof Atlas renders
the visualization directly from `graph.yaml`.

Do not proceed to student auditing unless explicitly requested in a later stage.
