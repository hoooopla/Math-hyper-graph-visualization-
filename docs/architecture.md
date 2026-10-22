# Proof Atlas architecture

The **public application and workflow** are separate from **private
instructor-owned mathematical data**.

```text
proof-atlas (public)
├── app/          Graph viewer/editor and frontend tests
├── core/         Normative schema + independent structural validator
├── workflow/     GPT Work proof generation and adversarial review
├── templates/    Copyable independent instructor workspace
├── examples/     Synthetic sample graph only
└── scripts/      Static site build and workspace generation

instructor-workspace (owned by each instructor)
├── AGENTS.md, SCHEMA.md, schema/, prompts/, scripts/
└── homework-01/problem-01/
    ├── graph.yaml
    └── verification.md
```

## Mathematical data

`core/SCHEMA.md` and `core/schema/solution-graph.schema.json`
define the single public canonical YAML format. Nodes are premises,
milestones or goals; inferences are directed AND-hyperedges referencing
theorem assumptions and explicit scope. The website's mathematical
graph model is in `app/src/`. The Python validator in
`core/validation/` checks the serialized structure and references,
**not** mathematical truth.

## AI and human review

`workflow/` is the source of the public GPT Work instructions. The
workspace manifest copies this workflow into instructor-owned legacy
compatible `prompts/`, `schema/` and `scripts/` paths. This gives
an instructor an independent versioned data repository without copying
the website.

GPT Work must ask about **Cite / Derive / Exclude** theorem permissions
before proposing a graph commit, then independently re-verify changed
proofs. Course policy approval and mathematical correctness are separate.

## Deployment

`scripts/build.mjs` packages `app/index.html`, `app/src/` and
the public GPT Work onboarding prompt into `dist/`. GitHub Pages deploys
**only this build output**, never the repository's prompts, examples,
source validators or private data. The site does not call an AI backend.
Graph editing and file loading are client-side.

CI separately runs frontend tests/build, canonical Python graph
validation, and the generated private-workspace validator.
