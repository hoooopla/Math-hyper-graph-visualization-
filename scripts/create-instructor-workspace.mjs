import { cp, mkdir, readFile } from "node:fs/promises";
import { resolve, dirname, join, isAbsolute, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

function safeRelative(path) {
  return typeof path === "string" && path.length > 0
    && !isAbsolute(path) && !path.split(/[\\/]/).includes("..");
}

export async function createWorkspace(outputPath) {
  const target = resolve(outputPath);
  const sourceRoot = resolve(root);
  if (target === sourceRoot || ["app", "core", "workflow"].some((part) =>
      target === resolve(sourceRoot, part) || target.startsWith(resolve(sourceRoot, part) + sep))) {
    throw new Error("Refusing to overwrite Proof Atlas source files");
  }
  const manifest = JSON.parse(
    await readFile(join(root, "templates/instructor-workspace/manifest.json"), "utf8")
  );
  if (!Array.isArray(manifest.files) || !manifest.files.length) {
    throw new Error("Workspace manifest must have a nonempty files list");
  }
  const destinations = new Set();
  for (const { source, destination } of manifest.files) {
    if (!safeRelative(source) || !safeRelative(destination) || destinations.has(destination)) {
      throw new Error("Invalid or duplicate workspace path in manifest");
    }
    destinations.add(destination);
  }
  try {
    await mkdir(target);
  } catch (error) {
    if (error.code === "EEXIST") throw new Error(`Destination already exists: ${target}. Choose a NEW directory.`);
    throw error;
  }
  for (const { source, destination } of manifest.files) {
    const dest = join(target, destination);
    await mkdir(dirname(dest), { recursive: true });
    await cp(join(root, source), dest);
  }
  return target;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createWorkspace(process.argv[2] ?? "./instructor-workspace").then(
    (where) => console.log(`Created instructor workspace: ${where}`),
    (error) => { console.error(error.message); process.exitCode = 1; }
  );
}
