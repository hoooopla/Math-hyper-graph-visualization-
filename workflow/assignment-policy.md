# Assignment-scoped theorem and justification policy

This is a **workflow contract**, not part of canonical `graph.yaml`.
Every assignment in an instructor-owned repository may have its own
`assignments/<assignment-id>/policy.yaml`. The file records only explicit
instructor decisions for that assignment. Earlier assignments are evidence
about course progress, **not authorization for later assignments**.

## Why an early checkpoint?

1. Read all problems and reference material. Identify their hypotheses,
   main *candidate* strategies and likely named theorems or nonroutine steps.
   Verify candidate theorem statements/hypotheses enough to formulate a
   meaningful question. **Do not generate complete graph YAML yet.**
2. Deduplicate candidate dependencies across problems; present one
   assignment-wide table with:
   - provisional theorem/step ID and precise result;
   - affected problem IDs and proposed method;
   - required mathematical hypotheses and whether their applicability is
     known, uncertain or needs proof;
   - suggested `cite`, `derive` or `exclude`, explicitly unapproved.
3. **Stop for an explicit instructor response before graph commits.** Ask
   whether otherwise implicit arguments must be written out, too. Do not
   turn a suggestion, prior assignment, or silence into approval.
4. After decisions, produce `policy.yaml` **only for confirmed items**.
   Build the full graph subject to those decisions, adversarially verify
   it, validate the canonical YAML, and submit a reviewable PR with
   `policy.yaml`, per-problem `graph.yaml` and `verification.md`.
5. During development, if a *new* theorem/step, changed theorem statement,
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
workspace; create the real file only after receiving the instructor's
decisions. Each decision has:

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
  Canonical graph fields remain unchanged. This policy is interpreted by
  the GPT Work workflow; the website does not enforce it.
- Do not use this file for student grades, submissions or auditing.
