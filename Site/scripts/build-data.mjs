import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(siteRoot, "..");
const generatedRoot = resolve(siteRoot, "src", "generated");

const sourcePaths = {
  index: "INDEX.md",
  timeline: "05-Incident-Report/timeline.md",
  alerts: "06-Resources/Alerts/thehive_alerts.json",
  report: "05-Incident-Report/incident-report.md",
  reportReadme: "05-Incident-Report/README.md",
  labSetup: "01-Lab-Setup/README.md",
  preferredNetworkTopology: "01-Lab-Setup/network-topology.md",
};

function readRepoFile(relativePath) {
  const absolutePath = resolve(repoRoot, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Required source file not found: ${relativePath}`);
  }
  return readFileSync(absolutePath, "utf8");
}

function stripMarkdown(value) {
  return value
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\\/g, "")
    .trim();
}

function parseLink(value) {
  return value.match(/\[[^\]]+\]\(([^)]+)\)/)?.[1] ?? null;
}

function parseMetric(indexText, label) {
  const line = indexText
    .split(/\r?\n/)
    .find((candidate) => candidate.includes(`**${label}**`));
  const match = line?.match(/\*\*(\d+)\s+stages\s+\(([\d.]+)%\)\*\*/);
  if (!match) {
    throw new Error(`Could not parse INDEX.md metric row: ${label}`);
  }
  return { count: Number(match[1]), percent: Number(match[2]) };
}

function parseStageStatus(rawStatus) {
  if (/Offline Gap/i.test(rawStatus)) {
    return {
      status: "Detection gap",
      coverageClass: "offline-gap",
      hasDirectDetection: false,
      hasOperationalAlert: false,
    };
  }
  if (/Target Logging Gap/i.test(rawStatus)) {
    return {
      status: "Logging gap",
      coverageClass: "target-logging-gap",
      hasDirectDetection: false,
      hasOperationalAlert: false,
    };
  }
  if (/Direct Detection/i.test(rawStatus)) {
    return {
      status: "Detected",
      coverageClass: "direct-detection",
      hasDirectDetection: true,
      hasOperationalAlert: true,
    };
  }
  if (/Operational Coverage/i.test(rawStatus)) {
    return {
      status: "Detected",
      coverageClass: "operational-coverage",
      hasDirectDetection: false,
      hasOperationalAlert: true,
    };
  }
  if (/Rule Failure/i.test(rawStatus)) {
    return {
      status: "Rule failure",
      coverageClass: "rule-failure",
      hasDirectDetection: false,
      hasOperationalAlert: false,
    };
  }
  if (/Not tested/i.test(rawStatus)) {
    return {
      status: "Not tested",
      coverageClass: "not-tested",
      hasDirectDetection: false,
      hasOperationalAlert: false,
    };
  }
  throw new Error(`Unknown stage status in INDEX.md: ${rawStatus}`);
}

function parseTraceabilityMatrix(indexText) {
  const stages = [];
  for (const line of indexText.split(/\r?\n/)) {
    if (!/^\|\s*\d{2}\s*\|/.test(line)) continue;

    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length < 9) {
      throw new Error(`Malformed traceability row: ${line}`);
    }

    const [id, title, techniqueId, attackCell, alertObserved, ruleAlertId, investigationCell, caseLabel, rawStatus] = cells;
    const status = parseStageStatus(rawStatus);
    stages.push({
      id,
      title: stripMarkdown(title),
      techniqueId: stripMarkdown(techniqueId),
      attackPath: parseLink(attackCell),
      alertObserved: stripMarkdown(alertObserved),
      ruleAlertId: stripMarkdown(ruleAlertId),
      investigationPath: parseLink(investigationCell),
      caseLabel: stripMarkdown(caseLabel),
      evidenceStatus: stripMarkdown(rawStatus),
      ...status,
    });
  }

  const expectedIds = Array.from({ length: 20 }, (_, index) => String(index + 1).padStart(2, "0"));
  const actualIds = stages.map((stage) => stage.id);
  if (stages.length !== expectedIds.length || expectedIds.some((id) => !actualIds.includes(id))) {
    throw new Error(`INDEX.md traceability matrix must contain stages ${expectedIds.join(", ")}`);
  }
  return stages;
}

function parseTimeline(timelineText) {
  const t0 = timelineText.match(/T_0\$?\s*=\s*`([^`]+)`/)?.[1];
  if (!t0) throw new Error("Could not parse T0 from timeline.md");

  const events = [];
  for (const line of timelineText.split(/\r?\n/)) {
    if (!/^\|\s*\*\*\$T_0/.test(line)) continue;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length < 6) throw new Error(`Malformed timeline row: ${line}`);

    const [elapsed, stageId, phase, telemetryEvent, sourceSensor, evidenceReference] = cells;
    const offsets = [...elapsed.matchAll(/(\d+)m/g)].map((match) => Number(match[1]) * 60);
    const offsetSeconds = offsets[0] ?? 0;
    const endOffsetSeconds = offsets[1] ?? offsetSeconds;
    const timestamp = elapsed.match(/\(`?(\d{2}:\d{2}:\d{2})/)?.[1] ?? null;

    events.push({
      order: events.length + 1,
      stageId,
      phase: stripMarkdown(phase),
      elapsedLabel: stripMarkdown(elapsed),
      offsetSeconds,
      endOffsetSeconds,
      timestamp,
      telemetryEvent: stripMarkdown(telemetryEvent),
      sourceSensor: stripMarkdown(sourceSensor),
      evidenceReference: stripMarkdown(evidenceReference),
    });
  }

  if (events.length !== 20) {
    throw new Error(`timeline.md must contain 20 stage events, found ${events.length}`);
  }

  return {
    t0,
    durationMinutes: Math.max(...events.map((event) => event.endOffsetSeconds)) / 60,
    executionOrder: events.map((event) => event.stageId),
    events,
  };
}

function parseAlerts(alertText) {
  const alerts = JSON.parse(alertText);
  if (!Array.isArray(alerts)) throw new Error("thehive_alerts.json must contain an array");

  const timeToDetectValues = [];
  const summaries = alerts.map((alert) => {
    if (alert.newDate - alert.date !== alert.timeToDetect) {
      throw new Error(`Alert ${alert.sourceRef ?? alert._id} has inconsistent timeToDetect`);
    }
    timeToDetectValues.push(alert.timeToDetect);
    return {
      id: alert._id,
      sourceRef: alert.sourceRef,
      title: alert.title,
      severity: alert.severity,
      severityLabel: alert.severityLabel,
      date: alert.date,
      newDate: alert.newDate,
      timeToDetectMs: alert.timeToDetect,
      tags: alert.tags,
    };
  });

  const sorted = [...timeToDetectValues].sort((a, b) => a - b);
  const midpoint = sorted.length / 2;
  const median = midpoint % 1 === 0
    ? (sorted[midpoint - 1] + sorted[midpoint]) / 2
    : sorted[Math.floor(midpoint)];

  return {
    count: summaries.length,
    timeToDetect: {
      unit: "milliseconds",
      verifiedAgainstTimestamps: true,
      min: Math.min(...timeToDetectValues),
      max: Math.max(...timeToDetectValues),
      median,
    },
    severityCounts: summaries.reduce((counts, alert) => {
      counts[alert.severityLabel] = (counts[alert.severityLabel] ?? 0) + 1;
      return counts;
    }, {}),
    alerts: summaries,
  };
}

function parseReportStatus(reportText) {
  const status = reportText.match(/\|\s*\*\*Report Status\*\*\s*\|\s*([^|]+)\|/)?.[1]?.trim();
  if (!status) throw new Error("Could not parse Report Status from incident-report.md");
  return status;
}

function parseReportSectionStatus(reportReadmeText) {
  const status = reportReadmeText.match(/\*\*(Draft, not yet validated):\*\*/)?.[1];
  if (!status) throw new Error("Could not parse report section verification status from 05-Incident-Report/README.md");
  return status;
}

function parseGateway(labSetupText, reportText) {
  const external = labSetupText.match(/ens33[^\n]*?(192\.168\.232\.\d+)/)?.[1];
  const internal = labSetupText.match(/ens37[^\n]*?(192\.168\.56\.\d+)/)?.[1];
  if (!external || !internal) throw new Error("Could not parse Suricata gateway addresses from 01-Lab-Setup/README.md");

  const reportMismatches = [...reportText.matchAll(/192\.168\.56\.1(?:\/|`|\s)/g)].map(() => "05-Incident-Report/incident-report.md references 192.168.56.1");
  return {
    authoritativeSource: sourcePaths.labSetup,
    preferredSourceFound: existsSync(resolve(repoRoot, sourcePaths.preferredNetworkTopology)),
    externalAddress: external,
    internalAddress: internal,
    mismatches: [...new Set(reportMismatches)],
  };
}

function writeGenerated(name, value) {
  writeFileSync(resolve(generatedRoot, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

const indexText = readRepoFile(sourcePaths.index);
const timelineText = readRepoFile(sourcePaths.timeline);
const reportText = readRepoFile(sourcePaths.report);
const reportReadmeText = readRepoFile(sourcePaths.reportReadme);
const labSetupText = readRepoFile(sourcePaths.labSetup);
const alerts = parseAlerts(readRepoFile(sourcePaths.alerts));
const stages = parseTraceabilityMatrix(indexText);
const timeline = parseTimeline(timelineText);

const direct = parseMetric(indexText, "Direct Target Detections");
const operational = parseMetric(indexText, "Operational Alert Coverage");
const loggingGaps = parseMetric(indexText, "Target Logging Gaps");
const offlineGaps = parseMetric(indexText, "Inherent Offline Gaps");
const ruleFailures = parseMetric(indexText, "Rule Failure");
const reportStatus = parseReportStatus(reportText);
const reportSectionStatus = parseReportSectionStatus(reportReadmeText);
const gateway = parseGateway(labSetupText, reportText);

if (timeline.durationMinutes !== 74) {
  throw new Error(`Expected a 74-minute timeline, found ${timeline.durationMinutes} minutes`);
}
if (direct.count !== stages.filter((stage) => stage.hasDirectDetection).length) {
  throw new Error("INDEX.md direct detection metric disagrees with the traceability matrix");
}
if (operational.count !== stages.filter((stage) => stage.hasOperationalAlert).length) {
  throw new Error("INDEX.md operational alert metric disagrees with the traceability matrix");
}
if (loggingGaps.count !== stages.filter((stage) => stage.coverageClass === "target-logging-gap").length) {
  throw new Error("INDEX.md target logging gap metric disagrees with the traceability matrix");
}
if (offlineGaps.count !== stages.filter((stage) => stage.coverageClass === "offline-gap").length) {
  throw new Error("INDEX.md offline gap metric disagrees with the traceability matrix");
}
if (alerts.count !== 46) {
  throw new Error(`Expected 46 TheHive alerts, found ${alerts.count}`);
}

mkdirSync(generatedRoot, { recursive: true });

writeGenerated("stages.json", {
  source: sourcePaths.index,
  stages,
});
writeGenerated("timeline.json", {
  source: sourcePaths.timeline,
  ...timeline,
});
writeGenerated("alerts.json", {
  source: sourcePaths.alerts,
  ...alerts,
});
writeGenerated("network.json", {
  source: sourcePaths.labSetup,
  ...gateway,
});
writeGenerated("metrics.json", {
  sources: sourcePaths,
  stageCount: stages.length,
  durationMinutes: timeline.durationMinutes,
  directDetectionCount: direct.count,
  directDetectionPercent: direct.percent,
  operationalAlertCount: operational.count,
  operationalAlertPercent: operational.percent,
  targetLoggingGapCount: loggingGaps.count,
  targetLoggingGapPercent: loggingGaps.percent,
  offlineGapCount: offlineGaps.count,
  offlineGapPercent: offlineGaps.percent,
  ruleFailureCount: ruleFailures.count,
  ruleFailurePercent: ruleFailures.percent,
  totalGapCount: loggingGaps.count + offlineGaps.count,
  theHiveAlertCount: alerts.count,
  alertSeverityCounts: alerts.severityCounts,
  timeToDetect: alerts.timeToDetect,
  reportStatus,
  reportDocumentStatuses: {
    "05-Incident-Report/incident-report.md": reportStatus,
    "05-Incident-Report/timeline.md": reportSectionStatus,
    "05-Incident-Report/iocs.md": reportSectionStatus,
    "05-Incident-Report/mitre-attack-mapping.md": reportSectionStatus,
    "05-Incident-Report/response-actions.md": reportSectionStatus,
    "05-Incident-Report/lessons-learned.md": reportSectionStatus,
  },
  gateway: {
    internalAddress: gateway.internalAddress,
    externalAddress: gateway.externalAddress,
    authoritativeSource: gateway.authoritativeSource,
    mismatches: gateway.mismatches,
  },
});

console.log(`Generated SOC Lab data: ${stages.length} stages, ${alerts.count} TheHive alerts, ${timeline.durationMinutes}-minute timeline.`);
