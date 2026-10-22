# Independent verification and assignment-scoped instructor policy

This prompt governs the mathematical checks, the **early assignment-wide
Cite / Derive / Exclude checkpoint**, later incremental policy changes and
each concise `verification.md`. Read `AGENTS.md`, `SCHEMA.md`, the
JSON Schema, `prompts/assignment-policy.md`, the PDF and existing files
before work. Do not audit student work unless explicitly requested.

## 1. Preliminary checkpoint BEFORE complete proof generation

The earliest pass is exploratory, not a completed graph: extract all
problems, identify likely proof strategies **independently of student
answers**, and inventory the substantial
theorems/lemmas and nonroutine implicit steps they might require. Confirm
candidate statements, essential mathematical hypotheses and sources as far
as needed to make an informed question. Mark uncertain applicability rather
than assuming a candidate works; do not require completed proof paths yet.

**Optional pre-audit discovery before asking policy questions:** If the
instructor explicitly supplies/authorizes student submissions and requests
discovery, run `prompts/preaudit-discovery.md` now, after the independent
problem sketch but **before** displaying the instructor checkpoint.
Scan each accessible submission/problem at least briefly when feasible,
cluster distinct approaches, consider representatives and mathematical
outliers, and report exact coverage/unreadable/unreviewed portions. Use
the de-identified `discovery.md` template; do not produce individual
correctness verdicts, grades, student-level summaries or graph mutations.
New candidate theorems or methods from student answers **must be
independently reconstructed** and checked for mathematical plausibility;
frequency of use is not evidence of correctness. If no opt-in, skip
discovery entirely. Do not move the policy checkpoint earlier than
this optional discovery pass.

Deduplicate dependencies across all problems in the **current assignment**.
For each item present:

| Candidate item / affected problems | Precise statement and intended role | Conditions/applicability | Suggested treatment (not approved) | Instructor decision |
| --- | --- | --- | --- | --- |
| `THM_...` / P01, P02 | Theorem + source; proposed strategy | Exact hypotheses; known vs uncertain | Cite / Derive / Exclude | Pending |

Include nonroutine `STEP_...` items if the permitted implicit
justification depends on assignment expectations. Group only genuinely
routine algebra.

Use prior assignments solely as context about course progress. A previous
approval never transfers. An existing decision for **this same assignment**
may cover a proposed use only if the result, treatment and explicit
problem scope match; identify its policy source and ask only about
uncovered or changed items.

**STOP AND ASK** the instructor which items may be **Cited**, must be
**Derived**, or must be **Excluded**, and whether additional steps
must be proved rather than cited or left implicit. Do not commit
a `graph.yaml` or open a graph-containing PR while a necessary
decision is pending. **Pause for an explicit response**, never assume
consent from silence.

Definitions:

- **Cite:** direct invocation allowed in the approved scope, but the
  theorem's mathematical hypotheses must independently be checked.
- **Derive:** supply an actual valid proof/justification, not a bare cite.
- **Exclude:** no unproved invocation of that result; replace the route
  or give a derivation only if instructor permission allows.
- **Pending:** no permission at all; omit the unapproved route or stop
  if it is necessary for a complete solution.

## 2. Persist confirmed decisions for one assignment

After the instructor's response, create or update
`assignments/<assignment-id>/policy.yaml` using the workspace template
and `prompts/assignment-policy.md`.

- Record **only confirmed** items, exact theorem/step statements, affected
  problem IDs, the Cite / Derive / Exclude choice, and actual source of
  instructor approval. Never invent an approval reference or date.
- A problem-level exception overrides an assignment-level entry **only**
  if explicitly approved for that exact problem.
- Never infer permissions from earlier assignments; their records may
  inform recommendations only.
- Where decisions are partial, omit pending entries and exclude their
  routes. Do not characterize an incomplete policy as universally approved.
- In `verification.md`, cite relevant policy IDs and any applicable
  problem overrides rather than duplicating the entire assignment table.

