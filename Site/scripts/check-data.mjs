import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readText(relativePath) {
  return readFileSync(resolve(siteRoot, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

const failures = [];
const generatedPaths = [
  "src/generated/metrics.json",
  "src/generated/stages.json",
  "src/generated/timeline.json",
  "src/generated/alerts.json",
  "src/generated/network.json",
];

for (const path of generatedPaths) {
  if (!existsSync(resolve(siteRoot, path))) failures.push(`missing generated file: ${path}`);
}

if (failures.length) {
  console.error("Data check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const metrics = readJson("src/generated/metrics.json");
const generatedStages = readJson("src/generated/stages.json").stages;
const timeline = readJson("src/generated/timeline.json");
const alerts = readJson("src/generated/alerts.json");
const network = readJson("src/generated/network.json");
const dataSource = readText("src/data.ts");
const hero = readText("src/components/story/visual-hero.tsx");
const signalAct = readText("src/components/story/visual-signal.tsx");
const recordAct = readText("src/components/story/visual-record.tsx");
const indexHtml = readText("index.html");
const siteReadme = readText("README.md");

function expect(condition, message) {
  if (!condition) failures.push(message);
}

const expectedStageIds = Array.from({ length: metrics.stageCount }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);
const stageIds = generatedStages.map((stage) => stage.id);
const stageStatusCounts = generatedStages.reduce((counts, stage) => {
  counts[stage.status] = (counts[stage.status] ?? 0) + 1;
  return counts;
}, {});

expect(metrics.stageCount === 20, `expected 20 stages, found ${metrics.stageCount}`);
expect(generatedStages.length === metrics.stageCount, "generated stage count disagrees with metrics.json");
expect(expectedStageIds.every((id) => stageIds.includes(id)), "generated stages are missing one or more IDs");
expect(new Set(stageIds).size === stageIds.length, "generated stage IDs are not unique");
expect(stageStatusCounts.Detected === metrics.operationalAlertCount, "Detected stage count disagrees with operational alert count");
expect(stageStatusCounts["Logging gap"] === metrics.targetLoggingGapCount, "Logging gap count disagrees with metrics.json");
expect(stageStatusCounts["Detection gap"] === metrics.offlineGapCount, "Detection gap count disagrees with metrics.json");
expect((stageStatusCounts["Rule failure"] ?? 0) === metrics.ruleFailureCount, "Rule failure count disagrees with metrics.json");
expect((stageStatusCounts["Not tested"] ?? 0) === 0, "site still contains Not tested stages despite the authoritative matrix");
expect(generatedStages.filter((stage) => stage.hasDirectDetection).length === metrics.directDetectionCount, "direct-target detection count disagrees with metrics.json");
expect(generatedStages.filter((stage) => stage.hasOperationalAlert).length === metrics.operationalAlertCount, "operational alert stage count disagrees with metrics.json");
expect(metrics.totalGapCount === metrics.targetLoggingGapCount + metrics.offlineGapCount, "total gap count is not the sum of named gap classes");

expect(timeline.t0 === "11:40:09", `expected T0 11:40:09 UTC, found ${timeline.t0}`);
expect(timeline.durationMinutes === metrics.durationMinutes, "timeline duration disagrees with metrics.json");
expect(timeline.events.length === metrics.stageCount, "timeline event count disagrees with stage count");
expect(new Set(timeline.executionOrder).size === metrics.stageCount, "timeline execution order contains duplicate stages");
expect(timeline.executionOrder.join(",") === "01,02,03,04,05,06,07,08,09,12,10,11,13,14,15,17,18,19,16,20", "timeline execution order drifted from timeline.md");

expect(alerts.count === metrics.theHiveAlertCount, "TheHive alert count disagrees with metrics.json");
expect(alerts.count === 46, `expected 46 TheHive alerts, found ${alerts.count}`);
expect(alerts.timeToDetect.unit === "milliseconds", "timeToDetect unit was not verified as milliseconds");
expect(alerts.timeToDetect.verifiedAgainstTimestamps === true, "timeToDetect was not verified against date/newDate timestamps");
expect(alerts.alerts.every((alert) => alert.newDate - alert.date === alert.timeToDetectMs), "an alert timeToDetect value disagrees with its timestamps");

expect(network.internalAddress === "192.168.56.150", "authoritative gateway address is not 192.168.56.150");
expect(network.authoritativeSource === "01-Lab-Setup/README.md", "unexpected gateway authority source");
expect(network.mismatches.some((mismatch) => mismatch.includes("192.168.56.1")), "gateway mismatch was not recorded");

expect(dataSource.includes("export const operationalAlertCount = metrics.operationalAlertCount"), "data.ts does not derive operational alerts from generated metrics");
expect(dataSource.includes("export const directDetectionCount = metrics.directDetectionCount"), "data.ts does not derive direct detections from generated metrics");
expect(dataSource.includes("export const gapCount = metrics.totalGapCount"), "data.ts does not derive total gaps from generated metrics");
expect(hero.includes("metrics.stageCount") && hero.includes("metrics.durationMinutes") && hero.includes("metrics.operationalAlertCount") && hero.includes("metrics.totalGapCount"), "hero stats are not derived from generated metrics");
expect(signalAct.includes("metrics.directDetectionCount") && signalAct.includes("metrics.operationalAlertCount") && signalAct.includes("metrics.totalGapCount"), "signal copy is not derived from generated metrics");
expect(recordAct.includes("metrics.reportStatus"), "record copy is not derived from report metadata");
expect(Object.keys(metrics.reportDocumentStatuses ?? {}).length === 6, "report document status metadata is incomplete");
expect(metrics.reportDocumentStatuses?.["05-Incident-Report/incident-report.md"] === "Final / Resolved", "incident report status drifted from incident-report.md");

expect(indexHtml.includes(`${metrics.stageCount} Active Directory attack stages`), "index.html description is missing the generated stage count");
expect(indexHtml.includes(`${metrics.durationMinutes} minutes`), "index.html metadata is missing the generated duration");
expect(indexHtml.includes(`${metrics.operationalAlertCount} operational alerts`), "index.html metadata is missing the generated operational alert count");
expect(indexHtml.includes(`${metrics.directDetectionCount} direct-target detections`), "index.html metadata is missing the generated direct detection count");
expect(indexHtml.includes(`${metrics.totalGapCount} named gaps`), "index.html metadata is missing the generated gap count");
expect(!/twenty untested detection checks|all 20 stages at Not tested/i.test(indexHtml), "index.html still contains stale untested copy");

expect(siteReadme.includes(`${metrics.stageCount} stages over ${metrics.durationMinutes} minutes`), "Site/README.md is missing the generated stage duration facts");
expect(siteReadme.includes(`${metrics.directDetectionCount} direct-target detections`), "Site/README.md is missing the direct-target metric");
expect(siteReadme.includes(`${metrics.operationalAlertCount} operational alerts`), "Site/README.md is missing the operational alert metric");
expect(siteReadme.includes(`${metrics.theHiveAlertCount} TheHive alerts`), "Site/README.md is missing the TheHive alert count");
expect(siteReadme.includes("Final / Resolved"), "Site/README.md is missing the report status");
expect(!siteReadme.includes("Keep all 20 stages at `Not tested`"), "Site/README.md still claims all stages are untested");
expect(!siteReadme.includes("The report package is a draft"), "Site/README.md still claims the incident report is a draft");

if (failures.length) {
  console.error("Data check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Data check passed: ${metrics.stageCount} stages (${metrics.directDetectionCount} direct-target, ${metrics.operationalAlertCount} operational, ${metrics.totalGapCount} named gaps), ${metrics.theHiveAlertCount} TheHive alerts, T0 ${timeline.t0} UTC.`,
);
