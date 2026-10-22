import { cp, mkdir, readFile, access } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

export async function createWorkspace(outputPath) {
  const target = resolve(outputPath);
  if (target === resolve(root) || target === resolve(root, "src") || target.startsWith(resolve(root, "src") + "/")) {
    throw new Error("Refusing to overwrite Proof Atlas source files");
  }
  try {
    await access(target);
    throw new Error(`Destination already exists: ${target}. Choose an unused directory.`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const manifest = JSON.parse(await readFile(join(root, "templates/instructor-workspace/manifest.json"), "utf8"));
  const paths = [
    ...manifest.files.map((path) => [path, path]),
    ...Object.entries(manifest.templateFiles)
  ];
  for (const [source, output] of paths) {
    if ([source, output].some((path) => path.startsWith("/") || path.split("/").includes(".."))) {
      throw new Error("Invalid workspace path in manifest");
    }
    const destination = join(target, output);
    await mkdir(dirname(destination), { recursive: true });
    await cp(join(root, source), destination);
  }
  return target;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createWorkspace(process.argv[2] ?? "./instructor-workspace").then(
    (destination) => console.log(`Workspace created: ${destination}`),
    (error) => { console.error(error.message); process.exitCode = 1; }
  );
}
