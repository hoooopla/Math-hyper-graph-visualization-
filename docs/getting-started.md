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
4. Work independently analyzes the problems, then **pauses before
   committing graph YAML** to ask which theorems may be **Cited**,
   must be **Derived**, or are **Excluded**, and whether implicit
   arguments need more justification.
5. After your explicit decisions, Work re-verifies the proposed mathematics,
   validates the YAML, and opens a PR containing `graph.yaml` and a
   concise `verification.md` per problem. Review it before merging.

The pre-commit pause is a **prompt instruction**, not a GitHub permission
rule. If Work cannot run the validation script, it must report that
rather than claim a successful run.

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
