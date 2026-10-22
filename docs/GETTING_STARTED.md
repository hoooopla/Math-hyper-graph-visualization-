# Start your own Math Homework Audit workspace

## Option A — ask GPT Work to create your independent repository

If your GPT Work can create repositories with your authorized GitHub connection,
use the **one-time setup prompt in [README.md](../README.md#start-with-gpt-work)**.
It instructs Work to copy the **public starter branch only** into a repository
you own. Check the resulting repository before trusting that setup succeeded.
If GitHub creation/upload is unavailable to Work, use Option B.

## Option B — create your repository yourself

### 1. Get a fresh repository

This [public starter branch](https://github.com/hoooopla/Math-hyper-graph-visualization-/tree/math-homework-audit-starter) contains a standalone Git root snapshot of the workflow; the source repository's **main branch is a different project (Proof Atlas)**. Do **not** fork its main branch and assume you already have this starter.

**Download method (no terminal required for downloading):**

1. On the public starter branch click **Code → Download ZIP**, then extract it.
2. On GitHub create **New repository**, e.g. `math-homework-audit-my-course`. Choose **Private** if course or student information may be added.
3. In the new repository upload **the extracted starter's contents** (not the enclosing folder), preserving the `prompts/`, `schema/`, `scripts/`, `examples/` and `.github/` folder structure. The GitHub web upload interface or a Git client may be used. Verify that `AGENTS.md` and `prompts/generate-solution-graph.md` are at the repository root.
4. Ensure the Actions workflow `Validate solution graphs` can run; check its successful run. A synthetic example graph is included.

**Git command alternative:** Create an *empty* GitHub repository, download and extract the ZIP, then from the extracted folder:

```bash
git init
git add .
git commit -m "Initialize Math Homework Audit workflow"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
```

Git must be installed and authenticated to your GitHub account. This creates a repository with clean history; it does **not** copy the Proof Atlas history.

## 2. Use GPT Work

1. Open ChatGPT **Work** mode and attach the problem PDF.
2. Give Work access to GitHub (Settings → Plugins as applicable), selecting **your own repository**. GitHub permissions and Work access depend on your account configuration.
3. Paste the **Quick start** prompt from [README.md](../README.md).
4. Work should read the instructions and mathematical schema, analyze the problems, and **stop before writing any graph commit** to ask you which proposed theorems may be **Cited**, must be **Derived**, or are **Excluded**, including assumptions and course-dependent rigor.
5. Reply in that Work conversation. Work then finishes the YAML, independent mathematical check, local/CI validation, and proposes a PR in **your repository**. Inspect all changed files and approve or reject it yourself.

If Work cannot push or open a PR, ask it to provide the completed files and validation status, then upload them to a review branch yourself. Do not mistake a conversational claim of success for an actual GitHub commit or test run.

## 3. Open graphs in Proof Atlas

Visit [Proof Atlas](https://hoooopla.github.io/Math-hyper-graph-visualization-/), click **Open YAML** and choose a `graph.yaml` from your own repository/downloads. The viewer runs in-browser; uploading a private file to some other site or publishing the repository is not required for this workflow. The viewer does not substitute for independent mathematical verification.

## 4. Iterate

Review the graph and `verification.md`, identify issues by stable IDs, and ask Work to revise the graph using your existing graph and instructor decisions. Review the changes in a new PR. Do not merge without instructor approval. Do not create `visualization.md`.

## Privacy reminder

No real homework PDF, student answer, student ID, or private source repository material ships with this public starter. `.gitignore` is a backstop only; review every file before committing. Stage student auditing separately, only if instructed explicitly.
