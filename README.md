# Proof Atlas

**Explore, verify, and review mathematical proofs as solution hypergraphs.**

[**Open the interactive website**](https://hoooopla.github.io/proof-atlas/) ·
[Get started with GPT Work](docs/getting-started.md) ·
[Canonical YAML format](core/SCHEMA.md)

Proof Atlas combines a client-side graph editor with a reproducible
**GPT Work** workflow for proof generation and independent verification.
Upload your own YAML locally to inspect its mathematical inferences,
compare revisions, and prepare review comments.

## Get started

1. Open [Proof Atlas](https://hoooopla.github.io/proof-atlas/) and choose
   **Start Workflow** to copy the setup prompt into GPT Work.
2. Connect GPT Work to **your own** GitHub repository and attach a problem
   PDF. Before committing graphs, GPT Work asks which proposed theorems
   may be **Cited**, must be **Derived**, or are **Excluded** in your course.
3. After you answer, review the proposed `graph.yaml` and
   `verification.md` for each problem in a pull request. Open the
   graph in the website and approve the mathematics yourself.

The website is usable without GPT Work for **viewing and editing YAML**.
AI runs in your GPT Work conversation, not inside the public website.

## Workflow

```text
Problem PDF → AI proof analysis → instructor theorem decisions
            → graph.yaml + verification.md → interactive human review
            → revision / pull request
```

## Features

- Visualize directed **AND/OR hypergraphs** and inspect the complete
  mathematical statements, theorem hypotheses, proof paths and mistakes.
- Mark nodes, inferences and paths as verified; edit annotations and
  mathematical statements with reviewable differences.
- Compare two graph versions and export updated YAML or structured
  change requests for GPT Work.
- Keep each instructor's homework and confidential student materials
  in their **own repository**, not this public software project.

## Source organization

| Directory | Responsibility |
| --- | --- |
| [`app/`](app/) | Browser viewer, editor, math rendering and UI tests |
| [`core/`](core/) | Single public authoritative YAML schema, specification, validator |
| [`workflow/`](workflow/) | Generation, verification, GPT Work setup prompts |
| [`templates/instructor-workspace/`](templates/instructor-workspace/) | Minimal private instructor workspace |
| [`examples/`](examples/) | Synthetic demonstration only |
| [`docs/`](docs/) | Onboarding, architecture, contributing |
| [`scripts/`](scripts/) | Site build/preview and workspace generation |

Instructors receive a **copy** of the canonical schema and workflow files
through the workspace generator, pinned to their own repository version.
There is only one authoritative public schema:
`core/schema/solution-graph.schema.json`.

## Development

Node.js 20+ and Python 3.12 are recommended:

```sh
npm run dev                        # Builds and serves localhost:4173
npm run check                      # Node tests and website build
python -m pip install -r requirements.txt
python core/validation/validate_graphs.py
```

To create a standalone instructor workspace:

```sh
node scripts/create-instructor-workspace.mjs ./my-instructor-workspace
```

GitHub Pages publishes **only `dist/`**. Local YAML uploads and
edits stay in the browser. Structural validation does not establish
mathematical correctness.

## Documentation

[Getting started](docs/getting-started.md) ·
[Architecture](docs/architecture.md) ·
[Contributing](docs/contributing.md) ·
[Generation workflow](workflow/generate-solution-graph.md) ·
[Verification workflow](workflow/verify-solution-graph.md)

Do not publish identifiable student submissions, grades or confidential
course PDFs in this public repository. Student-answer auditing is a
separate later stage, not part of initial graph generation.
