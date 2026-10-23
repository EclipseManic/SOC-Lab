import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(resolve(siteRoot, "src/data.ts"), "utf8");

const failures = [];

if (/Â|â€|Ã/.test(source)) {
  failures.push("data.ts contains mojibake or double-encoded characters");
}

const stagesBlock = source.slice(
  source.indexOf("export const stages"),
  source.indexOf("export const chapters"),
);
const reportBlock = source.slice(
  source.indexOf("export const reportDocs"),
  source.indexOf("export const evidenceItems"),
);

const stageIds = [...stagesBlock.matchAll(/id: "(\d{2})",\n    slug:/g)].map(
  (match) => match[1],
);
if (stageIds.length !== 20) {
  failures.push(`expected 20 stages, found ${stageIds.length}`);
}

const uniqueStageIds = new Set(stageIds);
for (let i = 1; i <= 20; i += 1) {
  const id = String(i).padStart(2, "0");
  if (!uniqueStageIds.has(id)) failures.push(`missing stage ${id}`);
}

const gapIds = new Set(
  [...stagesBlock.matchAll(/gap: "(DG-\d{2})"/g)].map((match) => match[1]),
);
for (let i = 1; i <= 20; i += 1) {
  const id = `DG-${String(i).padStart(2, "0")}`;
  if (!gapIds.has(id)) failures.push(`missing gap ${id}`);
}

const untested = [...stagesBlock.matchAll(/status: "Not tested"/g)].length;
if (untested !== 20) {
  failures.push(`expected 20 Not tested stages, found ${untested}`);
}

const reportDocs = [...reportBlock.matchAll(/path: "05-Incident-Report\//g)].length;
if (reportDocs !== 6) {
  failures.push(`expected 6 report documents, found ${reportDocs}`);
}

if (failures.length) {
  console.error("Data check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Data check passed: ${stageIds.length} stages, ${gapIds.size} gap IDs, ${reportDocs} report documents.`,
);
