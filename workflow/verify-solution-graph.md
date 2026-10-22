# Independent verification and instructor-decision workflow

This prompt governs the content of each `verification.md` and the mandatory
**instructor checkpoint before committing a new or revised `graph.yaml`**.
It is invoked by `prompts/generate-solution-graph.md` and applies again
whenever later graph iterations introduce new theorems or justification policies.
Do not audit student submissions unless specifically requested.

## 1. Independently verify the proposed mathematics

Read `AGENTS.md`, `SCHEMA.md`, the JSON Schema, the problem statement,
and any existing graph and verification report. Independently reconstruct
the main arguments instead of trusting a reference solution or earlier AI output.

- Check **every** node, AND-hyperedge, goal path, quantifier, local scope,
  theorem hypothesis, case split, and possible circular dependency.
- Seek counterexamples to questionable implications; correct identifiable
  defects before requesting instructor decisions.
- Check that the main natural proof approaches are represented without
  redundant variants. Keep any unresolved mathematical uncertainty explicit.
- Structural schema validation is not mathematical verification.

This checking process must be thorough, but the written report should be
**exception-focused**: do not repeat every correct assertion, edge or proof
path already visible in `graph.yaml`. Cite exact graph IDs for anything
requiring attention and give a brief aggregate coverage statement instead.

## 2. Mandatory theorem-and-justification checkpoint (BEFORE graph commit)

Before any commit, pull request, or overwrite containing a new or modified
`graph.yaml`, inspect proposed proofs and **show the instructor a consolidated
decision table**. Make draft mathematical analyses locally or in conversation;
do not use a GitHub commit to save an unapproved draft graph.

Inventory every named or substantial external theorem/lemma **actually
proposed for use** in at least one proof route, plus every nontrivial step
whose expected level of explanation may depend on course policy.
Routine algebra can be grouped if there is no plausible course-level issue.
Across multiple problems, deduplicate shared results but show the relevant
problem IDs and provisional or existing theorem/edge IDs.

For each item show:

| Item and affected problems/graph IDs | Exact result or step | Mathematical applicability | Suggested course treatment | Instructor decision |
| --- | --- | --- | --- | --- |
| `THM_...`, `E_...` | Precise statement; source when known | Are its hypotheses met? Why? | Cite / Derive / Exclude | Pending |

Explain the choices:

- **Cite:** The result may be invoked directly, but every application must
  still satisfy its mathematical hypotheses.
- **Derive:** A proof or appropriate justification is required inside the
  solution graph; a bare citation or hidden invocation is insufficient.
- **Exclude:** The result may not be used as an unproved theorem in the
  approved solution routes. Seek a different valid argument.
- **Pending:** The instructor has not decided; do not silently select a
  course policy. Mathematical validity and course admissibility are distinct.

Also ask whether any otherwise routine inferences require an explicit
argument in this assignment. If the user has supplied a policy previously,
show its source/scope and request confirmation only for any new or ambiguous
items; never claim a policy was approved without evidence.

**STOP AND ASK:**

> For each listed theorem or step, which treatment applies: Cite, Derive,
> or Exclude? Are there further results students must prove rather than cite?
> Please confirm the course/assignment scope of your choices. I will not
> commit the graph YAML until this checkpoint is resolved.

No user response means **no graph commit**, not implied permission.
If the user explicitly defers a decision, keep the affected route out of
the proposed approved graph until resolved, or stop if the graph cannot be
completed without it. Preserve existing instructor-approved graph content;
the checkpoint must not overwrite earlier approvals. If later edits add
an unreviewed theorem or a new justification requirement, reopen the gate
for only the new or changed items.

## 3. Apply decisions, then verify the revised graph again

After an explicit instructor reply:

1. Reconcile theorem usage with the approved Cite / Derive / Exclude choices.
2. If Derive was selected, include a mathematically valid proof/derivation
   using nodes and justified hyperedges; avoid circular citations.
3. Exclude unapproved direct theorem-invocation routes from the proposed
   canonical graph; preserve alternative routes that satisfy the policy.
4. Re-run independent mathematical checks on **all affected nodes, edges,
   and paths**, not just the theorem table.
5. Run `python scripts/validate_graphs.py` when execution is available.
   Report accurately whether it was run; correct all failures.
6. Commit the proposed `graph.yaml` and `verification.md` only after this
   gate and validation. Propose changes in a pull request; do not merge
   mathematical changes without instructor approval.

Course permission is not a proof of mathematical correctness; mathematical
verification is not an instructor's course-policy approval.

## 4. Required `verification.md` contents (concise, exception-focused)

Write **one report per problem**, with these sections:

### Instructor decisions and unresolved questions

- Record the decisions actually given, **with scope** (course/assignment/
  problem), exact theorem/edge IDs, and the choice Cite / Derive / Exclude.
- Put remaining instructor questions first, each with a stable `REVIEW_...`
  ID, affected IDs, a concrete question, relevant evidence, and a suggested
  option. Do not present a recommendation as a confirmed decision.
- Record newly arising requirements about implicit steps only if they
  materially affect allowed solutions. Do not duplicate the full theorem
  statements or edge justifications already in `graph.yaml`.
- If no questions remain, write `None pending` explicitly.

### AI verification summary and exceptions

- State which graph revision and how many nodes, edges and goals were
  independently checked; state whether all goals have verified routes.
- Record **only** invalid, incomplete, uncertain, or materially contentious
  items, citing IDs, the mathematical defect/evidence, remediation and status.
- Record missing important strategies only if independently identified;
  do not add routine proof-path summaries or a second copy of the graph.
- If the AI could not check any item, identify it as `not_checked`; do not
  call the graph mathematically verified.

### Structural validation and review status

- Give validator command, execution status and results (or why not executed).
- Separately report mathematical verification, course-policy decisions,
  pending instructor questions, and final graph review/merge status.
- Never label an AI-verified graph `instructor-approved` without an
  explicit instructor decision; code/CI success alone does not suffice.

Keep reports readable and brief when there are no exceptions. Preserve
existing human decisions and stable IDs across iterations. Do not add
grading points, student judgments, or separate `visualization.md` files.

## Example of the pre-commit question

Problem III proposes using `THM_TONELLI` in `E_TONELLI_SECTIONS`.
Mathematically, the integrand is nonnegative and measurable; the
application is valid. **Course decision needed:**

- Cite Tonelli directly?
- Derive the relevant formula without citing it?
- Exclude this method from approved solution routes?

Do not commit the graph until the instructor responds or an applicable
prior explicit policy is confirmed.
