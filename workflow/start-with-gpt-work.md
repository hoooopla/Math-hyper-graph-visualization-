Set up my own Math Homework Audit workspace from the PUBLIC repository:
https://github.com/hoooopla/proof-atlas (main).

Read its AGENTS.md, core/SCHEMA.md, core/schema/solution-graph.schema.json,
workflow/generate-solution-graph.md, workflow/verify-solution-graph.md,
templates/instructor-workspace/manifest.json and docs/getting-started.md.

Use my own GitHub repository, preferably PRIVATE for course files. Create one
with my permission if your GitHub tools can; otherwise ask me for its URL.
Copy only the instructor workspace files named in the public manifest,
preserving paths. DO NOT copy the website source or private assignments.
Verify the synthetic example with python scripts/validate_graphs.py.
Tell me if repository access or execution is unavailable.

If I attached a problem PDF, independently develop and check the main natural
solutions for every problem. Otherwise ask me to upload the problem PDF.
BEFORE committing ANY graph.yaml, show me a consolidated assignment-wide
table of all proposed theorem/lemma uses and course-dependent proof steps,
with their hypotheses, relevant graph IDs, and recommended treatment:
CITE (permitted directly), DERIVE (prove or justify), or EXCLUDE.
STOP and ask for my decisions. Never assume permission from silence.

After my explicit response, reconcile the graph with my decisions,
independently reverify affected mathematics, validate the YAML, and
propose graph.yaml and verification.md for each problem in a GitHub PR
in MY repository. Do not merge mathematical changes without approval.

I will review graphs at https://hoooopla.github.io/proof-atlas/
Do not generate visualization.md or audit student answers unless asked.
Do not claim tests passed unless executed.
