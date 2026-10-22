import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspace } from "../scripts/create-instructor-workspace.mjs";

test("workspace generator creates only intended private-repository files", async () => {
  const parent = await mkdtemp(join(tmpdir(), "proof-atlas-workspace-"));
  const target = join(parent, "instructor");
  try {
    await createWorkspace(target);
    assert.deepEqual((await readdir(target)).sort(), [
      ".github", ".gitignore", "AGENTS.md", "README.md", "SCHEMA.md",
      "examples", "prompts", "requirements.txt", "schema", "scripts", "templates"
    ].sort());

    const agent = await readFile(join(target, "AGENTS.md"), "utf8");
    const generator = await readFile(join(target, "prompts/generate-solution-graph.md"), "utf8");
    const verifier = await readFile(join(target, "prompts/verify-solution-graph.md"), "utf8");
    assert.match(agent, /Early, assignment-scoped instructor gate/);
    assert.match(agent, /same assignment/);
    assert.match(generator, /Pause for an explicit response/);
    assert.match(verifier, /Cite \/ Derive \/ Exclude/);
    assert.match(verifier, /early assignment-wide/);
    const assignmentPolicy = await readFile(join(target, "prompts/assignment-policy.md"), "utf8");
    assert.match(assignmentPolicy, /Previous/);
    assert.match(assignmentPolicy, /problem_overrides/);
    const template = await readFile(join(target, "templates/assignment-policy.template.yaml"), "utf8");
    assert.match(template, /TEMPLATE ONLY/);
    assert.match(template, /decisions: \[\]/);
    assert.match(template, /problem_overrides: \[\]/);
    const discoveryPrompt = await readFile(join(target, "prompts/preaudit-discovery.md"), "utf8");
    assert.match(discoveryPrompt, /only when the instructor explicitly opts in/);
    assert.match(discoveryPrompt, /Coverage and input limitations|coverage register/);
    assert.match(discoveryPrompt, /not student homework auditing/);
    assert.match(discoveryPrompt, /Cite \/ Derive \/ Exclude/);
    const discoveryTemplate = await readFile(join(target, "templates/discovery-report.template.md"), "utf8");
    assert.match(discoveryTemplate, /TEMPLATE ONLY/);
    assert.match(discoveryTemplate, /Fully legible\/covered/);
    assert.match(discoveryTemplate, /no graph mutations yet/i);
    const ignore = await readFile(join(target, ".gitignore"), "utf8");
    assert.match(ignore, /submissions\//);
    assert.match(ignore, /private\//);
    assert.match(ignore, /\*\.docx/);
    const publicSchema = await readFile(new URL("../core/schema/solution-graph.schema.json", import.meta.url));
    const privateSchema = await readFile(join(target, "schema/solution-graph.schema.json"));
    assert.deepEqual(publicSchema, privateSchema, "private schema must exactly match public authority");
    const publicValidator = await readFile(new URL("../core/validation/validate_graphs.py", import.meta.url));
    const privateValidator = await readFile(join(target, "scripts/validate_graphs.py"));
    assert.deepEqual(publicValidator, privateValidator, "private validator must be the same maintained file");
    assert.match(await readFile(join(target, ".github/workflows/validate.yml"), "utf8"), /validate_graphs\.py/);
    assert.match(await readFile(join(target, "examples/commuting-square-roots/graph.yaml"), "utf8"), /EXAMPLE_COMMUTING_SQUARE_ROOTS/);
    await assert.rejects(createWorkspace(target), /already exists/);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("workspace manifest has explicit unique paths and never copies frontend", async () => {
  const data = JSON.parse(await readFile(new URL("../templates/instructor-workspace/manifest.json", import.meta.url), "utf8"));
  assert.equal(data.version, 4);
  assert.ok(data.files.length > 0);
  const outputs = data.files.map((entry) => entry.destination);
  assert.equal(new Set(outputs).size, outputs.length);
  assert.ok(data.files.some((entry) => entry.source === "core/schema/solution-graph.schema.json" && entry.destination === "schema/solution-graph.schema.json"));
  assert.ok(data.files.some((entry) => entry.source === "templates/instructor-workspace/AGENTS.md" && entry.destination === "AGENTS.md"));
  assert.ok(data.files.some((entry) => entry.source === "workflow/assignment-policy.md" && entry.destination === "prompts/assignment-policy.md"));
  assert.ok(data.files.some((entry) => entry.source === "templates/instructor-workspace/assignment-policy.template.yaml" && entry.destination === "templates/assignment-policy.template.yaml"));
  assert.ok(data.files.some((entry) => entry.source === "workflow/preaudit-discovery.md" && entry.destination === "prompts/preaudit-discovery.md"));
  assert.ok(data.files.some((entry) => entry.source === "templates/instructor-workspace/discovery-report.template.md" && entry.destination === "templates/discovery-report.template.md"));
  assert.equal(data.files.some((entry) => entry.source.startsWith("app/")), false);
});

test("public workflow advertises new paths and precommit human decision gate", async () => {
  const agent = await readFile(new URL("../AGENTS.md", import.meta.url), "utf8");
  const start = await readFile(new URL("../workflow/start-with-gpt-work.md", import.meta.url), "utf8");
  const generator = await readFile(new URL("../workflow/generate-solution-graph.md", import.meta.url), "utf8");
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  const pages = await readFile(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8");
  assert.match(agent, /core\/SCHEMA\.md/);
  assert.match(start, /core\/schema\/solution-graph\.schema\.json/);
  assert.match(start, /docs\/getting-started\.md/);
  assert.match(generator, /Pause for an explicit response/);
  assert.match(readme, /Start Workflow/);
  assert.match(pages, /path: dist/);
  assert.doesNotMatch(pages, /path: \.\s*$/m);
});

test("current website and repo links appear in all public onboarding files", async () => {
  const paths = [
    "../README.md",
    "../docs/getting-started.md",
    "../core/SCHEMA.md",
    "../workflow/start-with-gpt-work.md",
    "../templates/instructor-workspace/README.md",
    "../app/src/app.js"
  ];
  const contents = await Promise.all(paths.map((path) =>
    readFile(new URL(path, import.meta.url), "utf8")
  ));
  for (const [index, content] of contents.entries()) {
    assert.equal(content.includes("hoooopla/Math-hyper-graph-visualization-"), false, paths[index]);
    assert.equal(content.includes("hoooopla.github.io/Math-hyper-graph-visualization-"), false, paths[index]);
  }
  assert.match(contents[0], /https:\/\/hoooopla\.github\.io\/proof-atlas\//);
  assert.match(contents[1], /https:\/\/github\.com\/hoooopla\/proof-atlas/);
  assert.match(contents[2], /https:\/\/hoooopla\.github\.io\/proof-atlas\//);
  assert.match(contents[3], /https:\/\/github\.com\/hoooopla\/proof-atlas/);
  assert.match(contents[5], /github\.com\/hoooopla\/proof-atlas\/blob\/main\/docs\/getting-started\.md/);
});
