Set up my own Math Homework Audit workspace from the PUBLIC repository:
https://github.com/hoooopla/proof-atlas (main).

Read its current AGENTS.md, core/SCHEMA.md,
core/schema/solution-graph.schema.json, workflow/generate-solution-graph.md,
workflow/verify-solution-graph.md, workflow/assignment-policy.md,
templates/instructor-workspace/manifest.json and docs/getting-started.md.

Use my own GitHub repository (preferably PRIVATE). Create one only with my
permission, or ask for its URL. Copy exactly the instructor-workspace files
listed in the manifest, preserving destinations. Never copy website source,
private assignments or student files into the public software repo.
Validate the synthetic example with python scripts/validate_graphs.py if
execution is available, and report access/execution failures truthfully.

If a problem PDF is attached, identify its assignment ID and all problem
statements. If no PDF is attached, ask me to upload it.

**EARLY CHECKPOINT — before full proof graph construction:**
- Sketch the main natural approaches, only enough to identify substantial
  candidate theorems/lemmas and nonroutine justification requirements.
- Verify candidate theorem statements and note hypotheses/applicability.
- Show ONE deduplicated assignment-wide Cite / Derive / Exclude decision
  table with affected problems, suggestions and pending instructor choices.
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
or audit student submissions unless separately requested.

I will review the YAML using https://hoooopla.github.io/proof-atlas/.
Do not claim tests or proof verification passed unless actually performed.
