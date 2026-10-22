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
4. Work first sketches the main natural strategies for every problem
   **independently**, before any student submissions are read.
   **Optional pre-audit discovery:** if you explicitly provide/authorize
   student answers, Work can scan their mathematical methods in batches,
   cluster candidate strategies/theorem uses/mistake patterns, inspect
   unusual approaches, and report precise coverage and limitations in a
   private, de-identified `discovery.md`. **No student grades or
   individual correctness judgments** occur at this stage.
5. **Early checkpoint, before full proof graphs:** Work deduplicates
   theorem dependencies from independent analysis and optional discovery
   into one assignment-wide table. You decide **Cite**, **Derive** or
   **Exclude**. Previous assignments can inform recommendations but
   never automatically authorize theorem use in a new assignment.
6. After your explicit decisions, Work creates
   `assignments/<assignment-id>/policy.yaml` from the inert
   `templates/assignment-policy.template.yaml` in your private repo.
   The policy records exact statements, problem scope, and real
   instructor-approval evidence, including explicitly approved overrides.
7. Work now builds complete proofs and independently verifies mathematics,
   including all candidate routes suggested by the optional preview.
   If a previously unapproved theorem or nonroutine step arises, it asks
   **only for that new dependency**, preserves earlier approvals and
   re-verifies affected routes.
8. Work runs **both** `python scripts/validate_graphs.py` and
   `python scripts/validate_policies.py` to reject missing policies,
   unapproved theorem declarations, mismatched theorem statements,
   out-of-scope uses and `derive`/`exclude` direct citations. Both
   must pass before a graph-containing PR is ready for review.
   Work then opens a PR with the assignment policy,
   each `graph.yaml` and concise `verification.md`. Review mathematics
   and policy before merging.

The early checkpoint is a **GPT Work prompt instruction**, not an
enforced GitHub permission rule. A real policy file is created only after
the instructor's response, **in the assignment folder alongside its
problem subfolders**. If Work cannot run the validator, it must
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
schema/assignment-policy.schema.json
prompts/generate-solution-graph.md
prompts/verify-solution-graph.md
prompts/assignment-policy.md
prompts/preaudit-discovery.md
templates/assignment-policy.template.yaml
templates/discovery-report.template.md
scripts/validate_graphs.py
scripts/validate_policies.py
requirements.txt
examples/commuting-square-roots/
.github/workflows/validate.yml
```

Validate it locally:

```sh
python -m pip install -r requirements.txt
python scripts/validate_graphs.py
python scripts/validate_policies.py
```

## Assignment policy structure

Only the instructor's own repository contains assignment policies and
course materials. For example:

```text
assignments/
  HW01/
    discovery.md  # optional, private, de-identified
    policy.yaml   # in the assignment root, no separate policy folder
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
The exact format, problem-specific override rules and mechanical
permission checks are in [Assignment policy](../workflow/assignment-policy.md).
The validator checks **every** graph theorem entry against the approved
assignment policy; a direct `edges[].uses` citation requires effective
treatment `cite`. It does not establish the authenticity of instructor
approval evidence, mathematical validity of theorem hypotheses, or
whether a required derivation is actually correct.

## Optional pre-audit discovery from many student answers

Only run this when the instructor explicitly opts in and supplies
authorized submissions to GPT Work or a private connected workspace.
You may provide them in batches if the file count is large; there is
no built-in bulk student-PDF uploader on the public Proof Atlas site.
The browser viewer is for `graph.yaml`, not confidential student data.

Work first independently sketches problem strategies, then previews
every accessible submission/problem for short **mathematical signatures**.
It groups equivalent approaches, examines representatives and outliers,
and tracks total/unique/opened/unreadable/not-checked files. It reports
only candidate approaches, possible theorem uses, potential common
mistake families and unresolved mathematical questions. It does **not**
judge or grade any student's work, and does not automatically alter
`graph.yaml` or theorem permissions.

Use [Pre-audit discovery prompt](../workflow/preaudit-discovery.md) and
the private `templates/discovery-report.template.md`. If authorized,
keep a **de-identified** `assignments/HWxx/discovery.md` in your
private instructor repository. Keep original student files, identifiers
and alias mappings in ignored private storage, not Git commits.
Comply with institutional data rules before uploading student work.
Coverage can be incomplete; missing/illegible portions must be reported,
not guessed. Discovery reduces but cannot eliminate later unforeseen
proof paths or theorem-policy decisions.

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
