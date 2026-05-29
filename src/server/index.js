// src/server/index.js — motiahq main entry point
// Developed by nenifix.com

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load env
const ENV_FILE = path.join(process.env.HOME || '/root', '.motiahq', '.env');
function loadEnv() {
  const env = {};
  if (!fs.existsSync(ENV_FILE)) return env;
  const lines = fs.readFileSync(ENV_FILE, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
  }
  return env;
}

const agentConfig = { ...process.env, ...loadEnv() };
const PORT = parseInt(agentConfig.MOTIAHQ_PORT) || 8770;

// ── Modules ───────────────────────────────────────────────────────────────────
const TaskRouter = require('./router/task-router');
const BudgetGate = require('./governance/budget-gate');
const HermesCeo = require('./agents/hermes-ceo');
const MotiaWorker = require('./agents/motia-worker');
const MotiaheneForge = require('./agents/motiahene-forge');

// ── State ────────────────────────────────────────────────────────────────────
const tasks = new Map();
const agents = {
  hermes: { name: 'Hermes (CEO)', status: 'online', role: 'architect', tasksCompleted: 0 },
  motia: { name: 'motia (Worker)', status: checkBinary('motia') ? 'online' : 'offline', role: 'mvp-coder', tasksCompleted: 0 },
  motiahene: { name: 'motiahene (Worker)', status: checkBinary('motiahene') ? 'online' : 'offline', role: 'full-forge', tasksCompleted: 0 },
};

