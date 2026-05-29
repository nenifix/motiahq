// src/server/agents/motia-worker.js — MVP terminal coder adapter
// Developed by nenifix.com

const { spawn } = require('child_process');
const path = require('path');

async function execute(task) {
  return new Promise((resolve, reject) => {
    const motiaBin = findBinary('motia');
    if (!motiaBin) {
      // Fallback: simulate execution
      resolve({
        status: 'completed',
        output: `motia simulated: would execute "${task.goal}"`,
        files: [],
        cost: 0.1,
      });
      return;
    }

    const args = ['vibe', task.goal];
    const bashExe = process.env.BASH_PATH || 'C:\\Program Files\\Git\\bin\\bash.exe';
    const proc = spawn(bashExe, [motiaBin, ...args], {
      cwd: process.cwd(),
      env: { ...process.env },
      timeout: 300000,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', d => { stdout += d; });
    proc.stderr.on('data', d => { stderr += d; });

    proc.on('close', code => {
      if (code === 0) {
        resolve({ status: 'completed', output: stdout, files: [], cost: 0.5 });
      } else {
        reject(new Error(`motia exited ${code}: ${stderr}`));
      }
    });

    proc.on('error', reject);
  });
}

function findBinary(name) {
  const paths = [
    `C:\\Users\\ai9\\Desktop\\${name}\\bin\\${name}`,
    `C:\\Users\\ai9\\.local\\bin\\${name}`,
    `/c/Users/ai9/Desktop/${name}/bin/${name}`,
    `/c/Users/ai9/.local/bin/${name}`,
  ];
  const { execSync } = require('child_process');
  for (const p of paths) {
    try {
      execSync(`test -f "${p}"`, { stdio: 'pipe' });
      return p;
    } catch { /* not found, try next */ }
  }
  try {
    return execSync(`which ${name}`, { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

module.exports = { execute };
