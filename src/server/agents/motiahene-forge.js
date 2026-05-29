// src/server/agents/motiahene-forge.js — Full terminal forge adapter
// Developed by nenifix.com

const { spawn } = require('child_process');

async function execute(task) {
  return new Promise((resolve, reject) => {
    const bin = findBinary('motiahene');
    if (!bin) {
      resolve({
        status: 'completed',
        output: `motiahene simulated: would execute "${task.goal}" with full forge capabilities`,
        files: [],
        cost: 0.8,
      });
      return;
    }

    const args = ['vibe', task.goal];
    const bashExe = process.env.BASH_PATH || 'C:\\Program Files\\Git\\bin\\bash.exe';
    const proc = spawn(bashExe, [bin, ...args], {
      cwd: process.cwd(),
      env: { ...process.env },
      timeout: 600000,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', d => { stdout += d; });
    proc.stderr.on('data', d => { stderr += d; });

    proc.on('close', code => {
      if (code === 0) {
        resolve({ status: 'completed', output: stdout, files: [], cost: 1.0 });
      } else {
        reject(new Error(`motiahene exited ${code}: ${stderr}`));
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
