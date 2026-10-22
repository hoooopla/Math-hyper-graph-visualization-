# GPT Work — Generate and verify solution hypergraphs

Use this prompt when a problem PDF is supplied, optionally with instructor
solutions or an existing canonical graph. This is **Stage 1 only**: no student
submission auditing.

## Task for GPT Work

You are a mathematical proof analyst working on
**the instructor's own copy of this workflow repository**, selected in GPT Work.

**Before generating or modifying files:**

1. Read the repository's current `AGENTS.md`, `SCHEMA.md`,
   `schema/solution-graph.schema.json`, `scripts/validate_graphs.py`,
   and **`prompts/verify-solution-graph.md`** directly from GitHub.
   They are the authoritative and versioned format contract.
   Do not rely on an older memorized schema.
2. Read the supplied problem PDF and any reference solutions; extract the
   exact hypotheses and conclusions, noting ambiguous notation and the source
   page(s). If existing `graph.yaml` or `verification.md` files are
   present for a problem, inspect them before proposing changes.

**Mathematical work:**

3. Independently derive the main natural proof strategies. Verify instructor
   solutions rather than assuming they are correct. Include materially
   different methods without redundant variants.
4. Construct a directed AND/OR hypergraph:
   - Nodes are mathematical assertions, not methods; distinguish `premise`,
     `milestone`, and `goal`. Use stable IDs and `assertion`, not `claim`.
   - Each edge has `id`, **nonempty** `from`, `to`, `method`, and
     `justification`; all `from` nodes are required together. Incoming
     alternative edges to one target represent OR.
   - Add `uses` with theorem IDs and `obligations` or `scope` when
     needed. Record definitional assumptions explicitly instead of inventing
     an empty-premise edge. Do not silently discharge local assumptions.
   - Theorems must have precise statements and hypotheses; never fabricate
     sources. Mistakes must contain `id`, `related_edges`, `pattern`,
     `defect`, and `category`, and must not be represented as valid edges.
5. Perform an *independent adversarial pass* on every assertion and inference:
   check domains, quantifiers, scope, theorem hypotheses, missing cases,
   reachability, circularity, and counterexamples. Differentiate genuine
   errors, incomplete justifications, and acceptable implicit steps. Flag
   unresolved issues explicitly. Never equate structural validation with
   proof correctness. Follow `prompts/verify-solution-graph.md`: thoroughly
   verify the mathematics, but do not duplicate successful proofs in the report.

**Mandatory instructor checkpoint — before committing any `graph.yaml`:**

- Inventory the named/substantial theorems and proof-dependent lemmas in all
  candidate solutions, together with any steps whose required degree of
  explanation is course-dependent. Include exact/provisional theorem and edge
  IDs, relevant problems, mathematical applicability and sources where known.
- Present **one consolidated table** for the assignment and request instructor
  decisions: **Cite** (allowed directly), **Derive** (prove/justify inside
  the solution), or **Exclude** (not an allowed unproved invocation). Ask if
  any otherwise implicit steps require explicit arguments.
- The instructor's course permission is distinct from a theorem's mathematical
  hypotheses. `edges[].uses` and `theorems[].required_hypotheses` record
  mathematical dependencies; they do **not** confer course permission.
- **Pause for an explicit response. Do not commit or open a graph-containing
  PR while the checkpoint is pending.** Do not assume consent from silence.
  An existing instructor policy can be reused only for its stated scope;
  summarize applicable decisions and ask about new/ambiguous items.
- Once answered, revise the proposed solution paths to comply, re-verify all
  affected mathematics, and re-open the checkpoint if a new theorem requiring
  judgment is introduced. The detailed procedure and reporting convention are
  specified in `prompts/verify-solution-graph.md`.

**Serialization contract (mandatory):**

6. Write YAML strictly according to the repository's canonical v1.0 format.
   The exact required top-level keys are:
   `schema_version`, `problem`, `canonical_notation`, `theorems`,
   `nodes`, `edges`, `mistakes`.
   - Inline mathematics: `$A+B=C$`.
   - Display mathematics: `\[ A+B=C \]`.
   - For TeX strings, use YAML single quotes or literal block scalars
     (`|-`) to preserve backslashes. Never use legacy `\( ... \)`.
   - Keep `nodes`, `edges`, `theorems`, and `mistakes` as lists.
   - Do not include scoring points, penalties, or UI/layout information.
   - Referenced node, theorem, and edge IDs must resolve.

**Deliverables and acceptance gate:**

7. **Only after resolving the instructor checkpoint**, prepare
   `<assignment>/<problem>/graph.yaml` and
   `<assignment>/<problem>/verification.md` as the two standard per-problem
   deliverables. Use the focused report format in
   `prompts/verify-solution-graph.md`: instructor decisions and pending
   questions, compact AI verification summary and material exceptions, and
   structural validation/review status. Reference exact graph IDs; do not
   reproduce the full proofs or list every successful inference. Do **not** generate, update, or maintain `visualization.md` or a
   separate Mermaid proof map. Proof Atlas renders graphs on demand from
   `graph.yaml` without an additional visualization file.
8. Validate the approved candidate **before committing its graph YAML**.
   Run `python scripts/validate_graphs.py` from the repository root after
   installing `PyYAML` and `jsonschema` if needed. Fix **all** reported
   parsing, schema, reference, and reachability errors; rerun until the
   validator passes. If executing the validator is unavailable, clearly say
   so, provide the unverified YAML, and do **not** claim validation passed.
   Also check that the interactive viewer can import the YAML when feasible.
9. Commit `graph.yaml` only after explicit instructor theorem/argument
   decisions and mathematical/structural verification. For new files, use a
   descriptive branch/pull request for review. For an existing graph,
   preserve human-verified nodes, edges and IDs; submit a *minimal proposed
   patch* rather than overwriting approved content. No unapproved drafts or
   placeholder graphs should be committed. Do not merge mathematical changes
   without instructor approval.

**While the checkpoint is pending:** Stop after showing the theorem/argument
inventory and asking the instructor for decisions; do not claim the graph
was committed. **After approval:** Link to the YAML, verification report,
and pull request (if applicable), and distinguish (a) structurally validated,
(b) mathematically verified, (c) course policy confirmed and (d) final
instructor graph approval still needed. Stop here.
Do not audit student homework.

## How to invoke

Open GPT Work, connect **your own** repository created from the public starter, attach the problems PDF, and say:

> Generate and verify solution hypergraphs for this PDF in
> my own GitHub repository (the repo containing these workflow files).
> First read `AGENTS.md`, `prompts/generate-solution-graph.md`,
> `prompts/verify-solution-graph.md`, `SCHEMA.md`, and the JSON schema.
> Before committing any graph YAML, show me a theorem-use/justification
> table and ask which theorems may be cited, must be proved, or are excluded.
> After I answer, finish mathematical verification, validate YAML, and
> propose a pull request. Do not audit student submissions.
