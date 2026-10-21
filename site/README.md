# SOC Lab visual documentation

A dependency-free presentation layer for the SOC Lab repository. It turns the attack stages, detection checks, investigation cases, and report package into one guided reading experience.

The Markdown documents remain the source of truth. The site is built from the same stage and coverage data and links back to the detailed records.

![SOC Lab preview](assets/preview.png)

## Preview locally

From the repository root:

```powershell
python -m http.server 8000 --directory site
```

Open [http://localhost:8000/](http://localhost:8000/).

There is no build step. The site is plain HTML, CSS, and JavaScript, so opening `site/index.html` directly also works.

## What is here

| Path | Purpose |
|---|---|
| `index.html` | Page structure, narrative sections, and the stage dialog |
| `assets/styles.css` | Dark SOC design system, responsive tables, and motion |
| `assets/app.js` | Stage cards, phase filters, coverage matrix, and dialog behaviour |
| `assets/stages.js` | The 20-stage data model used by the cards and coverage table |
| `assets/preview.png` | Preview image for this folder and social sharing |
| `../.github/workflows/pages.yml` | GitHub Pages deployment for this folder |

## Deploy with GitHub Pages

Live site: <https://eclipsemanic.github.io/SOC-Lab/>

1. Push the repository to `main`.
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Run the `Deploy documentation site` workflow, or push another commit to `main`.

The workflow uploads only the `site/` folder. Detailed document links point to the repository on `main`, so they keep working after deployment.

## Editing

- Update stage titles, plain-language summaries, telemetry, gap IDs, and case labels in `assets/stages.js`.
- Update section copy and the dialog shell in `index.html`.
- Update layout, colours, tables, and animation in `assets/styles.css`.
- Keep every stage marked `Not tested` until evidence and a validated detection result exist.
