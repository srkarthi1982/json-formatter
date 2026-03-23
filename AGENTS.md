⚠️ Mandatory: AI agents must read this file before writing or modifying any code.

# AGENTS.md

This file complements the workspace-level Ansiversa-workspace/AGENTS.md (source of truth). Read workspace first.

MANDATORY: After completing each task, update this repo’s AGENTS.md Task Log (newest-first) before marking the task done.

## Scope
- Mini-app repository for 'json-formatter' within Ansiversa.
- Follow the parent-app contract from workspace AGENTS; do not invent architecture.

## Phase Status
- Freeze phase active: no new features unless explicitly approved.
- Allowed: verification, bug fixes, cleanup, behavior locking, and documentation/process hardening.

## Architecture & Workflow Reminders
- Prefer consistency over speed; match existing naming, spacing, and patterns.
- Keep Astro/Alpine patterns aligned with ecosystem standards (one global store pattern per app, actions via astro:actions, SSR-first behavior).
- Do not refactor or change established patterns without explicit approval.
- If unclear, stop and ask Karthikeyan/Astra before proceeding.

## Where To Look First
- Start with src/, src/actions/, src/stores/, and local docs/ if present.
- Review this repo's existing AGENTS.md Task Log history before making changes.

## Task Log (Recent)
- 2026-03-23 Introduced local AvTabs and AvBadge validation components in repo scope, replaced temporary `/app` tab and badge UI with those components, prepared them for future extraction to `@ansiversa/components`, and verified with `npm run typecheck`, `npm run build`.
- 2026-03-23 JSON Formatter V1 implementation complete: added Astro DB tables for snippets/operations/future recipes, server actions for format/minify/validate/save/list flows, Alpine formatter store, protected `/app` formatter/snippets/history workspace, dashboard summary push integration, and verified with `npm run typecheck`, `npm run build`.
- 2026-03-23 Seeded from latest app-starter V2 baseline: synced shared starter structure (APP_META, public /, protected /app, middleware/auth/session/dev files, layouts, docs, and integration checklist), aligned `@ansiversa/components` to `^0.0.169`, replaced the legacy landing with a premium category-aligned coming-soon homepage, and validated with npm install, npm run typecheck, npm run build.
- Keep newest first; include date and short summary.
- 2026-02-09 Added repo-level AGENTS.md enforcement contract (workspace reference + mandatory task-log update rule).
- 2026-02-09 Initialized repo AGENTS baseline for single-repo Codex/AI safety.
