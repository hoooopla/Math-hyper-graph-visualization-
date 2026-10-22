import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("optional pre-audit discovery runs after independent sketch but before policy checkpoint", async () => {
  const generator = await read("workflow/generate-solution-graph.md");
  const preliminary = generator.indexOf("## Phase A");
  const optional = generator.indexOf("### Optional Phase A2");
  const checkpoint = generator.indexOf("5. Present a **single consolidated checkpoint table**");
  const full = generator.indexOf("## Phase B");
  assert.ok(preliminary >= 0 && preliminary < optional);
  assert.ok(optional < checkpoint && checkpoint < full);
  assert.match(generator, /If no explicit opt-in, attachments or permitted access exist/);
  assert.match(generator, /skip/);
  assert.match(generator, /independently reconstructing any candidates/);
  assert.match(generator, /do \*\*not\*\* grade students/);
  assert.match(generator, /discovery\.md/);
  assert.match(generator, /Stop the affected routes/);
});

test("discovery prompt screens batches, records coverage and examines outliers without student verdicts", async () => {
  const doc = await read("workflow/preaudit-discovery.md");
  assert.match(doc, /Before processing, verify that the instructor is authorized/);
  assert.match(doc, /Anchor to the problem first/);
  assert.match(doc, /private coverage register/);
  assert.match(doc, /Breadth-first preview/);
  assert.match(doc, /every accessible submission/);
  assert.match(doc, /Cluster by mathematics/);
  assert.match(doc, /Targeted deep look/);
  assert.match(doc, /representative examples/);
  assert.match(doc, /outlier/);
  assert.match(doc, /unreadable/);
  assert.match(doc, /not accessible/);
  assert.match(doc, /do not claim/);
  assert.match(doc, /not student homework auditing/);
  assert.match(doc, /do not assign grades, correctness labels/);
  assert.match(doc, /does not automatically add|do not automatically add/);
  assert.match(doc, /never invent/);
});

test("report template is a sanitized candidate and coverage report, not a gradebook", async () => {
  const report = await read("templates/instructor-workspace/discovery-report.template.md");
  assert.match(report, /TEMPLATE ONLY/);
  assert.match(report, /Submissions received/);
  assert.match(report, /Opened\/examined/);
  assert.match(report, /Skipped\/unavailable\/unreviewed/);
  assert.match(report, /Coverage by problem/);
  assert.match(report, /Candidate approach clusters/);
  assert.match(report, /Rare approaches, outliers/);
  assert.match(report, /Potential recurring mistake patterns/);
  assert.match(report, /not student judgments/);
  assert.match(report, /no graph mutations yet/);
  assert.doesNotMatch(report, /student_name|student_id|numeric_grade|point_deduction/);
});

test("onboarding keeps discovery opt-in and outside canonical graph schema", async () => {
  const publicAgent = await read("AGENTS.md");
  const instructorAgent = await read("templates/instructor-workspace/AGENTS.md");
  const starter = await read("workflow/start-with-gpt-work.md");
  const spec = await read("core/schema/solution-graph.schema.json");
  const manifest = JSON.parse(await read("templates/instructor-workspace/manifest.json"));
  const readme = await read("README.md");
  assert.match(publicAgent, /only if explicitly opted in/);
  assert.match(instructorAgent, /opt-in|opts in/);
  assert.match(starter, /OPTIONAL PRE-AUDIT DISCOVERY/);
  assert.match(starter, /Without explicit opt-in, skip this stage/);
  assert.match(readme, /without\s+grading or judging any student's answer/);
  assert.equal(manifest.version, 4);
  assert.ok(manifest.files.some(f => f.destination === "prompts/preaudit-discovery.md"));
  assert.ok(manifest.files.some(f => f.destination === "templates/discovery-report.template.md"));
  assert.doesNotMatch(spec, /discovery_report|student_submissions|gradebook/);
  assert.match((await read("templates/instructor-workspace/.gitignore")), /private\/discovery-source-map/);
});
