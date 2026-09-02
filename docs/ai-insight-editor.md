# AI Insight Editor

**Category:** Analytics & Reporting, In-House Tools
**Access:** [Open the tool](https://script.google.com/a/macros/engagemedia.com/s/AKfycbywJ86NIXqp6TzeM6DTA3wDlYPPmHKZ0T5kDjStkmuqQhGhgEIU7LrePMfyGSuzBUmVWQ/exec)



| Title | AI Insight Commentary Editor |
| ----- | ----- |
| Subtitle | System Documentation |
| Audience | Client Success & AdOps |
| Last Updated | August 13th 2026 |
| Author | Sumeet Sule |

# **AI Insights Commentary Editor**

## **1\. What this is**

The AI Insights Commentary Editor is a single-page internal web tool that lets the Client Success team correct AI-generated report commentary before it reaches a client — without opening BigQuery, writing SQL, or touching raw HTML.

It replaces the old manual process (documented in *"SOP: Editing AI Insights Commentary in BigQuery"*) with one link: pick a client, pick a report, edit the text, click Save. It's built entirely on Google Apps Script, so it requires no separate hosting, servers, or logins — it runs inside Engage Media's existing Google Workspace and is reachable by anyone with the link.

Access the web app through the following link: 

[AI Insights Commentary Editor](https://script.google.com/macros/s/AKfycbywJ86NIXqp6TzeM6DTA3wDlYPPmHKZ0T5kDjStkmuqQhGhgEIU7LrePMfyGSuzBUmVWQ/exec) 

**2\. The problem it solves**

Engage Media's Looker Studio dashboards show AI-generated commentary pulled from a BigQuery table (`ai_insights`). Sometimes that commentary needs a human correction — a metric dropped because of a known bid change the AI couldn't see, a number needs fixing, or the tone needs adjusting before a client sees it.

The original process required the Client Success team to: open the BigQuery console, run a `SELECT` to find the right row, manually cross-reference three fields to make sure they'd matched the correct report (a monthly report and a quarterly report can share the same start date; a quarterly report and a YTD report can share both the start *and* end date), copy the HTML into a separate formatting tool, edit it by hand, then write and run an `UPDATE` statement with the HTML pasted into it.

That process had two real problems, not just an inconvenience one:

* **It required SQL and BigQuery fluency the Client Success team doesn't have**, so edits either bottlenecked on someone technical or risked being done incorrectly.  
* **A wrong row match silently overwrote the wrong report's text**, with no record of what changed or when — there was no safety net and no audit trail.

This tool removes both problems: the row is always selected through a guided, unambiguous UI (never typed or matched by hand), and every change is logged automatically.

## **3\. Demo walkthrough**

A concrete example of what using the tool looks like, end to end:

1. **Open the tool.** A Client Success team member opens the shared Apps Script web app URL and signs in with their Google account — no separate credentials.  
2. **Find the client.** They start typing into the *Client* field — a searchable dropdown filters live as they type (e.g. typing "mar" narrows the list to `MAR`). This replaces having to know or type an exact `client_id`.  
3. **Find the report.** The *Report* field becomes active and lists every report for that client as one unambiguous option per row, e.g. *"Q1 2026 (2026-01-01 – 2026-03-31) — All Platforms"* versus *"YTD 2026 (2026-01-01 – 2026-03-31) — All Platforms"* shown as clearly distinct choices — the exact ambiguity that used to require careful manual cross-referencing is resolved before any text is touched.  
4. **Review the current text.** The editor loads with the version bar showing *"Version 2 of 2 — Manual edit by \[name\] on \[date\]"* (or *"Original AI text"* if nobody has edited it yet). The left pane shows the commentary rendered exactly as it looks on the dashboard — because it *is* that same rendering, made editable; the right pane mirrors it as a read-only live preview.  
5. **Make the correction.** They click directly into the text and edit it like a normal document — adding a sentence explaining that a metric dropped because of a mid-month bid reduction, for example — using a small toolbar for **Bold**, *Italic*, or inserting a **Divider** line. Pressing Enter starts a new paragraph, same as any text editor. The preview updates as they type.  
6. **Browse history (optional).** Clicking **◀ Previous edit** steps back through every prior version of this report's commentary — the original AI text, then every save or revert since, each labeled with who made it and when. This is view-only until Save is clicked; nothing in BigQuery changes just from looking.  
7. **Save.** Clicking **Save** writes the new text and shows a confirmation. If they'd been viewing an older version, Save restores that exact text as the new current version — it never overwrites history, only adds to it.  
8. **Verify.** The commentary is now live on the Looker Studio dashboard for that client and report (an incognito refresh bypasses any dashboard caching if the change isn't visible immediately).  
9. **Undo if needed.** **Revert to AI original** clears the manual edit at any time, falling back to the untouched AI-generated text — also logged as its own version.

## **4\. How it works (backend)**

### **Architecture at a glance**

```
 Client Success team member (browser)
          │
          ▼
 Google Apps Script Web App  (HTML Service — Index.html)
          │  google.script.run (client ↔ server bridge)
          ▼
 Apps Script backend (Code.gs, runs as the script owner's Google identity)
          │  BigQuery Advanced Service (BigQuery.Jobs.query / getQueryResults)
          ▼
 BigQuery — ai-project-484117.engagemediadw
          │
          ├── ai_insights            (source of truth + live commentary)
          └── ai_insights_audit_log  (full change history)
          │
          ▼
 Looker Studio dashboard (reads edited_text, falls back to commentary_text)
```

There is no separate application server and no database outside BigQuery — Apps Script is both the web server (via `doGet()` and `HtmlService`) and the application logic layer.

### **Request flow**

The front end (`Index.html`) never talks to BigQuery directly. Every action calls a server-side function in `Code.gs` through `google.script.run`, which runs under the Apps Script project owner's Google identity (the deployment is configured "Execute as: Me"), so individual team members never need their own BigQuery permissions.

| User action | Front-end call | Backend function | What happens in BigQuery |
| ----- | ----- | ----- | ----- |
| Page loads | `getClients()` | queries `ai_insights` | `SELECT DISTINCT client_id ...` |
| Client selected | `getReportRows(clientId)` | queries `ai_insights` | Returns every report row for that client, pre-formatted into one unambiguous label per row (label \+ start \+ end \+ section) |
| Report selected | `getVersionHistory(rowKey)` | queries `ai_insights` \+ `ai_insights_audit_log` | Builds the full version list: index 0 is always the original `commentary_text`, followed by every logged `SAVE`/`REVERT` in chronological order |
| Save clicked | `saveCommentary(rowKey, html)` | `UPDATE ai_insights SET edited_text=...` \+ `INSERT` into the audit table | Writes the new text, then logs the change |
| Revert clicked | `revertToAi(rowKey)` | `UPDATE ai_insights SET edited_text=NULL` \+ `INSERT` into the audit table | Clears the manual edit, logs the revert with the real restored HTML |
| Previous / Next edit | *(no server call)* | — | Purely navigates the already-loaded `versionHistory` array in the browser; nothing in BigQuery changes until Save |

### **Key design decisions**

**The row is never matched by typing.** Every report is looked up through `getReportRows()`, which pre-builds one option per row combining `date_range_label`, `date_range_start`, `date_range_end`, and `section` — the exact four fields the original SOP warned could collide (e.g. a quarterly report and a YTD report sharing both dates). The team picks from a list; they never type or reconcile these values themselves.

**All queries are parameterized, never string-built.** Every function that touches BigQuery (`runQuery`, `runDml`) sends the HTML and identifying fields as named query parameters (`@clientId`, `@start`, `@newHtml`, etc.), not concatenated into the SQL string. This is what the original SOP's triple-quote (`'''...'''`) trick was working around — parameters remove the class of bug entirely rather than mitigating it.

**Every write checks its own blast radius.** After every `UPDATE`, the code checks `numDmlAffectedRows === '1'` and throws an error if it isn't exactly one row. If the data ever contains a genuine duplicate report, the save fails loudly instead of silently changing the wrong row (or two rows at once) — something the manual SQL process had no protection against.

**`commentary_text` is never touched.** Saves only ever write to `edited_text`. The original AI-generated text is preserved permanently as the source of truth, which is what makes "Revert to AI original" a simple, safe operation rather than a real undo.

**Version history is additive, never destructive.** Every Save or Revert is logged to `ai_insights_audit_log` with the actual resulting HTML (never a placeholder string), ordered by `edited_at`. Restoring an old version through Previous/Next \+ Save creates a *new* log entry rather than rewriting history — so the audit trail only ever grows, and nothing already saved can be lost by a later action.

**Failures are visible, audit logging isn't a single point of failure.** `logAudit()` is wrapped so that if the audit insert itself fails (e.g. the table doesn't exist yet), it's logged to the script's execution log but never blocks the actual save — a broken audit table degrades the tool to "no history," not "can't save."

**The editor edits the actual styled report, not a stand-in for it.** Instead of a raw-HTML text box, the commentary loads into an isolated iframe containing the report's real HTML and CSS, switched into the browser's native editable mode. What the team sees while editing is pixel-for-pixel what's on the dashboard — there's no separate "preview" to fall out of sync with, and no intermediate plain-text representation that could misinterpret the markup.

**The toolbar is deliberately small.** Only Bold, Italic, and Divider are exposed. A font-size control was considered and left out on purpose: letting people pick arbitrary sizes would turn "formatting" into "which HTML tag is this," and reports would slowly drift out of visual consistency with each other depending on who last edited them. If stronger emphasis is genuinely needed later, the safer path is a constrained toggle (e.g. "make this a subheading") that swaps in an existing template element, not a freeform size picker.

**The Divider button reuses the report's own markup, never invents new styling.** On load, the tool scans the report for an element that already looks like a divider or separator and reuses its exact markup when the button is clicked. Only if a report has none does it fall back to a generic dashed line — so inserted dividers always match the report they're inserted into.

**Structural safety nets, not hard rules.** Pasting text (e.g. from Gmail or Word) is stripped down to plain words only — none of the source's formatting or styling can leak into the report. Before saving, the tool compares a rough structural count (headings, cards, dividers) against what was loaded; if it dropped, the team gets a one-time "this looks like it removed a styled section — save anyway?" prompt rather than a block, since deleting a section on purpose is valid. If the commentary comes back completely empty, save is blocked outright — that's virtually always an accidental full delete, never an intentional edit.

**Raw HTML editing is still available for advanced cases.** An "Edit raw HTML instead" toggle switches to a plain-text view of the underlying markup, for edits the rich editor can't do — like adding a whole new section. Switching between the two modes carries the current edit over automatically, so nothing is lost by toggling back and forth.

## **5\. Data model**

**`ai-project-484117.engagemediadw.ai_insights`** *(existing table, not created by this tool)*

| Column | Purpose |
| ----- | ----- |
| `client_id`, `date_range_label`, `date_range_start`, `date_range_end`, `section` | Together uniquely identify one report's commentary block |
| `status`, `generated_at` | Set by the upstream AI generation pipeline |
| `commentary_text` | The original AI-generated write-up — never modified by this tool |
| `edited_text` | The manual override. Looker Studio displays this when present, falling back to `commentary_text` when it's `NULL` |

**`ai-project-484117.engagemediadw.ai_insights_audit_log`** *(created for this tool)*

| Column | Purpose |
| ----- | ----- |
| `client_id`, `date_range_label`, `date_range_start`, `date_range_end`, `section` | Same identifying fields, linking a log entry back to its report |
| `action` | `'SAVE'` or `'REVERT'` |
| `edited_by` | The editor's email, from `Session.getActiveUser()` |
| `edited_at` | Server timestamp of the change |
| `previous_text`, `new_text` | The HTML before and after the change — `new_text` is always real, renderable HTML, which is what lets version history replay it directly |

## **6\. Tech stack**

| Layer | Technology |
| ----- | ----- |
| Hosting / runtime | Google Apps Script (V8 runtime) — no separate server or hosting cost |
| Front end | Static HTML/CSS/vanilla JavaScript served via Apps Script HtmlService; the editor pane is a sandboxed iframe using the browser's native designMode for in-place rich-text editing; no build step, no frontend framework |
| Client ↔ server bridge | `google.script.run` (Apps Script's built-in async RPC between the browser and server functions) |
| Backend logic | Apps Script (JavaScript, `Code.gs`) |
| Data warehouse | Google BigQuery, accessed via the Apps Script **BigQuery Advanced Service** (`BigQuery.Jobs.query` / `getQueryResults`), using parameterized standard SQL |
| Authentication / access control | Google Workspace identity to open the app; the deployment is shared as "Anyone with the link" rather than restricted to a single Workspace domain, so it also works for reviewers on a different Google Workspace. Runs as the script owner's identity server-side, so BigQuery IAM only needs to be granted to one account |
| Dashboard | Looker Studio, reading directly from the same `ai_insights` table (no integration work needed — it already had the `edited_text` fallback logic) |

## **7\. Known limitations**

* **Single shared BigQuery identity.** Because the app runs as one Google account ("Execute as: Me"), that account's access is a single point of trust — if it's ever offboarded or loses BigQuery permissions, the tool stops working for everyone until it's redeployed under a new identity.  
* **The rich editor covers common edits, not everything.** Bold, Italic, Divider, and adding/removing paragraphs are handled directly in the styled view; anything beyond that — like adding a whole new section — needs the "Edit raw HTML instead" toggle. Font size and other freeform styling are intentionally not exposed, to keep reports visually consistent with each other over time.  
* **Structural safety is a warning, not a lock.** The save-time check for a removed section is a one-time confirmation, not a hard block — it can be clicked past. The live preview pane remains the best way to catch an unintended change before saving.  
* **Version ordering relies on timestamp, not a lock.** If two people saved the exact same report within the same instant, their order in the history list follows insertion order rather than a true transaction lock — an edge case unlikely to matter for this team's usage pattern.  
* **Pre-history edits show as a single entry.** Any manual edit saved before the version-history feature existed appears as one "saved before version history was added" entry rather than a full timeline, since there's no earlier audit data to reconstruct from.

