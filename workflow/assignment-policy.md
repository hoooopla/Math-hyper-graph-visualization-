# Assignment-scoped theorem and justification policy

This is a **workflow contract**, not part of canonical `graph.yaml`.
Every assignment in an instructor-owned repository has **exactly one**
`policy.yaml` for its solution graphs, **directly inside that assignment
folder**, alongside the problem subfolders:
```text
assignments/
  HW01/
    policy.yaml             # same assignment folder, no policies/ subfolder
    P01/graph.yaml
    P01/verification.md
    P02/graph.yaml
    P02/verification.md
```
Do not create a separate `policies/` directory or put policy files in
individual problem folders. The assignment folder name must match
`policy.assignment_id`; problem scope IDs are **problem folder names**
(e.g. `P01`), even if `graph.problem.id` is more descriptive. The file records only explicit
instructor decisions for that assignment. Earlier assignments are evidence
about course progress, **not authorization for later assignments**.

## Why an early checkpoint?

1. Read all problems and reference material. Identify their hypotheses,
   main *candidate* strategies and likely named theorems or nonroutine steps
   **independently before consulting student submissions**.
   Verify candidate theorem statements/hypotheses enough to formulate a
   meaningful question. **Do not generate complete graph YAML yet.**
2. **Optional, explicitly instructor-authorized discovery:** Before
   the one checkpoint, review student submissions in the private
   instructor context according to `prompts/preaudit-discovery.md`.
   Broadly screen submissions, cluster methods, inspect unusual
   mathematical ideas and record exact coverage in a de-identified
   `discovery.md`. Combine independently investigated theorem/step
   candidates with the preliminary list. Do not grade students or
   automatically accept student arguments. Skip entirely without
   instructor opt-in or supplied submissions.
3. Deduplicate candidate dependencies across problems; present one
   assignment-wide table with:
   - provisional theorem/step ID and precise result;
   - affected problem IDs and proposed method;
   - required mathematical hypotheses and whether their applicability is
     known, uncertain or needs proof;
   - suggested `cite`, `derive` or `exclude`, explicitly unapproved.
4. **Stop for an explicit instructor response before graph commits.** Ask
   whether otherwise implicit arguments must be written out, too. Do not
   turn a suggestion, prior assignment, or silence into approval.
5. After decisions, produce `policy.yaml` **only for confirmed items**.
   Build the full graph subject to those decisions, adversarially verify
   it, validate the canonical YAML, and submit a reviewable PR with
   `policy.yaml`, per-problem `graph.yaml` and `verification.md`.
6. During development, if a *new* theorem/step, changed theorem statement,
   changed use/scope, or conflicting problem-specific requirement arises,
   **stop only the affected route(s)**, present a delta decision table,
   obtain explicit approval, update the assignment policy, and reverify
   the dependent edges and proof paths. Keep unaffected approved material
   and decisions intact.

## Decisions and scope

- **cite:** the theorem may be invoked directly *within the approved
  problem scope*, provided every mathematical hypothesis actually holds.
- **derive:** the proof must establish the result with appropriate
  argument; a bare external invocation is not sufficient.
- **exclude:** do not invoke the result as an unproved theorem; use an
  independent route or an explicitly permitted derivation.
- A missing decision means **pending**, never `cite` by default.
- Instructions about how much detail to show in a particular nonroutine
  inference can also be represented as `kind: step`.
- Course authorization and mathematical applicability are independent.
  Neither gives automatic verification of the other.

## File format

Start from `templates/assignment-policy.template.yaml` in the private
workspace; create the real file in the **same assignment directory**
only after receiving the instructor's decisions. Each decision has:

| Field | Meaning |
| --- | --- |
| `id` | Stable theorem ID or provisional step ID; reconcile later with graph IDs |
| `kind` | `theorem` or `step` |
| `statement` | Precise mathematical result or justification requirement |
| `treatment` | `cite`, `derive`, or `exclude` |
| `problems` | Explicit problem IDs; `["*"]` only if instructor authorizes the whole assignment |
| `approval_evidence` | The actual instructor response/link and scope; never invented |

`problem_overrides` entries contain `problem_id`, `item_id`,
`treatment` and `approval_evidence`. An override takes precedence **only**
for the specified problem; otherwise use the approved entry applicable to
that problem. A problem with no applicable entry has no permission to cite.
An override must be explicitly approved; do not synthesize one based on
difficulty or earlier policy. Avoid two conflicting decisions with the same
effective scope and item ID.

