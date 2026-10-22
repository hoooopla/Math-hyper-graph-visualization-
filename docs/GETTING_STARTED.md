# Start Proof Atlas with GPT Work

The public [Proof Atlas repository](https://github.com/hoooopla/Math-hyper-graph-visualization-) contains the whole workflow. **Every instructor uses a separate repository** for their assignments and graphs.

## Option A — GPT Work (recommended)

1. Visit [Proof Atlas](https://hoooopla.github.io/Math-hyper-graph-visualization-/), click **Start Workflow**, and copy the instructions. You can also copy [the canonical starter prompt](../prompts/start-with-gpt-work.md).
2. Open GPT Work. Grant its GitHub integration access to **your own** repository and attach a problem PDF. Work may create a private repo with your permission if that capability is available; otherwise, create one yourself and share its URL with Work.
3. Work copies the [workspace manifest](../templates/instructor-workspace/manifest.json)'s specified workflow files from this public source, and validates the included synthetic example.
4. Work independently analyzes the problems and **stops before committing graph YAML** to ask you which theorems may be **Cited**, must be **Derived**, or are **Excluded**, and which steps need explicit justification.
5. Answer in that same GPT Work conversation. It must reverify and validate the revised graphs, then submit a reviewable PR in **your repository**. Review the graph and `verification.md` yourself before any merge.

The stop-and-ask instruction is not a GitHub permission rule: do not give the agent authority to merge mathematical changes. If Work cannot access GitHub or run Python, it must report the limitation rather than claim success.

## Option B — create your private workspace locally

Download/clone this public repository, then run with Node.js 20+:

```bash
node scripts/create-instructor-workspace.mjs ./my-instructor-workspace
```

The script writes an independent starter into a **new directory** and refuses to overwrite an existing directory. Create a new private GitHub repository and push **only the generated workspace folder's contents**, preserving paths. Connect this new repository to GPT Work and proceed with step 4 above.

## Reviewing solution graphs

Open [Proof Atlas](https://hoooopla.github.io/Math-hyper-graph-visualization-/) and use **Open YAML** to select `graph.yaml` from your computer. The viewer supports editing, verification marks, version comparison, and change-request export to GPT Work.

The canonical graph format is in [SCHEMA.md](../SCHEMA.md). Each problem maintains only `graph.yaml` and `verification.md`. Do not create `visualization.md` or audit student submissions unless explicitly instructed.

**Privacy:** Never upload student submissions or identifiable data into a public repository. The website's YAML viewer works locally in your browser; it does not store uploaded YAML on a server.
