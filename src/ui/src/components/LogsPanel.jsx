// src/ui/src/components/LogsPanel.jsx
// Developed by nenifix.com

import React, { useState } from 'react';

export default function LogsPanel({ tasks, agents }) {
  const [filter, setFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');

  const filtered = tasks.filter(t => {
    if (agentFilter && t.assignedTo !== agentFilter) return false;
    if (filter && !t.goal.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div>
      <h2 style={{ color: '#58a6ff', marginBottom: '24px' }}>📜 Activity Logs</h2>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input value={filter} onChange={e => setFilter(e.target.value)}
          placeholder="Filter tasks..." style={{ flex: 1, background: '#0d1117', border: '1px solid #30363d', color: '#c9d1d9', padding: '8px 12px', borderRadius: '6px' }} />
        <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)} style={{ background: '#0d1117', border: '1px solid #30363d', color: '#c9d1d9', padding: '8px', borderRadius: '6px' }}>
          <option value="">All agents</option>
          {agents.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
        </select>
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#484f58', padding: '48px' }}>No matching tasks.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(t => (
            <div key={t.id} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px' }}>
                  <span style={{ color: '#58a6ff' }}>#{t.id.slice(0, 8)}</span>
                  {' '}{t.goal.slice(0, 100)}{t.goal.length > 100 ? '…' : ''}
                </span>
                <span style={{
                  background: t.status === 'completed' || t.status === 'approved' ? '#238636' :
                    t.status === 'failed' || t.status === 'rejected' ? '#da3633' :
                    t.status === 'running' ? '#58a6ff' : '#30363d',
                  color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
                }}>{t.status}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '4px' }}>
                {t.assignedTo && `→ ${t.assignedTo} • `}{t.createdAt?.slice(0, 19)}
                {t.error && <span style={{ color: '#da3633' }}> • Error: {t.error}</span>}
              </div>
              {t.hermesReview && (
                <div style={{ fontSize: '11px', marginTop: '4px', color: '#a371f7' }}>
                  Hermes: {t.hermesReview.feedback?.slice(0, 120)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
