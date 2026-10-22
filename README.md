# Proof Atlas — Mathematical Proof Audit Workspace

**Proof Atlas** is a public, browser-based solution hypergraph viewer/editor **and** the canonical GPT Work workflow for independently developing, mathematically verifying, and reviewing solution graphs.

[Open Proof Atlas](https://hoooopla.github.io/proof-atlas/) · [Getting started](docs/GETTING_STARTED.md) · [AI generation workflow](prompts/generate-solution-graph.md) · [Verification workflow](prompts/verify-solution-graph.md)

## Start with your own GPT Work

Open the website and choose **Start Workflow** to copy the setup prompt, or copy it directly from [prompts/start-with-gpt-work.md](prompts/start-with-gpt-work.md). Paste it in GPT Work and connect GitHub to a repository **you own** (preferably private for teaching data).

GPT Work should initialize the instructor workspace, read the canonical schema, and analyze your attached problem PDF. **Before committing a new or changed graph**, it must ask which theorems may be **Cited**, must be **Derived**, or are **Excluded**, including course-specific justification requirements. After your answer it verifies and validates each graph, writes `graph.yaml` plus a concise `verification.md`, and proposes a PR for your review. Do not merge mathematical changes without instructor approval.

If repository creation or command execution is unavailable to Work, follow the [manual setup guide](docs/GETTING_STARTED.md). The public app stores **no student data** and does not automatically run GPT Work.

## Repository structure

| Location | Responsibility |
| --- | --- |
| `src/`, `index.html`, `tests/` | Interactive browser-based proof graph reviewer and editor |
| `prompts/` | Canonical GPT Work generation and adversarial verification workflow |
| `SCHEMA.md`, `schema/` | **Single authoritative** solution graph YAML v1.0 specification |
| `scripts/validate_graphs.py` | Deterministic structural validation |
| `templates/instructor-workspace/` | Manifest and setup files for instructors' independent repositories |
| `examples/` | Synthetic example only; **no real assignments or student work** |
| `docs/` | Onboarding and review workflow |

An instructor's own repository contains one `graph.yaml` and one `verification.md` per problem, plus a copy of the pinned workflow files. `visualization.md` is obsolete: the website renders YAML directly.

## Website features

Upload or drag in YAML locally (nothing is sent to the server). Review the Problem, Notation, and Theorems cards; inspect AND/OR inferences; select proof paths, annotate and verify nodes/edges/paths; compare two graphs; edit and export revised YAML or a change request for GPT Work. **The website is not an AI inference service.**

## Developer checks

Node.js 20+ and Python 3 are recommended:

```sh
npm run check
python -m pip install -r requirements.txt
python scripts/validate_graphs.py
```

The Node suite checks viewer/editor behavior; the Python validator checks graph structure and references. Neither proves mathematical correctness. The CI workflow runs both checks.

For a self-contained instructor workspace run:

```sh
node scripts/create-instructor-workspace.mjs ./my-instructor-workspace
```

Then upload the resulting files to **your own private GitHub repository**.

## Privacy and scope

The source code and workflow definitions are public. Never commit real student submissions, identifiers, grades, or private problem PDFs to this repository. Instructors retain responsibility for course policy and final mathematical approval. Student answer auditing is a separate, future workflow and is **not automatically performed** during solution graph generation.
