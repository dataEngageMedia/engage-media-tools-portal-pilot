# ADR-0001: Engage Media Tools Portal — Platform, Backend Need, and Deployment

**Status:** Proposed
**Date:** 2026-08-27
**Deciders:** Sumeet (Data Scientist / AI Engineer, sole technical owner)

## Context

Engage Media needs one internal landing page where employees can find and one-click into every tool the company uses — SaaS tools today, in-house/homegrown tools later — and which will grow into a lightweight documentation hub for those in-house tools.

Constraints gathered from the stakeholder:
- Company runs on Google Workspace.
- Access model: one shared link, no login/SSO. Not sensitive data — a links directory.
- Sole maintainer (Sumeet) will add/edit tool entries via a config file; no admin UI needed.
- Branding assets (logo, colors, fonts) arrive later — theme must be swappable without touching structure or logic.
- Open question: does this need a real backend, and should it run on Google Apps Script since the company already lives in Workspace?

## Decision

Build a **static site** — plain HTML/CSS/JS, no backend, no database — with the tool list in a version-controlled JSON file, deployed via git push to a static host (**GitHub Pages recommended**; Cloudflare Pages/Netlify are equivalent drop-ins). Do **not** use Google Apps Script as the delivery platform for the portal. Documentation is added later as a `/docs` subfolder rendered client-side by Docsify — same repo, same deploy, zero rebuild.

## Does this need to be "software" with a backend?

No. A backend earns its keep when you need: user accounts, server-side writes, data that must stay private per-user, or logic that can't run in the browser. None apply here — this is a read-only directory of links, edited by one technical person. A backend would add a server to patch, monitor, and pay for, in exchange for nothing this use case needs. The only place "logic" shows up is client-side search/filter over a JSON file, which plain JavaScript handles natively. If the requirements change later (see Consequences), that's the trigger to revisit — not now.

## Options Considered

### Option A: Google Apps Script web app + Google Sheet as data source
| Dimension | Assessment |
|---|---|
| Complexity | Medium — Apps Script has its own editor, deployment model, and quirks |
| Cost | $0 |
| Branding flexibility | Low — fighting the platform for pixel-level control; no clean way to attach a custom domain to an Apps Script web app |
| Maintenance | Medium — cold starts (1-3s load lag), version history lives in Apps Script's own system, not git |
| Extensibility to docs section | Poor — no static-site tooling; you'd hand-roll markdown rendering |
| Fit for "Google Workspace shop" | Feels native, but Apps Script is built for Sheets/Docs automation (triggers, custom menus, mail-merge), not for serving a branded page |

**Pros:** No new account needed; Sumeet already lives in Sheets; can gate to Workspace domain later if ever needed.
**Cons:** Ugly/unstable-feeling URL, cold-start latency, poor branding control, painful version control, dead end for the docs requirement.

### Option B: Google Sites (no-code)
| Dimension | Assessment |
|---|---|
| Complexity | Very low — no code |
| Cost | $0 |
| Branding flexibility | Low — rigid templates, can't match custom brand pixel-for-pixel |
| Maintenance | Low, but every edit is manual UI clicking, no diff/history |
| Extensibility to docs section | Poor — not built for a searchable, navigable docs tree |
| Fit | Fast MVP, but outgrown the moment real branding or docs are needed |

**Pros:** Fastest to stand up (under an hour); zero technical skill required.
**Cons:** No config-file workflow (contradicts "edit a file" preference), weak branding control, no real path to the docs requirement.

### Option C: Static site (HTML/CSS/JS) + JSON config, deployed via git to GitHub Pages / Cloudflare Pages / Netlify — RECOMMENDED
| Dimension | Assessment |
|---|---|
| Complexity | Low — no framework, no build step, no server |
| Cost | $0 |
| Branding flexibility | High — full CSS control; brand tokens isolated in one file |
| Maintenance | Very low — edit `tools.json`, git push, auto-deployed |
| Extensibility to docs section | Excellent — add a `/docs` folder + Docsify, same repo, same deploy |
| Fit | Matches "solo technical owner, no login, wants a config file, wants branding control later" exactly |

**Pros:** Free, fast (no cold starts), full design control, git gives free version history and easy diffs on every tool added, trivially extends to docs, no server to secure or patch, works identically whether 1 person or 50 people maintain it later.
**Cons:** Requires comfort with git (already true of this stakeholder); one-time setup of a repo + hosting connection (roughly 15 minutes, one-time).

## Trade-off Analysis

The real choice is between "feels native because we're a Google shop" (A) and "fits the actual job" (C). Google Workspace is where Engage Media does email and docs — it is not a web-hosting platform, and Apps Script's web-app mode is a workaround, not its design center. A static site costs the same ($0), takes roughly the same time to first launch, and is strictly better on every dimension that matters here: branding control, version history, load speed, and — critically — it's the only option that absorbs the future documentation requirement without a second system. Google Sites is the fastest possible MVP but was ruled out because it can't hold a real config-driven workflow or a docs section without becoming its own maintenance headache later.

## Consequences

- **Easier:** adding a tool is a one-line JSON edit + git push; branding swap is a single CSS file; docs ship by dropping in markdown files, no new infrastructure.
- **Harder / deferred:** no non-technical editor UI (by design, per current requirement — revisit if someone other than Sumeet needs to add tools); no login/access control (by design, per current requirement — revisit only if the portal starts linking to anything sensitive, at which point Cloudflare Access or a Google Workspace-only Sites wrapper can be bolted on without rebuilding the site).
- **Revisit this decision if:** (1) more than one non-technical person needs to maintain the tool list — add a minimal form-to-JSON admin step then, don't build it preemptively; (2) access needs to be restricted — add an auth layer in front of the static host (Cloudflare Access, or Google Workspace-restricted Google Sites as a thin wrapper), the site itself doesn't change; (3) the docs section outgrows Docsify's simplicity (heavy versioning, multi-language) — migrate to MkDocs or Docusaurus, both of which also build to static files and drop into the same hosting.

## Action Items

1. [ ] Push the scaffolded project (already created) to a new GitHub repo.
2. [ ] Enable GitHub Pages on that repo (Settings → Pages → deploy from `main`, root).
3. [ ] Replace the sample entries in `data/tools.json` with Engage Media's actual tool list.
4. [ ] When brand assets arrive, update only `assets/theme.css` (colors/fonts) and `assets/logo-placeholder.svg` (logo file).
5. [ ] When the first in-house tool ships, add its Markdown file(s) under `docs/` and list it in `docs/_sidebar.md`.
