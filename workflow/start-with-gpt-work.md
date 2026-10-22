Set up my own Math Homework Audit workspace from the PUBLIC repository:
https://github.com/hoooopla/proof-atlas (main).

Read its current AGENTS.md, core/SCHEMA.md,
core/schema/solution-graph.schema.json, workflow/generate-solution-graph.md,
workflow/verify-solution-graph.md, workflow/assignment-policy.md,
workflow/preaudit-discovery.md,
templates/instructor-workspace/manifest.json and docs/getting-started.md.

Use my own GitHub repository (preferably PRIVATE). Create one only with my
permission, or ask for its URL. Copy exactly the instructor-workspace files
listed in the manifest, preserving destinations. Never copy website source,
private assignments or student files into the public software repo.
Validate the synthetic example with python scripts/validate_graphs.py if
execution is available, and report access/execution failures truthfully.

If a problem PDF is attached, identify its assignment ID and all problem
statements. If no PDF is attached, ask me to upload it.

**OPTIONAL PRE-AUDIT DISCOVERY — only if I explicitly provide and
authorize student submissions for this purpose:**
- First independently sketch the problem approaches, before reading answers.
- Preview submissions in batches, track exactly what was examined,
  unreadable or not inspected, cluster candidate mathematical strategies,
  theorem uses and potential mistake patterns.
- Investigate representative approaches and rare outliers without grading,
  judging individuals or automatically modifying any graph.
- Optionally create a de-identified private
  assignments/<assignment-id>/discovery.md. Keep original PDFs and the
  source-to-alias mapping out of Git commits and public repositories.
- Use the combined candidate inventory for the one early instructor
  checkpoint **after** discovery. Without explicit opt-in, skip this stage.

**EARLY CHECKPOINT — before full proof graph construction:**
- Sketch the main natural approaches, only enough to identify substantial
  candidate theorems/lemmas and nonroutine justification requirements.
- Verify candidate theorem statements and note hypotheses/applicability.
- Show ONE deduplicated assignment-wide Cite / Derive / Exclude decision
  table with affected problems, suggestions and pending instructor choices,
  incorporating any opt-in pre-audit discoveries.
- Earlier assignments are context about course progress, NEVER reusable
  permission. Reuse only the exact approvals already given for the SAME
  assignment and problem scope.
- STOP and wait for my explicit decisions. Do not generate/commit a full
  graph.yaml or assume agreement from silence.

After my response, create
assignments/<assignment-id>/policy.yaml from the inert template, recording
only my actual approved choices and their exact scope/evidence. Construct
and independently verify solution hypergraphs under this policy. If new
theorem or justification dependencies arise, ask only about the NEW ones
before adding the affected routes.

Run the structural validator and create a reviewable PR in MY repository
with policy.yaml, each graph.yaml and verification.md. Do not merge
mathematical changes without my approval. Do not create visualization.md
or conduct individual student auditing/grading unless separately requested.
Discovery alone is not student auditing or a correctness judgment.

I will review the YAML using https://hoooopla.github.io/proof-atlas/.
Do not claim tests or proof verification passed unless actually performed.
