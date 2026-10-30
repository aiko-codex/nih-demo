import { cp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const apiBase = process.env.DEMO_API_BASE || "http://localhost:5173/api";
const outputDir = path.resolve(import.meta.dirname, "../public/demo");
const uploadsDir = path.resolve(import.meta.dirname, "../../backend/uploads");

async function fetchData(apiPath) {
  const response = await fetch(`${apiBase}${apiPath}`);
  const payload = await response.json();
  if (payload.error) throw new Error(`${apiPath}: ${payload.error.message}`);
  return payload.data;
}

function relativeUploadUrls(data) {
  const text = JSON.stringify(data);
  return JSON.parse(text.replace(/https?:\/\/[^"]*?\/uploads\//g, "/demo/uploads/"));
}

async function writeJson(relativePath, data) {
  const target = path.join(outputDir, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, JSON.stringify(relativeUploadUrls(data), null, 1));
}

const building = await fetchData("/building");
await writeJson("building.json", building);
await writeJson("settings/public.json", await fetchData("/settings/public"));

for (const block of building.blocks) {
  await writeJson(`blocks/${block.code}.json`, await fetchData(`/blocks/${block.code}`));
}

await cp(path.join(uploadsDir, "mock"), path.join(outputDir, "uploads/mock"), { recursive: true });
await cp(path.join(uploadsDir, "blocks"), path.join(outputDir, "uploads/blocks"), { recursive: true });
console.log(`Exported ${building.blocks.length} blocks.`);