Approval of a course treatment is not proof of mathematical
applicability, and neither establishes the correctness of an inference.

## 3. Independently construct and adversarially verify

After the preliminary gate, independently derive the main mathematical
arguments allowed by the policy. Check **every** node, AND-hyperedge,
quantifier, theorem assumption, local scope, case split, reachability,
cycle and complete proof path. Independently verify instructor reference
solutions too. Look for counterexamples and important missing approaches;
remove faulty arguments. Distinguish genuine errors from acceptable
implicit arguments in the given assignment.

If optional pre-audit discovery ran, treat its `discovery.md` as
untrusted **candidate evidence only**: its statements are not graph
assertions, mistake conclusions or permissions. Verify every proposed
graph inference and counterexample independently, even when many
submissions exhibit the same pattern. Preserve rare legitimate strategies
without pretending all possible routes were enumerated.

A graph may cite a theorem only where both (a) its hypotheses hold
mathematically and (b) the corresponding unproved invocation is explicitly
permitted in the policy for that problem. A `derive` decision requires
a proof, and `exclude` prohibits an unproved shortcut. Preserve stable IDs
and human-approved arguments when modifying an existing graph.

**Delta checkpoint:** If graph construction or revisions introduce a new
substantial result, changed theorem statement, uncovered problem, or
new course-dependent implicit argument, stop the affected route(s);
show **only those new or changed items** in a decision table. Wait for
an explicit response. Update the same assignment policy and reverify
the affected mathematical dependencies before committing changes.
Do not restart the whole policy checkpoint without cause.

## 4. Validation and GitHub review gate

- Run `python scripts/validate_graphs.py` and correct all structural
  errors when execution is available; otherwise say validation was not run.
- The `policy.yaml` is **outside** the canonical solution-graph schema:
  do not add policy fields to `graph.yaml`.
- An instructor response permits recording a scoped policy; it is
  **not** approval to merge mathematical graph changes.
- Do not commit a graph or a claimed policy approval until the
  applicable instructor decision is explicit. Do not merge mathematical
  changes without final instructor review and approval.
- Structural validation is not mathematical verification.

## 5. `verification.md` — concise exception-focused report

Use exactly these conceptual sections:

### Instructor policy and pending questions

- If pre-audit discovery was authorized, link the private de-identified
  `discovery.md` and accurately summarize its coverage limitations
  without replicating student submissions or issuing judgments.
- Give the assignment `policy.yaml` path, applicable theorem/step IDs and
  problem override IDs, and the actual scope of instructor decisions.
- List unresolved questions with stable `REVIEW_...` IDs, exact affected
  graph IDs, specific mathematical evidence and suggested treatment.
  If no questions remain, say `None pending`.
- Do not paste the complete policy or reprint theorem statements already
  defined in the graph/policy.

### Independent mathematical verification — summary and exceptions

- State which graph revision and how many nodes, edges, goals and
  complete paths were checked; distinguish tested versus unexplored paths.
- Record only invalid, incomplete, uncertain or contentious items,
  with exact IDs, diagnosis, remediation and status. Record material
  missing approaches when found. Identify anything `not_checked`.
- Do not duplicate all successful proofs.

### Structural validation and approval status

- State the validator command and actual outcome (or unavailability).
- Separately identify (1) structural validation,
  (2) independent mathematical verification,
  (3) assignment-specific instructor theorem-policy confirmation, and
  (4) final instructor graph approval/merge state. Never present one as
  establishing another.

Stop after graph generation, independent verification and proposed PR.
No grading, student submissions, or `visualization.md`.

## Example checkpoint delta

Suppose P02 previously received permission to `cite` `THM_HEINE_BOREL`.
A newly found alternative proof for P02 uses `THM_BOLZANO_WEIERSTRASS`
without an applicable HW policy entry. Keep the Heine–Borel approval,
stop only this new route and ask for `THM_BOLZANO_WEIERSTRASS` with its
statement, assumptions, P02 context, source, and proposed treatment.
Earlier homework permissions are not sufficient.
