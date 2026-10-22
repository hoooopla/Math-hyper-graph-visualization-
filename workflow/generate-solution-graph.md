# GPT Work — Generate and verify solution hypergraphs

Use this prompt with a problem PDF, optionally instructor solutions or an
existing canonical graph. This is **solution-graph generation only**, not
student submission auditing. Operate in the instructor's own repository,
never in the public Proof Atlas software repository.

## First: read the pinned contract

Read these files from the **current instructor repository**, not memory:
`AGENTS.md`, `SCHEMA.md`, `schema/solution-graph.schema.json`,
`scripts/validate_graphs.py`, `prompts/verify-solution-graph.md`,
`prompts/assignment-policy.md`, and
`templates/assignment-policy.template.yaml`.
Inspect any existing assignment policy, problem graphs and verification
reports before proposing changes. If access fails, say so explicitly.

## Phase A — inexpensive preliminary analysis (before full proof generation)

1. Extract the exact mathematical statements, hypotheses, conclusions,
   notation, problem IDs, PDF locations and ambiguities. Reference
   solutions require verification, not unquestioning acceptance.
2. For **each problem**, identify the main natural candidate approaches.
   Sketch their essential ideas and likely proof-dependent lemmas, rather
   than writing complete proofs or creating graph YAML.
3. Compile one **deduplicated assignment-wide candidate inventory** of
   substantial theorems, lemmas and nonroutine steps whose required degree
   of justification depends on instructor policy. State precise/provisional
   mathematical claims, intended uses, candidate IDs, affected problems,
   required hypotheses, known applicability versus unknowns, and reliable
   sources when known. Investigate enough to avoid asking about an
   incorrectly stated or inapplicable theorem, but do not do a full
   adversarial graph verification at this phase.
4. Read earlier assignments only for **historical context** and optional
   recommendations about what students may have learned. **Never import
   their permissions into this assignment.** Reuse only explicit decisions
   already confirmed for this *same assignment*, matching exact scope and
   theorem statement.
5. Present a **single consolidated checkpoint table** with suggested
   treatment `Cite / Derive / Exclude` and an empty instructor-decision
   column for all new/uncovered items. Ask about nonroutine implicit
   justifications. **Pause for an explicit response.** No complete proof
   graph or graph-containing commit/PR before the checkpoint is resolved.

The instructor chooses:
- **Cite** — invoke directly *if* mathematical assumptions apply.
- **Derive** — include an adequate mathematical derivation, not a bare cite.
- **Exclude** — do not use as an unproved invocation; seek another route.

A missing, partial or ambiguous response **is not approval**. Exclude
unresolved routes from the proposed approved graph or stop if essential.
For an already existing assignment policy, show which exact approvals
cover candidate uses and request decisions only for uncovered uses.

## Phase B — construct and rigorously verify after the checkpoint

6. Record **only explicit approvals** and their actual evidence and scope in
   `assignments/<assignment-id>/policy.yaml`, following
   `prompts/assignment-policy.md` and the template. Use one policy per
   assignment, with a precise statement and affected problem IDs for every
   item; record explicitly approved problem overrides where necessary.
   Do not invent approval quotes, dates, or sources. The template itself is
   not an approval.
7. Independently derive and adversarially check the main natural solution
   strategies compliant with the policy. Capture materially different
   methods, not redundant variants. Check references and instructor
   solutions independently.
8. Construct a directed **AND/OR solution hypergraph** for each problem:
   - Nodes are precise assertions: `premise`, `milestone`, `goal`;
     stable descriptive IDs and field `assertion`, not `claim`.
   - Each edge has `id`, a **nonempty** `from` list (jointly required
     AND), `to`, `method`, and `justification`. Alternative incoming
     edges give OR. No hidden assumptions or empty-source edges.
   - Theorem applications belong in `edges[].uses`, mathematical
     hypotheses in `theorems[].required_hypotheses`, local conditions in
     `scope`/`obligations`. Mathematical theorem dependencies are
     **separate from course permission** in `policy.yaml`.
   - Record precise theorem statements with trustworthy references and
     common mistakes (`id`, `related_edges`, `pattern`, `defect`,
     `category`). Mistakes are not valid proof edges. No grading points.
9. Independently verify each node, hyperedge, theorem application,
   quantifier, local scope, case split, cycle and complete path. Seek
   counterexamples; distinguish actual errors, incomplete arguments and
   acceptable implicit reasoning. Structural validation is never proof
   correctness. Follow `prompts/verify-solution-graph.md` for an
   exception-focused report, not repeated successful proofs.

## Checkpoint B — newly discovered dependencies only

If full proof development introduces an unapproved theorem/step, changes
the mathematical statement of an approved theorem, exceeds the approved
problem scope, or adds a conflicting local requirement:
- **Stop the affected routes** and show a concise *delta table* describing
  what changed, the exact mathematical need and suggested decision.
- Reuse existing **same-assignment** approvals without re-asking.
- Obtain explicit new instructor decisions; update only the relevant
  `policy.yaml` entries, preserving previous approvals.
- Reverify affected mathematical nodes, edges and complete proof paths.
  Never imply that silence or an earlier assignment authorized the change.

## Serialization, validation and delivery

10. The canonical graph v1.0 has exactly the required keys
    `schema_version`, `problem`, `canonical_notation`, `theorems`,
    `nodes`, `edges`, `mistakes`. Follow the JSON Schema and
    `SCHEMA.md` exactly. Use `$...$` inline and `\\[...\\]` display math;
    TeX strings should use YAML single quotes or literal blocks, not
    legacy `\\(...\\)`.
11. Use the layout:
    `assignments/<assignment-id>/policy.yaml`
    `assignments/<assignment-id>/<problem-id>/graph.yaml`
    `assignments/<assignment-id>/<problem-id>/verification.md`.
    Keep the policy outside `graph.yaml`; it is **not** part of the
    solution-graph JSON Schema. Each per-problem report references
    applicable policy entries, records unresolved issues and independently
    verified versus unchecked claims, and reports structural validation
    accurately. Do not create `visualization.md` or a separate graph.
12. Run `python scripts/validate_graphs.py`; fix errors and rerun. If
    execution is unavailable, **say so**; do not claim it passed. Check
    viewer import when feasible. Never confuse structural validity,
    AI mathematical verification, theorem policy approval or final
    instructor graph approval.
13. **Only after the instructor explicitly resolves the necessary policy
    decisions** and the mathematical checks, commit the scoped
    `policy.yaml`, per-problem `graph.yaml` and `verification.md` to
    a reviewable GitHub PR in the instructor-owned repository. Preserve
    approved IDs/content and propose minimal diffs. Do **not merge**
    mathematical changes without instructor approval. No student audit.

If checkpoint A or B is pending, **stop at the decision table** and
request an answer; do not commit any unapproved draft graph.

## Invocation

In GPT Work, connect the instructor-owned repository and attach the
problem PDF. Ask:

> For this assignment, first inventory the likely theorem dependencies
> from preliminary strategies and show one Cite / Derive / Exclude table.
> Do not build or commit full graph YAML until I respond. Prior
> assignments are historical context, not permission. After approval,
> save assignments/<assignment>/policy.yaml, construct and independently
> verify the hypergraphs, and propose a PR. Ask only about *new* dependencies
> discovered later. Do not audit student submissions.
