import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".yaml": "text/yaml" };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const target = normalize(join(root, relative));
    if (!target.startsWith(root)) throw new Error("Forbidden");
    const info = await stat(target);
    const file = await readFile(info.isDirectory() ? join(target, "index.html") : target);
    response.writeHead(200, { "content-type": `${types[extname(target)] ?? "application/octet-stream"}; charset=utf-8`, "cache-control": "no-store" });
    response.end(file);
  } catch {
    response.writeHead(404, { "content-type": "text/plain" });
    response.end("Not found");
  }
});
server.listen(4173, "127.0.0.1", () => console.log("Local: http://127.0.0.1:4173"));
