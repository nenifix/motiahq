// src/ui/src/components/TaskBoard.jsx
// Developed by nenifix.com

import React from 'react';

const STATUS_COLORS = {
  pending: '#8b949e',
  assigned: '#d29922',
  running: '#58a6ff',
  completed: '#238636',
  failed: '#da3633',
  cancelled: '#484f58',
  approved: '#a371f7',
  rejected: '#da3633',
};

const STATUS_ICONS = {
  pending: '⏳',
  assigned: '📌',
  running: '🏃',
  completed: '✅',
  failed: '❌',
  cancelled: '🚫',
  approved: '✅',
  rejected: '❌',
};

export default function TaskBoard({ tasks, onReview, onApprove }) {
  const columns = ['pending', 'assigned', 'running', 'completed', 'failed'];

  if (!tasks.length) {
    return <div style={{ textAlign: 'center', color: '#484f58', padding: '48px' }}>No tasks yet. Submit one above!</div>;
  }

  return (
    <div>
      <h2 style={{ color: '#58a6ff', marginBottom: '24px' }}>📋 Task Board</h2>
      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto' }}>
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col);
          return (
            <div key={col} style={{ minWidth: '220px', flex: 1 }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', color: STATUS_COLORS[col], fontSize: '13px', textTransform: 'uppercase' }}>
                {col} ({colTasks.length})
              </div>
              {colTasks.map(t => (
                <div key={t.id} style={taskCard}>
                  <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '4px' }}>{t.id.slice(0, 8)}</div>
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>{t.goal.slice(0, 80)}{t.goal.length > 80 ? '…' : ''}</div>
                  <div style={{ fontSize: '11px', color: '#8b949e' }}>
                    {STATUS_ICONS[t.status]} {t.assignedTo && `→ ${t.assignedTo}`}
                  </div>
                  {t.hermesReview && (
                    <div style={{ fontSize: '11px', marginTop: '4px', color: t.hermesReview.approved ? '#238636' : '#da3633' }}>
                      Hermes: {t.hermesReview.approved ? '✅' : '❌'} {t.hermesReview.score}/10
                    </div>
                  )}
                  <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                    <button onClick={() => onReview(t)} style={btnStyle('#58a6ff')}>Review</button>
                    {(t.status === 'completed' || t.status === 'approved') && (
                      <button onClick={() => onApprove(t.id)} style={btnStyle('#238636')}>Approve</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const taskCard = {
  background: '#161b22',
  border: '1px solid #30363d',
  borderRadius: '6px',
  padding: '12px',
  marginBottom: '8px',
};

function btnStyle(color) {
  return { background: 'none', border: `1px solid ${color}`, color, padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' };
}
