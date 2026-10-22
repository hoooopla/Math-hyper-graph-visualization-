import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspace } from "../scripts/create-instructor-workspace.mjs";

test("instructor starter uses canonical files, not viewer or student data", async () => {
  const parent = await mkdtemp(join(tmpdir(), "proof-atlas-test-"));
  const target = join(parent, "instructor");
  try {
    await createWorkspace(target);
    const files = await readdir(target);
    assert.deepEqual(files.sort(), [".gitignore",".github","AGENTS.md","README.md","SCHEMA.md","examples","prompts","requirements.txt","schema","scripts"].sort());
    const agent = await readFile(join(target, "AGENTS.md"), "utf8");
    assert.match(agent, /Pre-commit instructor gate/);
    const verification = await readFile(join(target, "prompts/verify-solution-graph.md"), "utf8");
    assert.match(verification, /Cite \/ Derive \/ Exclude/);
    const schema = JSON.parse(await readFile(join(target, "schema/solution-graph.schema.json"), "utf8"));
    assert.ok(schema.properties.edges.items.properties.uses);
    assert.match(await readFile(join(target, ".github/workflows/validate.yml"), "utf8"), /validate_graphs\.py/);
    assert.match(await readFile(join(target, "examples/commuting-square-roots/graph.yaml"), "utf8"), /EXAMPLE_COMMUTING_SQUARE_ROOTS/);
    await assert.rejects(createWorkspace(target), /already exists/);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("workflow on main has independent theorem gate and no hardcoded private repository", async () => {
  const source = await readFile(new URL("../prompts/generate-solution-graph.md", import.meta.url), "utf8");
  assert.match(source, /Pause for an explicit response/);
  assert.doesNotMatch(source, /hoooopla\/Math-homework-audit/);
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  assert.match(readme, /Start Workflow/);
});

test("public documentation and onboarding always use the renamed Proof Atlas URLs", async () => {
  const paths = [
    "../README.md",
    "../docs/GETTING_STARTED.md",
    "../SCHEMA.md",
    "../prompts/start-with-gpt-work.md",
    "../templates/instructor-workspace/README.md",
    "../src/app.js"
  ];
  const contents = await Promise.all(paths.map((path) =>
    readFile(new URL(path, import.meta.url), "utf8")
  ));
  for (const [index, content] of contents.entries()) {
    assert.doesNotMatch(content, /hoooopla\\/(?:Math-hyper-graph-visualization-)/,
      `Outdated GitHub repository link in ${paths[index]}`);
    assert.doesNotMatch(content, /hoooopla\\.github\\.io\\/Math-hyper-graph-visualization-/,
      `Outdated website link in ${paths[index]}`);
  }
  const [readme, gettingStarted, schema, prompt, workspace, app] = contents;
  assert.match(readme, /https:\/\/hoooopla\.github\.io\/proof-atlas\//);
  assert.match(gettingStarted, /https:\/\/github\.com\/hoooopla\/proof-atlas/);
  assert.match(schema, /https:\/\/hoooopla\.github\.io\/proof-atlas\//);
  assert.match(prompt, /https:\/\/github\.com\/hoooopla\/proof-atlas/);
  assert.match(prompt, /https:\/\/hoooopla\.github\.io\/proof-atlas\//);
  assert.match(workspace, /https:\/\/github\.com\/hoooopla\/proof-atlas/);
  assert.match(app, /github\.com\/hoooopla\/proof-atlas\/blob\/main\/docs\/GETTING_STARTED\.md/);
});
