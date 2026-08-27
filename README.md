# Engage Media — Internal Tools Portal

A single internal landing page listing every tool, software, and in-house app Engage Media uses. Click a card, land on the tool. No login, no backend, no build step.

## How it's built
Static site — plain HTML/CSS/vanilla JS. The tool list lives in `data/tools.json`; nothing else needs to change when you add, edit, or remove a tool.

## Add or edit a tool
Open `data/tools.json` and add an entry to the `tools` array:

```json
{ "name": "Tool Name", "url": "https://...", "category": "project", "description": "One line.", "icon": "🔧" }
```

Categories are defined once at the top of the same file — add a new one there if you need a new grouping.

## Brand assets
Applied from `Engage Media Brand Guidelines 2025.pdf`: Poppins typeface, Miami Vice Blue (#41B6E6) as the primary neon accent, Miami Heat Black background, Miami Vice Fuchsia (#DB3EB1) as a secondary accent, and the pin logo with its signature "halo" glow. All of it lives in `assets/theme.css`'s `:root { ... }` block — that's the only place to touch for any future brand tweak.

`assets/logo.svg` is a hand-recreated approximation of the pin logo (pin shape + circle + tilted "E"), built from the guidelines PDF since no original vector/PNG export was provided. Swap it for the real exported logo file whenever you have one — same filename, nothing else needs to change.

## Add in-house tool documentation
Add Markdown files under `docs/` and list them in `docs/_sidebar.md`. Docsify (loaded via CDN in `docs/index.html`) renders them client-side — no build step, no server, no separate deploy.

## Run it locally
No install needed:
```
python3 -m http.server 8000
```
Then open http://localhost:8000

## Deploy
Push this folder to a GitHub repo, then in **Settings → Pages** set source to the `main` branch, root folder. GitHub Pages redeploys automatically on every push, for free, with HTTPS. Cloudflare Pages or Netlify work identically if you'd rather have a custom domain (e.g. tools.engagemedia.com) — connect the repo, leave the build command empty, output directory `/`.

See `adr/0001-tools-portal-architecture.md` for the full reasoning behind these choices, including why this is a static site and not a Google Apps Script app.
