# motiahq — Agent Orchestration HQ

> **Developed by [nenifix.com](https://nenifix.com)**

```
  ╔══════════════════════════════════════════════╗
  ║  ⚒  motiahq — Agent Orchestration HQ       ║
  ║  Developed by nenifix.com                   ║
  ╚══════════════════════════════════════════════╝
```

motiahq is the command-center orchestrator for the dwarf-tribe terminal coding
team. It manages two worker agents — **motia** (MVP vibe coder) and
**motiahene** (full forge) — under the strategic oversight of the **Hermes**
CEO architect agent.

## Overview

```
User Request
     │
     ▼
 motiahq (Orchestrator)
     │
     ├── Hermes (CEO) ─── decompose, review, approve
     │
     ├── motia (Worker) ── fast tasks: scaffolding, lint, fix
     │
     └── motiahene (Worker) ── complex tasks: auth, memory, Telegram
```

**Core capabilities:**

- Task routing engine (complexity-based assignment to motia or motiahene)
- Hermes CEO agent for strategic planning, code review, and approval gates
- Budget governance with per-agent token limits and auto-pause
- SiYuan shared memory for decisions, patterns, and audit logs
- Telegram dashboard for real-time oversight
- HTTP API (localhost:8770) for programmatic control
- React web UI with org chart, task board, budget dashboard, and logs

## Requirements

| Dependency | Required | Notes |
|------------|----------|-------|
| Node.js >= 18 | Yes | Server runtime |
| npm >= 9 | Yes | Package manager |
| git | Yes | Source cloning |
| curl | Yes | API calls |
| gh | No | GitHub integration |
| jq | No | JSON parsing in CLI |
| docker | No | Sandboxed agent execution |
| motia | No | MVP worker agent |
| motiahene | No | Full worker agent |

## Installation

### One-liner

```bash
curl -fsSL https://raw.githubusercontent.com/nenifix/motiahq/main/install.sh | bash
```

### Build from source

```bash
git clone https://github.com/nenifix/motiahq.git
cd motiahq
./install.sh
```

### Post-install

```bash
# Edit config
vim ~/.motiahq/.env

# Start dashboard
motiahq serve

# Open browser
open http://localhost:8770
```

## Configuration

Copy `.env.example` to `~/.motiahq/.env` and fill in:

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | OpenRouter API key | *(required)* |
| `OPENROUTER_MODEL` | Default AI model | `qwen/qwen2.5-coder-7b-instruct` |
| `HERMES_API_ENDPOINT` | Hermes OpenRouter endpoint | `https://openrouter.ai/api/v1` |
| `HERMES_MODEL` | Hermes model | `qwen/qwen2.5-coder-32b-instruct` |
| `HERMES_BUDGET_LIMIT` | Daily token budget (USD) | `20.00` |
| `MOTIA_BUDGET` | motia daily budget (USD) | `5.00` |
| `MOTIAHENE_BUDGET` | motiahene daily budget (USD) | `10.00` |
| `GITHUB_TOKEN` | GitHub PAT for push/PR | *(optional)* |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | *(optional)* |
| `SIYUAN_API_URL` | SiYuan API endpoint | `http://localhost:6806/api` |
| `SIYUAN_API_TOKEN` | SiYuan auth token | *(optional)* |
| `MOTIAHQ_PORT` | HTTP API + UI port | `8770` |
| `MOTIAHQ_API_TOKEN` | Bearer token for API | *(auto-generated)* |

## Usage

### CLI

```bash
# Start the orchestration server + web UI
motiahq serve

# Submit a task
motiahq task create "Build a REST API with JWT auth"

# List active tasks
motiahq task list

# Check task status
motiahq task status <task_id>

# Cancel a task
motiahq task cancel <task_id>

# View agent status
motiahq agent list

# View agent logs
motiahq agent logs <motia|motiahene|hermes>

# Show budget status
motiahq budget show

# Reset daily budgets
motiahq budget reset

# Trigger Hermes review
motiahq hermes review <task_id>

# Version
motiahq --version
# motiahq v1.0.0 • Developed by nenifix.com

# Help
motiahq --help
```

### HTTP API

```bash
# Submit a task
curl -X POST http://localhost:8770/api/task \
  -H "Authorization: Bearer $MOTIAHQ_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"goal": "Build auth middleware", "complexity": "complex"}'

# Check task status
curl http://localhost:8770/api/task/<task_id> \
  -H "Authorization: Bearer $MOTIAHQ_API_TOKEN"

# Approve a task (Hermes gate)
curl -X POST http://localhost:8770/api/approve/<task_id> \
  -H "Authorization: Bearer $MOTIAHQ_API_TOKEN"

# Get org chart + heartbeats
curl http://localhost:8770/api/org \
  -H "Authorization: Bearer $MOTIAHQ_API_TOKEN"
```

### Telegram Commands

```
/hq status     — org chart, active tasks, budgets
/hq assign <task> to <motia|motiahene>  — manual routing
/hq approve <task_id>  — gate approval
/hq budget     — spend vs limits
/hq logs <agent>  — stream activity
```

## Task Routing Logic

```
Incoming Task
     │
     ▼
Classify Complexity
     │
     ├── SIMPLE (scaffolding, lint, single-file fix)
     │       │
     │       └── Route → motia-worker
     │
     └── COMPLEX (auth, multi-file, memory-dependent, Telegram/API)
             │
             └── Route → motiahene-forge

Fallback: if target busy → queue or escalate to Hermes for replanning
```

## Hermes CEO Agent

Hermes acts as strategic architect:

1. **Decompose goals** — breaks "Build inventory SaaS" into subtasks
2. **Assign work** — routes subtasks to motia or motiahene with clear specs
3. **Review outputs** — checks code quality, security, best practices
4. **Governance gates** — approves/rejects PRs before merge
5. **Budget oversight** — adjusts models and budgets per task criticality

## Budget Governance

| Feature | Behavior |
|---------|----------|
| Per-agent limits | motia: $5/day, motiahene: $10/day |
| Cost tracking | Per-task token usage logged to SiYuan |
| Auto-pause | Pauses agent when budget exceeded |
| Governance gates | Hermes must approve: production pushes, schema migrations, dependency updates, premium model switches |
| Audit log | All decisions stored in SiYuan |

## SiYuan Integration

- Stores org chart, task history, budget reports, governance decisions
- Auto-syncs motiahq state to SiYuan vault on task completion
- Hermes queries past decisions and fix strategies
- Backup: full state dump to SiYuan on graceful shutdown

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `motiahq: command not found` | Ensure `~/.local/bin` is in `$PATH` |
| Worker not detected | Install motia/motiahene and ensure binaries are in `$PATH` |
| OpenRouter timeout | Check API key; default model may be unavailable |
| SiYuan sync fails | Verify SiYuan is running on port 6806 |
| Telegram not responding | Check `TELEGRAM_BOT_TOKEN`; ensure no other process polling same bot |
| Port 8770 in use | Change `MOTIAHQ_PORT` in `.env` |

## License

MIT — see [LICENSE](LICENSE)

## About

motiahq is part of the **dwarf-tribe terminal forge** by
**[nenifix.com](https://nenifix.com)** — a Ghana-based brand engineering
and STEM hub building open-source AI-agent infrastructure.

- motia — MVP terminal vibe coder
- motiahene — Complete terminal forge
- motiahq — Agent orchestration HQ

Docs: https://nenifix.com/docs/motiahq
