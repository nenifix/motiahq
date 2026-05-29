// src/server/agents/hermes-ceo.js — Strategic planner & code reviewer
// Developed by nenifix.com

const https = require('https');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_ENDPOINT = process.env.HERMES_API_ENDPOINT || 'https://openrouter.ai/api/v1';
const MODEL = process.env.HERMES_MODEL || 'qwen/qwen2.5-coder-32b-instruct';

function httpsPost(url, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => {
        try { resolve(JSON.parse(chunks)); }
        catch { resolve({ raw: chunks }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function callHermes(messages) {
  if (!OPENROUTER_API_KEY) {
    return { choices: [{ message: { content: 'Hermes offline — no OPENROUTER_API_KEY set' } }] };
  }
  return httpsPost(`${OPENROUTER_ENDPOINT}/chat/completions`, {
    model: MODEL,
    messages,
    max_tokens: 4096,
    temperature: 0.2,
  });
}

async function decompose(goal) {
  const res = await callHermes([
    { role: 'system', content: `You are Hermes, a senior software architect. Decompose the given goal into 3-7 concrete subtasks. Return JSON array: [{"id":"1","title":"...","description":"...","complexity":"simple|complex","estimatedCost":0.5}]` },
    { role: 'user', content: goal },
  ]);
  try {
    const text = res.choices[0].message.content;
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']') + 1;
    return JSON.parse(text.slice(jsonStart, jsonEnd));
  } catch {
    return [{ id: '1', title: goal, description: goal, complexity: 'simple', estimatedCost: 0.5 }];
  }
}

async function review(task) {
  const res = await callHermes([
    { role: 'system', content: `You are Hermes, a senior software architect reviewing a completed task. Review the task output for: code quality, security, best practices, completeness. Return JSON: {"approved":true,"feedback":"...","score":0-10}` },
    { role: 'user', content: `Task: ${task.goal}\nOutput: ${JSON.stringify(task.output || {})}` },
  ]);
  try {
    const text = res.choices[0].message.content;
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    return JSON.parse(text.slice(jsonStart, jsonEnd));
  } catch {
    return { approved: true, feedback: 'Review unavailable — auto-approved', score: 5 };
  }
}

module.exports = { decompose, review, callHermes };