function checkBinary(name) {
  try {
    const { execSync } = require('child_process');
    execSync(`which ${name}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// ── Budget initialization ─────────────────────────────────────────────────────
BudgetGate.init({
  motia: parseFloat(agentConfig.MOTIA_BUDGET) || 5.0,
  motiahene: parseFloat(agentConfig.MOTIAHENE_BUDGET) || 10.0,
  hermes: parseFloat(agentConfig.HERMES_BUDGET_LIMIT) || 20.0,
});

// ── Express app ──────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// Bearer token auth middleware
function auth(req, res, next) {
  if (!agentConfig.MOTIAHQ_API_TOKEN) return next();
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (token !== agentConfig.MOTIAHQ_API_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ── API Routes ───────────────────────────────────────────────────────────────

// Org chart
app.get('/api/org', auth, (req, res) => {
  res.json({ agents: Object.values(agents), budget: BudgetGate.status() });
});

// Task CRUD
app.post('/api/task', auth, async (req, res) => {
  const { goal, complexity, budget, model } = req.body;
  if (!goal) return res.status(400).json({ error: 'goal is required' });

  const task = TaskRouter.create({ goal, complexity, budget, model });
  
  // Route to agent
  try {
    const assignment = TaskRouter.route(task, agents);
    task.assignedTo = assignment.agent;
    task.status = 'assigned';
    tasks.set(task.id, task);

    // Execute
    executeTask(task, assignment.agent);

    res.status(201).json({ task, message: `Assigned to ${assignment.agent}` });
  } catch (err) {
    task.status = 'failed';
    task.error = err.message;
    tasks.set(task.id, task);
    res.status(500).json({ error: err.message, task });
  }
});

app.get('/api/task/:id', auth, (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

app.get('/api/task', auth, (req, res) => {
  const list = Array.from(tasks.values());
  res.json(list);
});

app.post('/api/approve/:taskId', auth, async (req, res) => {
  const task = tasks.get(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  // Hermes review
  const review = await HermesCeo.review(task);
  task.hermesReview = review;
  task.status = review.approved ? 'approved' : 'rejected';
  tasks.set(task.id, task);

  res.json({ task, review });
});

app.post('/api/task/:id/cancel', auth, (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  task.status = 'cancelled';
  if (task._process) task._process.kill();
  tasks.set(task.id, task);
  res.json({ message: 'Task cancelled', task });
});

// Budget
app.get('/api/budget', auth, (req, res) => {
  res.json(BudgetGate.status());
});

app.post('/api/budget/reset', auth, (req, res) => {
  BudgetGate.reset();
  res.json({ message: 'Budgets reset', budget: BudgetGate.status() });
});

// Agent logs
app.get('/api/agent/:name/logs', auth, (req, res) => {
  const { name } = req.params;
  const agentTasks = Array.from(tasks.values()).filter(t => t.assignedTo === name);
  res.json({ agent: name, tasks: agentTasks });
});

// Telegram webhook
app.post('/webhook/telegram', async (req, res) => {
  const { message } = req.body;
  if (!message || !message.text) return res.sendStatus(200);

  const chatId = message.chat.id;
  const text = message.text.trim();

  if (text.startsWith('/hq')) {
    const response = await handleTelegramCommand(text, chatId);
    await sendTelegram(chatId, response);
  }

  res.sendStatus(200);
});

// ── Static UI ────────────────────────────────────────────────────────────────
const uiDist = path.join(__dirname, '..', 'ui', 'dist');
if (fs.existsSync(uiDist)) {
  app.use(express.static(uiDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(uiDist, 'index.html'));
  });
}

// ── Task execution ───────────────────────────────────────────────────────────
async function executeTask(task, agentName) {
  task.status = 'running';
  tasks.set(task.id, task);

  const agent = agentName === 'motia' ? MotiaWorker
    : agentName === 'motiahene' ? MotiaheneForge
    : null;

  if (!agent) {
    task.status = 'failed';
    task.error = `Unknown agent: ${agentName}`;
    tasks.set(task.id, task);
    return;
  }

  // Check budget
  if (!BudgetGate.check(agentName, task.estimatedCost || 0.5)) {
    task.status = 'paused';
    task.error = 'Budget exceeded';
    tasks.set(task.id, task);
    return;
  }

  try {
    const result = await agent.execute(task);
    task.status = 'completed';
    task.output = result;
    BudgetGate.spend(agentName, result.cost || 0.5);
    agents[agentName].tasksCompleted++;
  } catch (err) {
    task.status = 'failed';
    task.error = err.message;
  }

  tasks.set(task.id, task);
}

// ── Telegram helpers ─────────────────────────────────────────────────────────
async function handleTelegramCommand(text, chatId) {
  const parts = text.split(/\s+/);
  const cmd = parts[1];

  switch (cmd) {
    case 'status': {
      const org = Object.values(agents).map(a =>
        `${a.status === 'online' ? '🟢' : '🔴'} ${a.name} — ${a.tasksCompleted} tasks`
      ).join('\n');
      const activeTasks = Array.from(tasks.values()).filter(t => t.status === 'running').length;
      return `⚒ motiahq Status\n\n${org}\n\nActive tasks: ${activeTasks}`;
    }
    case 'assign': {
      const target = parts[parts.indexOf('to') + 1];
      const goal = parts.slice(2, parts.indexOf('to')).join(' ');
      if (!target || !goal) return 'Usage: /hq assign <task> to <motia|motiahene>';
      return `Task "${goal}" manually assigned to ${target}`;
    }
    case 'approve': {
      const taskId = parts[2];
      if (!taskId) return 'Usage: /hq approve <task_id>';
      const task = tasks.get(taskId);
      if (!task) return `Task ${taskId} not found`;
      const review = await HermesCeo.review(task);
      return `Hermes review: ${review.approved ? '✅ APPROVED' : '❌ REJECTED'}\n${review.feedback}`;
    }
    case 'budget':
      return `Budget:\n${JSON.stringify(BudgetGate.status(), null, 2)}`;
    case 'logs': {
      const agent = parts[2] || 'motia';
      const agentTasks = Array.from(tasks.values()).filter(t => t.assignedTo === agent).slice(-5);
      if (!agentTasks.length) return `No recent tasks for ${agent}`;
      return agentTasks.map(t => `[${t.status}] ${t.goal.slice(0, 60)}`).join('\n');
    }
    default:
      return 'motiahq commands: /hq status, /hq assign, /hq approve, /hq budget, /hq logs';
  }
}

async function sendTelegram(chatId, text) {
  const token = agentConfig.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    const https = require('https');
    const data = JSON.stringify({ chat_id: chatId, text });
    const url = new URL(`https://api.telegram.org/bot${token}/sendMessage`);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, () => {});
    req.write(data);
    req.end();
  } catch (e) { /* silent */ }
}

// ── Start ────────────────────────────────────────────────────────────────────
function start() {
  app.listen(PORT, () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════════════╗');
    console.log('  ║  ⚒  motiahq — Agent Orchestration HQ       ║');
    console.log('  ║  Developed by nenifix.com                   ║');
    console.log('  ╚══════════════════════════════════════════════╝');
    console.log('');
    console.log(`  Dashboard: http://localhost:${PORT}`);
    console.log(`  API:       http://localhost:${PORT}/api`);
    console.log('');
    console.log(`  Agents:`);
    for (const [key, agent] of Object.entries(agents)) {
      const icon = agent.status === 'online' ? '🟢' : '🔴';
      console.log(`    ${icon} ${agent.name}`);
    }
    console.log('');
  });
}

