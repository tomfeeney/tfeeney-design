# SignalDesk AI v1.8 — Product Feedback Triage

This revenue-demo branch reframes the existing AI NCC-1701-alpha prototype as **SignalDesk AI**, a paid product feedback triage workflow for product, UX, support, QA, and customer-facing teams.

The first commercial path is a productized service:

- Starter Audit: $750
- Growth Audit: $1,500
- Team Workshop: $3,000

The app still keeps the original three-step workflow and AI triage engine, but the hero, CTA, footer, and new paid-offer section now support a concrete buyer journey.

This v1.8 build keeps the v1.7 three-step workflow and adds a UI clarity / interaction-polish layer without changing the source/file/URL pill styling.

## Workflow

1. **Enter signal** — add a source URL, upload supporting files, or paste notes/tickets/findings.
2. **Review results** — inspect AI Review, Signal Charts, Decision Workspace, Pattern Detection, and the UX Signal Table.
3. **Take action** — create an email brief, Jira ticket, team update, executive summary, handoff package, exports, or saved signal.

## What changed in v1.8

- Added a dedicated AI triage processing screen with staged progress.
- Added Step 1 input guidance and an input-readiness panel.
- Added inline URL, email-recipient, and save-name validation messages.
- Added a stronger Step 2 recommended-next-move callout.
- Improved the Step 2 Breakdown stat cards with clearer labels, percentages, and mini bars.
- Grouped Step 3 actions by user intent: Communicate, Track Work, Review Checkpoint, and Save & Export.
- Added generated-document feedback after handoff artifacts are created.
- Improved active/completed/locked step navigation states.
- Kept Table View as the default for the UX Signal Table.
- Preserved source/file/URL pill CSS.

## Server routes

The browser does not call OpenAI directly. The frontend calls a server-side route. For PHP hosting, the live endpoint should be:

- `api/analyze.php`

The frontend resolves that route relative to the deployed page first, so nested portfolio paths such as `/sandbox/ai-enterprise/` or `/sandbox/ai_enterprise/` are supported.

For local/Vercel-style development, the Node route remains available as a fallback.

Set `OPENAI_API_KEY` server-side. Optional: set `OPENAI_MODEL`.

## Fallback behavior

If the live AI route or key is unavailable, the UI uses local fallback logic so the prototype still works for portfolio review. Diagnostics now avoid dumping raw HTML error pages into the UI.
