# SOC Lab reading layer

The site at <https://soc-lab.eclipsemanic.me/> is a narrative front door to the repository. It is a six-act story: the lab, the build, the attack, the signal, the case, and the record.

The site now covers all six acts: the lab, the build, the attack, the signal, the case, and the record. The truth layer is generated from the repository: 20 stages over 74 minutes, 14 direct-target detections (70.0%), 16 operational alerts (80.0%), 46 TheHive alerts, and 4 named gaps (offline 04/11; logging 09/12). The incident report metadata is `Final / Resolved`; the three investigation case files remain explicitly marked as draft.

The Markdown, logs, cases, and report files are authoritative. This app is a reading layer over them.

![SOC Lab preview](public/preview.png)

## Stack

- React 19 and TypeScript
- Vite 8
- Tailwind CSS 4 with a small set of semantic design tokens
- shadcn/ui-style Radix primitives
- Motion for scroll-driven scenes, entrances, and dialog animation
- Lucide icons

## Local development

```powershell
cd Site
npm ci
npm run dev
```

Useful checks:

```powershell
npm run check:data
npm run build
npm run preview
```

`check:data` verifies the content invariants: 20 stages, 20 gap IDs, and 6 report documents. `build` runs the TypeScript project build before the Vite production build.

## Source map

| Path | Purpose |
|---|---|
| `src/data.ts` | Stage, chapter, case, report, evidence, status, and generated truth-layer data |
| `src/components/story/` | Visual hero path, topology, playback, signal heatmap, case lanes, evidence reel, and record |
| `src/components/ui/` | Small Radix/shadcn-style primitives used by the visual scenes |
| `src/index.css` | Tailwind theme tokens, base styles, and shared utilities |
| `scripts/build-data.mjs` | Parses authoritative Markdown/JSON sources into `src/generated/*.json` |
| `scripts/check-data.mjs` | Content integrity checks |
| `public/` | CNAME, robots.txt, preview image, and compressed evidence reel assets |
| `dist/` | Generated production output; do not edit by hand |

## Content rules

- Keep the evidence vocabulary from `INDEX.md`: `Detected`, `Logging gap`, `Detection gap`, `Rule failure`, and `Not tested`.
- Do not flatten the metrics: 14 direct-target detections (70.0%) and 16 operational alerts (80.0%) are different claims.
- The two offline stages are 04 and 11; the two target logging gaps are 09 and 12.
- Keep `verifiedCount` and the hero metrics derived from `src/generated/metrics.json`; do not hardcode a detection count.
- Treat a missing artifact as a documented gap, not as proof.
- Attack and alert screenshots are published as captured from the isolated lab.
- The authoritative gateway address is `192.168.56.150` from `01-Lab-Setup/README.md`. A stale `192.168.56.1` reference remains in `05-Incident-Report/incident-report.md`; the site uses `.150` and records the mismatch in generated data. The architecture PNG is kept for repository documentation and is not used as the site truth layer.
- Record placeholders (`DG-01` through `DG-20`) stay reserved until validated evidence exists.
- The incident report is marked `Final / Resolved`; the investigation case files remain `Draft, not yet validated`. Confirmed facts, hypotheses, and recommended actions remain separate.

## Deployment

The workflow at `../.github/workflows/pages.yml` sets up Node 22, runs `npm ci`, `npm run check:data`, and `npm run build`, then uploads `Site/dist` to GitHub Pages.

In GitHub, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. The custom domain is carried by `public/CNAME`.

Live site: <https://soc-lab.eclipsemanic.me/>
