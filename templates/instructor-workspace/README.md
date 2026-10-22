# Instructor workspace for Math Homework Audit

This is your independent repository for assignments. The shared workflow,
viewer, schema and documentation come from
https://github.com/hoooopla/Math-hyper-graph-visualization- .

In GPT Work, attach your problem PDF and tell the agent to follow
`AGENTS.md`, `SCHEMA.md`, `prompts/generate-solution-graph.md`,
and `prompts/verify-solution-graph.md`. The agent must ask for your
**Cite / Derive / Exclude** theorem and justification decisions
**before committing any graph YAML**.

After your response, it should produce a `graph.yaml` and
`verification.md` per problem, run `python scripts/validate_graphs.py`,
and open a PR for your review. Do not merge mathematical changes without
instructor approval; do not generate `visualization.md`.

Use the public Proof Atlas website to open and review the YAML in-browser.
Keep student submissions, identifiers and confidential course data private.

To validate locally:

```sh
python -m pip install -r requirements.txt
python scripts/validate_graphs.py
```