Example *illustrating structure only* (not an approved policy):

```yaml
assignment_id: HW03
decisions:
  - id: THM_HEINE_BOREL
    kind: theorem
    statement: 'A subset of Euclidean space is compact iff closed and bounded.'
    treatment: cite
    problems: [P01, P02]
    approval_evidence: 'Instructor explicitly approved for HW03 P01/P02 in [conversation reference]'
  - id: STEP_LIMIT_INTERCHANGE
    kind: step
    statement: 'Interchanging the limit and integral must be justified.'
    treatment: derive
    problems: [P02]
    approval_evidence: 'Instructor explicitly required justification for HW03 P02 in [conversation reference]'
problem_overrides:
  - problem_id: P02
    item_id: THM_HEINE_BOREL
    treatment: derive
    approval_evidence: 'Instructor specifically required a proof in HW03 P02 in [conversation reference]'
```

The bracketed evidence above is a placeholder, **not a real approval**.
Never commit it as if it were an instructor-approved policy.

## Reuse across assignments

Previous `policy.yaml` files can explain which results were taught,
which kinds of argument were expected and what may be worth suggesting.
They do **not** transfer approval. Ask afresh for the current assignment.
Within the same assignment, use an exact existing approval for its
recorded theorem statement, affected problems and course-dependent step;
ask only about uncovered or changed dependencies.

## Reporting and change control

- Keep one `policy.yaml` per assignment. A single theorem appearing in
  multiple problems should normally be approved once with explicit scope.
- In each `verification.md`, refer to relevant policy item IDs and
  problem-specific overrides. Record uncertain applicability and unresolved
  review questions there; do not duplicate the full assignment table.
- Instructor decisions must be recorded before committing a graph or
  an expanded policy that claims approval. A GitHub PR is proposed for
  **review**, not proof of final instructor approval or a merge command.
- The policy is intentionally **not** part of `schema/solution-graph.schema.json`.
  Canonical graph fields remain unchanged. The instructor workspace now
  **enforces recorded permissions in CI** with an independent validator.
  The browser viewer itself does not enforce theorem permissions.
- Do not use this file for student grades, submissions or auditing.

## Enforced policy-compliance check

Before committing any new or changed graph or assignment policy, run:

```sh
python scripts/validate_graphs.py
python scripts/validate_policies.py
```

The first command validates canonical graph structure and references. The
second checks **every** `assignments/<assignment-id>/<problem-dir>/graph.yaml`
against that same assignment folder's `policy.yaml`. Both are required
CI checks in the instructor-owned workspace.

The policy validator rejects:

- missing, malformed, ambiguously duplicated, or misplaced `policy.yaml`;
- mismatch of `assignment_id` and assignment directory;
- missing instructor decision for **any theorem declared in
  `graph.theorems`**, whether or not currently cited;
- theorem statement different from its approved statement (except
  whitespace), and theorem permissions outside approved problem folders;
- any direct `edges[].uses` invocation whose effective treatment is
  `derive`, `exclude`, or pending, including applicable problem overrides;
- duplicate/conflicting decisions or overrides, and blank or obvious
  placeholder `approval_evidence`.

`derive`: represent the proof by **mathematical nodes and justified
edges** instead of an external `edges[].uses` citation. A `theorems[]`
entry with treatment `derive` may describe the result but cannot be
cited as an external theorem. A theorem with treatment `exclude` likewise
cannot be invoked directly; preferably omit unused excluded results
from the canonical graph. A theorem approved `cite` still needs all
mathematical hypotheses checked independently.

The validator can inspect **recorded declarations and citations only**.
It cannot prove a derivation, confirm theorem hypotheses, verify the
authenticity of approval evidence, or detect hidden theorem invocations
written in prose. Instructor judgment and independent mathematical
verification remain mandatory. The validator has its own
`schema/assignment-policy.schema.json`; it does **not** modify the
canonical graph v1.0 schema.

The public synthetic example under `examples/` is deliberately outside
the assignment policy gate. When no `assignments/*/*/graph.yaml` exists,
the separate policy validator reports zero assignment graphs and succeeds;
it **fails closed** when a real assignment graph lacks its sibling
assignment-local policy.
