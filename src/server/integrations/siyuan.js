// src/server/integrations/siyuan.js — SiYuan API client for shared memory
// Developed by nenifix.com

const https = require('https');
const http = require('http');

const API_URL = process.env.SIYUAN_API_URL || 'http://localhost:6806/api';
const API_TOKEN = process.env.SIYUAN_API_TOKEN || '';

function request(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + endpoint);
    const data = body ? JSON.stringify(body) : '';
    const mod = url.protocol === 'https:' ? https : http;

    const req = mod.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(API_TOKEN ? { 'Authorization': `Token ${API_TOKEN}` } : {}),
        ...(body ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, res => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => {
        try { resolve(JSON.parse(chunks)); }
        catch { resolve({ raw: chunks }); }
      });
    });

    req.on('error', () => resolve({ error: 'SiYuan unreachable' }));
    if (data) req.write(data);
    req.end();
  });
}

async function ping() {
  const res = await request('POST', '/system/version');
  return !res.error;
}

async function upsertDoc(notebook, path, markdown) {
  return request('POST', '/filetree/createDocWithMd', {
    notebook,
    path,
    markdown,
  });
}

async function queryBlocks(sql) {
  return request('POST', '/query/sql', { stmt: sql });
}

async function insertBlock(dataType, data, previousID = '') {
  return request('POST', '/block/insertBlock', {
    dataType,
    data,
    previousID,
  });
}

async function backupState(state) {
  const today = new Date().toISOString().slice(0, 10);
  const markdown = `# motiahq State Backup — ${today}\n\n\`\`\`json\n${JSON.stringify(state, null, 2)}\n\`\`\``;
  return upsertDoc('motiahq', `/backups/${today}`, markdown);
}

async function getMemory(key) {
  const res = await queryBlocks(
    `SELECT * FROM blocks WHERE content LIKE '%${key}%' AND type = 'd' ORDER BY created DESC LIMIT 1`
  );
  return res.data || [];
}

module.exports = { ping, upsertDoc, queryBlocks, insertBlock, backupState, getMemory };
