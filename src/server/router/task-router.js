// src/server/router/task-router.js — Complexity-based task routing engine
// Developed by nenifix.com

const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();

const COMPLEX_KEYWORDS = [
  'auth', 'authentication', 'authorization', 'jwt', 'oauth', 'session',
  'database', 'schema', 'migration', 'sql', 'postgres', 'mysql',
  'api', 'rest', 'graphql', 'websocket', 'grpc',
  'deploy', 'docker', 'kubernetes', 'ci', 'cd', 'pipeline',
  'telegram', 'bot', 'webhook', 'mcp', 'server',
  'multi-file', 'refactor', 'architecture', 'design',
];

const SIMPLE_KEYWORDS = [
  'fix', 'lint', 'format', 'rename', 'typo', 'comment',
  'single', 'small', 'quick', 'update', 'bump',
];

function classifyComplexity(goal, explicitComplexity) {
  if (explicitComplexity === 'simple' || explicitComplexity === 'complex') {
    return explicitComplexity;
  }

  const lower = goal.toLowerCase();
  let complexScore = 0;
  let simpleScore = 0;

  for (const kw of COMPLEX_KEYWORDS) {
    if (lower.includes(kw)) complexScore++;
  }
  for (const kw of SIMPLE_KEYWORDS) {
    if (lower.includes(kw)) simpleScore++;
  }

  // Longer goals tend to be more complex
  if (goal.length > 100) complexScore++;
  if (goal.length < 30) simpleScore++;

  return complexScore > simpleScore ? 'complex' : 'simple';
}

function create({ goal, complexity, budget, model }) {
  const id = uuidv4();
  const resolvedComplexity = classifyComplexity(goal, complexity);
  return {
    id,
    goal,
    complexity: resolvedComplexity,
    budget: budget || null,
    model: model || null,
    status: 'pending',
    assignedTo: null,
    output: null,
    error: null,
    hermesReview: null,
    estimatedCost: resolvedComplexity === 'complex' ? 1.0 : 0.3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function route(task, agents) {
  const target = task.complexity === 'complex' ? 'motiahene' : 'motia';

  // Check if target is online
  if (agents[target] && agents[target].status === 'offline') {
    // Fallback: try the other agent
    const fallback = target === 'motia' ? 'motiahene' : 'motia';
    if (agents[fallback] && agents[fallback].status === 'online') {
      return { agent: fallback, reason: `${target} offline, using ${fallback}` };
    }
    throw new Error(`No available agents. ${target} is offline.`);
  }

  return { agent: target, reason: `Complexity: ${task.complexity}` };
}

module.exports = { create, route, classifyComplexity };
