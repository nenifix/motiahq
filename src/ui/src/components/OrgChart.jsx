// src/ui/src/components/OrgChart.jsx
// Developed by nenifix.com

import React from 'react';

export default function OrgChart({ agents, budget }) {
  const statusColor = { online: '#238636', offline: '#da3633', busy: '#d29922' };

  return (
    <div>
      <h2 style={{ color: '#58a6ff', marginBottom: '24px' }}>⚒ Organization Chart</h2>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        {/* CEO */}
        {agents.filter(a => a.role === 'architect').map(a => (
          <div key={a.name} style={card(a.status)}>
            <div style={{ fontSize: '24px' }}>🏔️</div>
            <div style={{ fontWeight: 'bold', color: '#ffd700' }}>{a.name}</div>
            <div style={{ fontSize: '12px', color: '#8b949e' }}>CEO Architect • {a.tasksCompleted} reviews</div>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: statusColor[a.status] || '#484f58' }} />
          </div>
        ))}

        {/* Connector */}
        <div style={{ width: '2px', height: '24px', background: '#30363d' }} />

        {/* Workers */}
        <div style={{ display: 'flex', gap: '24px' }}>
          {agents.filter(a => a.role !== 'architect').map(a => (
            <div key={a.name} style={card(a.status)}>
              <div style={{ fontSize: '24px' }}>{a.role === 'mvp-coder' ? '⚡' : '🔨'}</div>
              <div style={{ fontWeight: 'bold' }}>{a.name}</div>
              <div style={{ fontSize: '12px', color: '#8b949e' }}>{a.role} • {a.tasksCompleted} tasks</div>
              <div style={{ fontSize: '11px', color: budget[a.name]?.exceeded ? '#da3633' : '#238636' }}>
                ${budget[a.name]?.spent?.toFixed(2) || '0.00'} / ${budget[a.name]?.limit?.toFixed(2) || '—'}
              </div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: statusColor[a.status] || '#484f58' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function card(status) {
  return {
    background: '#161b22',
    border: `1px solid ${status === 'online' ? '#238636' : '#30363d'}`,
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center',
    minWidth: '200px',
    position: 'relative',
  };
}
