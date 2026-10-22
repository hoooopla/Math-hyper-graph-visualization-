# Getting started with Proof Atlas and GPT Work

The [public Proof Atlas repository](https://github.com/hoooopla/proof-atlas)
contains the viewer, mathematical format and GPT Work workflows. **Each
instructor uses a separate GitHub repository** for their assignments.

## Option A — GPT Work

1. Open [Proof Atlas](https://hoooopla.github.io/proof-atlas/), choose
   **Start Workflow**, and copy the setup text into GPT Work. The
   [canonical starter prompt](../workflow/start-with-gpt-work.md)
   is also available in this repository.
2. Connect GPT Work to **your own** GitHub repository (preferably private)
   and attach a problem PDF. If Work cannot create a repository or access
   GitHub, create one manually and give Work its URL; never share credentials.
3. GPT Work uses the [instructor manifest](../templates/instructor-workspace/manifest.json)
   to copy only the relevant files into your repository. The public
   `core/` and `workflow/` files become instructor-side
   `SCHEMA.md`, `schema/`, `prompts/` and `scripts/`.
4. **Early checkpoint, before full proof graphs:** Work sketches the main
   natural strategies for every problem, lists likely theorem dependencies
   in one assignment-wide table and asks which are **Cited**, **Derived**,
   or **Excluded**. Previous assignments can inform recommendations but
   never automatically authorize theorem use in a new assignment.
5. After your explicit decisions, Work creates
   `assignments/<assignment-id>/policy.yaml` from the inert
   `templates/assignment-policy.template.yaml` in your private repo.
   The policy records exact statements, problem scope, and real
   instructor-approval evidence, including explicitly approved overrides.
6. Work now builds complete proofs and independently verifies mathematics.
   If a previously unapproved theorem or nonroutine step arises, it asks
   **only for that new dependency**, preserves earlier approvals and
   re-verifies affected routes.
7. Work validates graph YAML and opens a PR with the assignment policy,
   each `graph.yaml` and concise `verification.md`. Review mathematics
   and policy before merging.

The early checkpoint is a **GPT Work prompt instruction**, not an
enforced GitHub permission rule. A real policy file is created only after
the instructor's response. If Work cannot run the validator, it must
report that rather than claiming the check passed.

## Option B — create a private workspace locally

Download or clone this public repository, then run Node.js 20+:

```sh
node scripts/create-instructor-workspace.mjs ./my-instructor-workspace
```

The script creates only the instructor workspace files in a **new**
directory, without frontend source files, and refuses to overwrite an
existing directory. Push the resulting folder to your own private GitHub
repository.

The workspace includes:

```text
AGENTS.md
README.md
SCHEMA.md
schema/solution-graph.schema.json
prompts/generate-solution-graph.md
prompts/verify-solution-graph.md
prompts/assignment-policy.md
templates/assignment-policy.template.yaml
scripts/validate_graphs.py
requirements.txt
examples/commuting-square-roots/
.github/workflows/validate.yml
```

Validate it locally:

```sh
python -m pip install -r requirements.txt
python scripts/validate_graphs.py
```

## Assignment policy structure

Only the instructor's own repository contains assignment policies and
course materials. For example:

```text
assignments/
  HW01/
    policy.yaml
    P01/graph.yaml
    P01/verification.md
    P02/graph.yaml
    P02/verification.md
  HW02/
    policy.yaml  # decisions are separate, never inherited
```

`policy.yaml` is **not** part of `graph.yaml` or its JSON Schema.
Keep only confirmed instructor decisions in it; per-problem
`verification.md` files reference the approved entries and exceptions.
The exact format and problem-specific override rules are in
[Assignment policy](../workflow/assignment-policy.md).

## Inspect and iterate

Open [the viewer](https://hoooopla.github.io/proof-atlas/), choose
**Open YAML**, then select a local `graph.yaml`. The editor supports
proof-path inspection, verification marks, graph comparisons and change
requests. Return the revised YAML or exported comments to GPT Work to
continue work on your instructor repository.

The public normative graph specification is
[`core/SCHEMA.md`](../core/SCHEMA.md). A separate `visualization.md`
is not needed; the website draws proof graphs directly from YAML.

**Privacy:** Uploaded YAML is processed locally by the browser, not
stored by the public site. Keep student identities, grades and submissions
out of public repositories.
