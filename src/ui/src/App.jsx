// src/ui/src/App.jsx — motiahq Dashboard
// Developed by nenifix.com

import React, { useState, useEffect, useCallback } from 'react';
import OrgChart from './components/OrgChart';
import TaskBoard from './components/TaskBoard';
import BudgetDashboard from './components/BudgetDashboard';
import LogsPanel from './components/LogsPanel';
import HermesReviewModal from './components/HermesReviewModal';

const API = '/api';

function api(path, opts = {}) {
  const token = localStorage.getItem('motiahq_token') || '';
  return fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  }).then(r => r.json());
}

export default function App() {
  const [tab, setTab] = useState('org');
  const [org, setOrg] = useState({ agents: [], budget: {} });
  const [tasks, setTasks] = useState([]);
  const [reviewTask, setReviewTask] = useState(null);
  const [newTask, setNewTask] = useState('');
  const [complexity, setComplexity] = useState('');
  const [toast, setToast] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [orgData, taskData] = await Promise.all([
        api('/org'),
        api('/task'),
      ]);
      setOrg(orgData);
      setTasks(taskData);
    } catch (e) { /* silent */ }
  }, []);

  useEffect(() => { refresh(); const i = setInterval(refresh, 5000); return () => clearInterval(i); }, [refresh]);

  async function submitTask(e) {
    e.preventDefault();
    if (!newTask.trim()) return;
    try {
      await api('/task', { method: 'POST', body: JSON.stringify({ goal: newTask, complexity: complexity || undefined }) });
      setNewTask('');
      setComplexity('');
      showToast('Task submitted');
      refresh();
    } catch { showToast('Failed to submit'); }
  }

  async function approveTask(taskId) {
    await api(`/approve/${taskId}`, { method: 'POST' });
    showToast('Hermes review triggered');
    refresh();
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  const tabs = [
    { key: 'org', label: '⚒ Org Chart' },
    { key: 'tasks', label: '📋 Tasks' },
    { key: 'budget', label: '💰 Budget' },
    { key: 'logs', label: '📜 Logs' },
  ];

  return (
    <div style={s.app}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.brand}>
          <span style={s.brandIcon}>⚒</span>
          <span style={s.brandText}>motiahq</span>
          <span style={s.brandSub}> • Developed by nenifix.com</span>
        </div>
        <nav style={s.nav}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ ...s.tabBtn, ...(tab === t.key ? s.tabActive : {}) }}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Toast */}
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Task submission */}
      {tab === 'tasks' && (
        <form onSubmit={submitTask} style={s.taskForm}>
          <input value={newTask} onChange={e => setNewTask(e.target.value)}
            placeholder="Describe your task..." style={s.input} />
          <select value={complexity} onChange={e => setComplexity(e.target.value)} style={s.select}>
            <option value="">Auto-detect complexity</option>
            <option value="simple">Simple → motia</option>
            <option value="complex">Complex → motiahene</option>
          </select>
          <button type="submit" style={s.submitBtn}>Submit</button>
        </form>
      )}

      {/* Tab content */}
      <main style={s.main}>
        {tab === 'org' && <OrgChart agents={org.agents} budget={org.budget} />}
        {tab === 'tasks' && <TaskBoard tasks={tasks} onReview={t => setReviewTask(t)} onApprove={approveTask} />}
        {tab === 'budget' && <BudgetDashboard budget={org.budget} onReset={() => api('/budget/reset', { method: 'POST' }).then(refresh)} />}
        {tab === 'logs' && <LogsPanel tasks={tasks} agents={org.agents} />}
      </main>

      {/* Hermes Review Modal */}
      {reviewTask && <HermesReviewModal task={reviewTask} onClose={() => setReviewTask(null)} />}

      {/* Footer */}
      <footer style={s.footer}>
        motiahq v1.0.0 • Developed by nenifix.com
      </footer>
    </div>
  );
}

const s = {
  app: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#0d1117', color: '#c9d1d9', minHeight: '100vh' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: '#161b22', borderBottom: '1px solid #30363d' },
  brand: { display: 'flex', alignItems: 'center', gap: '8px' },
  brandIcon: { fontSize: '20px' },
  brandText: { fontWeight: 'bold', fontSize: '18px', color: '#58a6ff' },
  brandSub: { fontSize: '12px', color: '#8b949e' },
  nav: { display: 'flex', gap: '4px' },
  tabBtn: { background: 'none', border: 'none', color: '#8b949e', padding: '8px 16px', cursor: 'pointer', borderRadius: '6px', fontSize: '14px' },
  tabActive: { background: '#21262d', color: '#c9d1d9' },
  toast: { position: 'fixed', top: '60px', right: '24px', background: '#238636', color: '#fff', padding: '8px 16px', borderRadius: '6px', zIndex: 1000, fontSize: '14px' },
  taskForm: { display: 'flex', gap: '8px', padding: '16px 24px', background: '#161b22', borderBottom: '1px solid #30363d' },
  input: { flex: 1, background: '#0d1117', border: '1px solid #30363d', color: '#c9d1d9', padding: '8px 12px', borderRadius: '6px', fontSize: '14px' },
  select: { background: '#0d1117', border: '1px solid #30363d', color: '#c9d1d9', padding: '8px', borderRadius: '6px' },
  submitBtn: { background: '#238636', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  main: { padding: '24px', maxWidth: '1200px', margin: '0 auto' },
  footer: { textAlign: 'center', padding: '16px', color: '#484f58', fontSize: '12px', borderTop: '1px solid #21262d' },
};
