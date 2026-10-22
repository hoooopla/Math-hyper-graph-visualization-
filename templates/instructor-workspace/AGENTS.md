# Instructor Math Homework Audit — agent instructions

This is the instructor's own workspace, **not** the public Proof Atlas
software repository. Work only with this instructor's selected repository
and authorized source materials; protect confidential student data.

1. Before generating or modifying `graph.yaml`, read `SCHEMA.md`,
   `schema/solution-graph.schema.json`, `scripts/validate_graphs.py`,
   `prompts/generate-solution-graph.md`, and
   `prompts/verify-solution-graph.md` from this repository. These are the
   authoritative pinned workflow specifications for this workspace.
2. Independently develop and adversarially verify all mathematical nodes,
   AND-hyperedges, theorem hypotheses, quantifiers, local assumptions and
   complete paths. Structural validation is not mathematical verification.
3. **Pre-commit instructor gate:** Before committing a new or modified
   `graph.yaml`, list all proposed substantial theorems/lemmas and
   course-dependent implicit justifications, identify relevant IDs and
   conditions, and ask whether each result should be **Cited**, **Derived**
   or **Excluded**. Do not commit until explicitly answered. Never assume
   permission from silence. Reverify affected proofs afterward.
4. Mathematical use of a theorem is recorded in `edges[].uses` and its
   hypotheses in `theorems[].required_hypotheses`. Instructor permission
   to cite it is a distinct scoped decision in `verification.md`.
5. Each problem has exactly two standard maintained files: `graph.yaml`
   and an exception-focused `verification.md` recording instructor
   decisions, unresolved issues and accurate verification/validation
   status. Do not create `visualization.md`; Proof Atlas visualizes YAML.
6. Run `python scripts/validate_graphs.py` after changes. Preserve
   stable IDs and instructor-approved mathematics. Submit changes as a
   reviewable pull request; do not merge mathematical changes without
   instructor approval. Do not audit student submissions unless explicitly
   requested in a later task.

For math strings use `$...$` inline and `\\[...\\]` for display;
prefer YAML single quotes or literal blocks for TeX.
