# Math Homework Audit — reusable instructor starter

An independent **math-proof hypergraph** workflow for instructors using their **own GPT Work** and GitHub repository. No student submissions, real assignments or private data are included.

**Published starter source:** [Public GitHub branch](https://github.com/hoooopla/Math-hyper-graph-visualization-/tree/math-homework-audit-starter). This branch is intentionally a **standalone starter snapshot** and is **not the web viewer's main branch**.

## Quick start

1. **Create your own GitHub repository** (public or preferably private for course materials). Copy all files from this starter branch into its root, preserving folders. See [full instructions](docs/GETTING_STARTED.md) for the downloadable ZIP and Git instructions.
2. Open **GPT Work** in ChatGPT. Connect GitHub access to **your own repository** and select it for the task. If your Work mode has no GitHub access, connect/authorize GitHub first; do not paste secrets into prompts.
3. Attach a **problem PDF** (and optional instructor solutions), then paste this:

   > Using **my connected GitHub repository** containing `AGENTS.md`, read `AGENTS.md`, `SCHEMA.md`, `schema/solution-graph.schema.json`, `prompts/generate-solution-graph.md`, and `prompts/verify-solution-graph.md`. Independently analyze and verify all problems in the attached PDF. **Before committing any new or changed graph.yaml**, show me a consolidated table of proposed theorems and justification-dependent steps for all problems, with exact/provisional IDs, mathematical applicability, and your recommendation: **Cite / Derive / Exclude**. **Stop and ask for my decisions.** After I reply, adjust and reverify the proofs, run `python scripts/validate_graphs.py`, produce `graph.yaml` and focused `verification.md` per problem, and propose a pull request. **Do not merge** the PR, audit students, or generate `visualization.md`.

4. Answer the theorem table **in the same Work conversation**: **Cite** (may be invoked), **Derive** (must justify/prove), or **Exclude** (cannot be invoked without proof). Add any course requirements about implicit arguments.
5. Review the proposed pull request and open each `graph.yaml` in [Proof Atlas](https://hoooopla.github.io/Math-hyper-graph-visualization-/) by using **Open YAML**. Decide whether to merge **only after your review**.

**Important:** GPT Work must *pause* for a theorem-policy decision before committing the graph. That is a **prompt instruction, not an automatically enforced GitHub permission**. Never grant the agent permission to bypass required human review. If the agent cannot access your repository or run validation, it must report that rather than claiming success.

## Per-problem output

```text
assignments/
  homework-01/
    problem-01/
      graph.yaml
      verification.md
    problem-02/
      graph.yaml
      verification.md
```

- `graph.yaml` is the canonical mathematical AND/OR solution hypergraph.
- `verification.md` is a compact instructor-decision and unresolved-issue report with precise graph IDs; it **does not duplicate every successful proof**.
- Theorem usage and hypotheses are mathematical dependencies, **not course-policy permission**.
- No `visualization.md`: Proof Atlas draws the graph from YAML on demand.
- No student-answer audit unless explicitly requested in a later stage.

## Local checks

```bash
python -m pip install -r requirements.txt
python scripts/validate_graphs.py
```

A **fully synthetic example** is included under `examples/commuting-square-roots/`, so validation succeeds immediately. GitHub Actions repeats structural checks on pushes and PRs. Passing structural tests is **not** mathematical verification.

## Safety and scope

- Your Work session must use **your own repo**, not the starter publisher's repository.
- Keep student PDFs, identities, grades, credentials, and confidential materials **out of public repositories**; a private repository does not replace university policy or appropriate data access controls.
- The included `.gitignore` excludes typical PDFs and submission directories, but **does not guarantee** that you cannot accidentally publish personal data.
- Human verification and final PR approval remain mandatory.

## Reference

- [Agent rules](AGENTS.md)
- [Generation procedure](prompts/generate-solution-graph.md)
- [Independent verification and human checkpoint](prompts/verify-solution-graph.md)
- [Canonical schema](SCHEMA.md) and [JSON schema](schema/solution-graph.schema.json)
- [Validator](scripts/validate_graphs.py)
- [Setup guide](docs/GETTING_STARTED.md)
