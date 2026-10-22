import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseYaml } from "../app/src/yaml-lite.js";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("assignment policy template is inert and contains no preapproved decisions", async () => {
  const text = await read("templates/instructor-workspace/assignment-policy.template.yaml");
  const policy = parseYaml(text);
  assert.match(text, /TEMPLATE ONLY/);
  assert.match(text, /AFTER explicit instructor/);
  assert.match(policy.assignment_id, /REPLACE_WITH_ASSIGNMENT_ID/);
  assert.deepEqual(policy.decisions, []);
  assert.deepEqual(policy.problem_overrides, []);
  assert.equal(Object.hasOwn(policy, "course_defaults"), false);
});

test("the full proof graph follows an early consolidated instructor gate", async () => {
  const generate = await read("workflow/generate-solution-graph.md");
  const checkpoint = generate.indexOf("Phase A");
  const fullGraph = generate.indexOf("Phase B");
  assert.ok(checkpoint >= 0 && fullGraph > checkpoint);
  const phaseA = generate.slice(checkpoint, fullGraph);
  assert.match(phaseA, /candidate approaches/);
  assert.match(phaseA, /deduplicated assignment-wide candidate inventory/);
  assert.match(phaseA, /Pause for an explicit response/);
  assert.match(phaseA, /No complete proof/);
  assert.match(generate, /Checkpoint B — newly discovered dependencies only/);
  assert.match(generate, /Stop the affected routes/);
  assert.match(generate, /same-assignment/);
  assert.match(generate, /policy\.yaml/);
});

test("policy records explicit per-assignment decisions and scoped overrides", async () => {
  const policy = await read("workflow/assignment-policy.md");
  const verifier = await read("workflow/verify-solution-graph.md");
  const starter = await read("workflow/start-with-gpt-work.md");
  assert.match(policy, /do \*\*not\*\* transfer approval/);
  assert.match(policy, /approval_evidence/);
  assert.match(policy, /problem_overrides/);
  assert.match(policy, /An override takes precedence/);
  assert.match(policy, /missing decision means/);
  assert.match(policy, /not part of canonical/);
  assert.match(verifier, /earliest pass is exploratory/);
  assert.match(verifier, /same assignment/);
  assert.match(verifier, /Delta checkpoint/);
  assert.match(verifier, /rather than duplicating the entire assignment table/);
  assert.match(starter, /EARLY CHECKPOINT/);
  assert.match(starter, /NEVER reusable/);
  assert.match(starter, /assignments\/\<assignment-id\>\/policy\.yaml/);
  assert.match(starter, /new\s+theorem or justification dependencies/);
});

test("assignment policy stays separate from the canonical graph schema", async () => {
  const schema = JSON.parse(await read("core/schema/solution-graph.schema.json"));
  const spec = await read("core/SCHEMA.md");
  const manifest = JSON.parse(await read("templates/instructor-workspace/manifest.json"));
  assert.equal(schema.properties.policy, undefined);
  assert.equal(schema.properties.theorem_policy, undefined);
  assert.ok(schema.required.includes("theorems"));
  assert.ok(schema.required.includes("edges"));
  assert.match(spec, /assignment's/);
  assert.match(spec, /policy\.yaml/);
  assert.ok(manifest.files.some((file) =>
    file.source === "workflow/assignment-policy.md" && file.destination === "prompts/assignment-policy.md"));
  assert.ok(manifest.files.some((file) =>
    file.source === "templates/instructor-workspace/assignment-policy.template.yaml" &&
    file.destination === "templates/assignment-policy.template.yaml"));
});
