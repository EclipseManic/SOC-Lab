# 05 — Incident Report

This section turns the stage evidence into a formal incident report. It is the summary a hiring manager, SOC lead, or reviewer reads first.

## Report package

| Document | Purpose |
|---|---|
| [incident-report.md](incident-report.md) | Formal report: summary, scope, analysis, impact, recommendations |
| [timeline.md](timeline.md) | Consolidated attack and response timeline |
| [iocs.md](iocs.md) | Indicators of compromise with confidence and source stage |
| [mitre-attack-mapping.md](mitre-attack-mapping.md) | Stage-by-stage ATT&CK mapping and detection status |
| [response-actions.md](response-actions.md) | Containment, eradication, and recovery actions |
| [lessons-learned.md](lessons-learned.md) | What worked, what failed, and what changes next |

## Framework alignment

The report follows the structure used by NIST SP 800-61r3 and the SANS PICERL model:

1. Preparation
2. Detection and analysis
3. Containment, eradication, and recovery
4. Post-incident activity and lessons learned

The report is a summary. Detail stays in the stage notes and case files; the report links to them instead of copying them.

## Writing rules

- Write the executive summary for a non-technical reader.
- Keep the technical narrative precise and evidence-linked.
- Separate confirmed facts from hypotheses.
- State clearly whether response actions were executed or only recommended.
- Never include live credentials, hashes, keys, or public IPs.
- Every claim should point to a stage, a log, or a screenshot.

## Status

Scaffolded. The report will be completed after the stage investigations and the three TheHive cases are finished.