// ── CLI entry ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args[0] === 'serve' || args.length === 0) {
  start();
} else if (args[0] === '--version') {
  console.log('motiahq v1.0.0 • Developed by nenifix.com');
} else if (args[0] === '--help') {
  console.log('motiahq — Agent Orchestration HQ');
  console.log('Developed by nenifix.com');
  console.log('');
  console.log('Usage: motiahq <command>');
  console.log('');
  console.log('Commands:');
  console.log('  serve                  Start server + dashboard');
  console.log('  task create <goal>     Submit a task');
  console.log('  task list              List tasks');
  console.log('  task status <id>       Task status');
  console.log('  task cancel <id>       Cancel task');
  console.log('  agent list             List agents');
  console.log('  agent logs <name>      Agent logs');
  console.log('  budget show            Show budgets');
  console.log('  budget reset           Reset budgets');
  console.log('  hermes review <id>     Hermes review');
  console.log('  --version              Version');
  console.log('  --help                 This help');
} else {
  // Simple CLI handling for task/budget/agent/hermes subcommands
  const [cmd, sub, ...rest] = args;
  if (cmd === 'task') {
    if (sub === 'list') {
      console.log(JSON.stringify(Array.from(tasks.values()), null, 2));
    } else if (sub === 'status') {
      const task = tasks.get(rest[0]);
      console.log(task ? JSON.stringify(task, null, 2) : 'Task not found');
    } else if (sub === 'create') {
      const goal = rest.join(' ');
      const task = TaskRouter.create({ goal });
      const assignment = TaskRouter.route(task, agents);
      task.assignedTo = assignment.agent;
      task.status = 'assigned';
      tasks.set(task.id, task);
      executeTask(task, assignment.agent);
      console.log(`Task created: ${task.id}`);
      console.log(`Assigned to: ${assignment.agent}`);
    } else if (sub === 'cancel') {
      const task = tasks.get(rest[0]);
      if (task) { task.status = 'cancelled'; tasks.set(task.id, task); }
      console.log('Cancelled');
    }
  } else if (cmd === 'agent') {
    if (sub === 'list') {
      console.log(JSON.stringify(Object.values(agents), null, 2));
    } else if (sub === 'logs') {
      const agentTasks = Array.from(tasks.values()).filter(t => t.assignedTo === sub);
      console.log(JSON.stringify(agentTasks, null, 2));
    }
  } else if (cmd === 'budget') {
    if (sub === 'reset') { BudgetGate.reset(); }
    console.log(JSON.stringify(BudgetGate.status(), null, 2));
  } else if (cmd === 'hermes' && sub === 'review') {
    const task = tasks.get(rest[0]);
    if (!task) { console.log('Task not found'); process.exit(1); }
    HermesCeo.review(task).then(r => console.log(JSON.stringify(r, null, 2)));
  } else {
    console.log('Unknown command. Run motiahq --help');
  }
}

module.exports = { app, start };
