// src/server/governance/budget-gate.js — Spend limits & approval gates
// Developed by nenifix.com

const fs = require('fs');
const path = require('path');

const BUDGET_FILE = path.join(process.env.HOME || '/root', '.motiahq', 'budgets.json');

let budgets = {};
let spendData = {};

const GOVERNANCE_GATES = [
  'production_push',
  'schema_migration',
  'dependency_update',
  'premium_model_switch',
];

function init(limits) {
  budgets = { ...limits };
  // Load persisted spend
  try {
    if (fs.existsSync(BUDGET_FILE)) {
      spendData = JSON.parse(fs.readFileSync(BUDGET_FILE, 'utf8'));
    }
  } catch { spendData = {}; }
  // Reset if new day
  const today = new Date().toISOString().slice(0, 10);
  if (spendData._date !== today) {
    spendData = { _date: today };
    persist();
  }
}

function check(agent, cost) {
  const limit = budgets[agent] || 5.0;
  const spent = spendData[agent] || 0;
  return (spent + cost) <= limit;
}

function spend(agent, cost) {
  spendData[agent] = (spendData[agent] || 0) + cost;
  persist();
}

function persist() {
  try {
    fs.mkdirSync(path.dirname(BUDGET_FILE), { recursive: true });
    fs.writeFileSync(BUDGET_FILE, JSON.stringify(spendData, null, 2));
  } catch { /* silent */ }
}

function status() {
  const result = {};
  for (const [agent, limit] of Object.entries(budgets)) {
    const spent = spendData[agent] || 0;
    result[agent] = {
      limit,
      spent: Math.round(spent * 100) / 100,
      remaining: Math.round((limit - spent) * 100) / 100,
      exceeded: spent > limit,
    };
  }
  return result;
}

function reset() {
  spendData = { _date: new Date().toISOString().slice(0, 10) };
  persist();
}

function requiresGovernance(action) {
  return GOVERNANCE_GATES.includes(action);
}

module.exports = { init, check, spend, status, reset, requiresGovernance, GOVERNANCE_GATES };
