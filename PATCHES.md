# PATCHES.md — motiahq Source Modifications
# Developed by nenifix.com

## Overview

motiahq is built as a standalone Node.js/React application. It does **not**
modify the Paperclip source code directly. Instead, it implements the
orchestration layer described in the motiahq specification as a clean,
independent server that interfaces with motia and motiahene via CLI.

## Architecture Decisions

### Why not fork Paperclip?

Paperclip is a full product (AI agent company management) with its own
database schema, auth system, and UI. Forking it would introduce:

- Unnecessary complexity (Drizzle ORM, PGlite, agent adapters we don't need)
- Maintenance burden (keeping up with upstream Paperclip changes)
- Security surface (unused endpoints, auth flows)

Instead, motiahq implements only the orchestration features needed:

- Task routing engine (complexity-based assignment)
- Hermes CEO agent (OpenRouter-backed planner/reviewer)
- Budget governance (per-agent spend limits)
- SiYuan integration (shared memory/backup)
- Telegram dashboard (bot commands)
- HTTP API (REST)
- React UI (org chart, task board, budget, logs)

### Neovim Source Patches

None. motiahq does not modify Neovim source code. It interfaces with
motia and motiahene via their CLI binaries (`motia vibe "..."`, `motiahene
vibe "..."`).

## Module Map

| File | Purpose |
|------|---------|
| `src/server/index.js` | Express server, CLI entry, Telegram webhook |
| `src/server/agents/hermes-ceo.js` | OpenRouter-backed strategic planner/reviewer |
| `src/server/agents/motia-worker.js` | CLI adapter for motia binary |
| `src/server/agents/motiahene-forge.js` | CLI adapter for motiahene binary |
| `src/server/router/task-router.js` | Complexity-based task routing engine |
| `src/server/governance/budget-gate.js` | Spend limits, governance gates |
| `src/server/integrations/siyuan.js` | SiYuan API client |
| `src/ui/src/App.jsx` | Main React dashboard |
| `src/ui/src/components/OrgChart.jsx` | Org chart visualization |
| `src/ui/src/components/TaskBoard.jsx` | Kanban task board |
| `src/ui/src/components/BudgetDashboard.jsx` | Budget spend dashboard |
| `src/ui/src/components/LogsPanel.jsx` | Activity log viewer |
| `src/ui/src/components/HermesReviewModal.jsx` | Hermes review popup |

## Environment Variables

See `.env.example` for all configuration options.

## Future Patches

When motia and motiahene are built, update the worker adapters:

1. `src/server/agents/motia-worker.js` — replace simulated execution with actual `motia` CLI calls
2. `src/server/agents/motiahene-forge.js` — replace simulated execution with actual `motiahene` CLI calls
3. Add MCP server adapter if motiahene exposes MCP
4. Add SiYuan skill sync if motiahene exposes skill export
