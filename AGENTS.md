# Proof Atlas — repository agent instructions

This **public** repository is the source for the Proof Atlas website,
canonical mathematical hypergraph schema, validator and GPT Work workflows.
Actual instructor assignments, course decisions and student submissions
belong in a **separate instructor-owned repository**, preferably private.

## Layout

- `app/`: client-side graph viewer/editor and frontend tests.
- `core/SCHEMA.md`, `core/schema/`: normative mathematical YAML v1.0.
- `core/validation/validate_graphs.py`: structural graph validator.
- `workflow/`: GPT Work generation, optional submission discovery, early assignment policy, independent verification and onboarding.
- `templates/instructor-workspace/`: private instructor starter and manifest.
- `examples/`: synthetic example only.
- `scripts/`: build and workspace generation tooling.

Before changing mathematical workflow files read `core/SCHEMA.md`,
`core/schema/solution-graph.schema.json`,
`workflow/generate-solution-graph.md`, and
`workflow/verify-solution-graph.md`. AI must first identify likely proof strategies and theorem dependencies
for an entire assignment, then (only if explicitly opted in and provided
with authorized submissions) preview student answers for **candidate
strategies, theorem dependencies and mistake patterns**, without
individual judgments or grades. Document how many files/problems were
actually screened and which are unreadable or unreviewed. Keep originals
and identifying alias maps out of Git commits and public repositories.
Then **pause early** for a single consolidated instructor Cite / Derive
/ Exclude checkpoint **before full graph construction**.
Save those decisions only in that assignment's `policy.yaml`, with
real evidence and problem scope. Previous assignments do not transfer
permission. Request only delta decisions for later new dependencies.
Independently verify all mathematical inferences after the checkpoint,
including every candidate inference found in the opt-in preview. Common
usage is not evidence of mathematical correctness.
Course policy is distinct from theorem applicability and final graph approval.

When these instructions are copied to an instructor-owned workspace,
the same canonical materials intentionally occupy `SCHEMA.md`,
`schema/`, `prompts/` and `scripts/validate_graphs.py`. See the
dedicated `templates/instructor-workspace/AGENTS.md` instead of copying
this public-repository agent file to private workspaces.

## Checks

- `npm run check`: frontend tests, workspace-generator tests, site build.
- `python -m pip install -r requirements.txt`
- `python core/validation/validate_graphs.py`: public synthetic graph validation.

Use reviewable pull requests, preserve stable mathematical IDs, do not
silently overwrite approved mathematics. Passing structural CI is not
mathematical verification. Never produce `visualization.md`, and do
not audit student submissions without explicit instructions.
