# Instructor Math Homework Audit — agent instructions

This is the instructor's own workspace, **not** the public Proof Atlas
software repository. Work only with this instructor's selected repository
and authorized source materials. Protect confidential course/student data.

1. Before generating/modifying `graph.yaml`, read from this repository:
   `SCHEMA.md`, `schema/solution-graph.schema.json`,
   `scripts/validate_graphs.py`, `prompts/generate-solution-graph.md`,
   `prompts/verify-solution-graph.md`, and
   `prompts/assignment-policy.md`. These are pinned workflow rules.
2. **Early, assignment-scoped instructor gate:** Before developing full
   proof graphs, read all problems, sketch the main natural approaches,
   inventory potential substantial theorems/lemmas and course-dependent
   implicit justifications, and ask about Cite / Derive / Exclude once
   for the assignment. **Pause for an explicit response.** Do not write or
   commit a complete graph or assume permission from silence. Reuse only
   exact approvals already given for the **same assignment**, not prior
   assignments or the course in general.
3. After the instructor's choices, create or update
   `assignments/<assignment-id>/policy.yaml` from
   `templates/assignment-policy.template.yaml`. Record **only actual,
   explicitly confirmed decisions**, their precise theorem/step statements,
   affected problems, real approval evidence and approved overrides. The
   template is inert. Historical assignments can inform recommendations,
   not authorize theorem use.
4. Independently develop and adversarially verify mathematical nodes,
   AND-hyperedges, theorem hypotheses, quantifiers, local assumptions and
   complete paths **under the assignment policy**. If a new or changed
   theorem/implicit-step dependency appears, request approval **only for
   that delta** before including the affected route; reverify affected
   mathematical dependencies. Course permission and mathematical
   applicability are distinct.
5. Each problem maintains exactly two proof deliverables:
   `graph.yaml` and an exception-focused `verification.md` referencing
   the current assignment policy, unresolved issues and honest mathematical/
   structural validation status. The policy is **assignment-wide**, lives
   outside graph YAML, and is not part of the canonical schema.
   `edges[].uses` and `theorems[].required_hypotheses` record mathematical
   dependencies, not permission.
6. Run `python scripts/validate_graphs.py`; correct failures and rerun.
   Preserve stable IDs and approved mathematics. Commit policy+graphs only
   after the necessary explicit instructor decisions; open a reviewable PR
   and do not merge mathematical changes without final instructor approval.
   Never create `visualization.md` or audit student submissions unless
   explicitly requested.

Use `$...$` for inline mathematics and `\\[...\\]` for display;
prefer YAML single quotes or literal blocks for TeX.
