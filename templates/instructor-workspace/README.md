# Instructor workspace for Math Homework Audit

This repository is for an instructor's assignments. Public software,
schema and documentation come from
https://github.com/hoooopla/proof-atlas .

## One assignment at a time

In GPT Work, attach the entire assignment PDF and direct the agent to
read `AGENTS.md`, `SCHEMA.md`,
`prompts/generate-solution-graph.md`,
`prompts/verify-solution-graph.md` and
`prompts/assignment-policy.md`.

**Before producing full proof graphs**, Work sketches natural approaches,
collects likely substantial theorem dependencies across all problems, and
shows **one deduplicated Cite / Derive / Exclude checkpoint**. It must wait
for your explicit choices; earlier assignments are context about progress,
not authorization for this one.

After approval, it records actual decisions in one assignment-specific
`policy.yaml` (copy the inert `templates/assignment-policy.template.yaml`),
then generates full mathematically verified solution graphs. Request new
decisions only for newly discovered dependencies.

```text
assignments/
  HW01/
    policy.yaml                  # created only after explicit decisions
    P01/
      graph.yaml
      verification.md
    P02/
      graph.yaml
      verification.md
  HW02/
    policy.yaml                  # independent approvals, not inherited
```

The `policy.yaml` is outside the canonical `graph.yaml` schema.
Per-problem reports reference the assignment policy and record exceptions
without duplicating it. Do not create `visualization.md`.

After instructor decisions, Work runs
`python scripts/validate_graphs.py`, and proposes a PR containing policy,
graphs and verification reports for your review. Validation does not
establish mathematical correctness. Never merge mathematical changes
without instructor approval.

Open the public Proof Atlas website to review YAML locally. Do not publish
student submissions, grades or confidential course data in the software repo.

To validate locally:

```sh
python -m pip install -r requirements.txt
python scripts/validate_graphs.py
```
