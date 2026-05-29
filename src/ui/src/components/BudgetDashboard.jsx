// src/ui/src/components/BudgetDashboard.jsx
// Developed by nenifix.com

import React from 'react';

export default function BudgetDashboard({ budget, onReset }) {
  if (!Object.keys(budget).length) {
    return <div style={{ textAlign: 'center', color: '#484f58', padding: '48px' }}>No budget data available.</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ color: '#58a6ff' }}>💰 Budget Dashboard</h2>
        <button onClick={onReset} style={{ background: 'none', border: '1px solid #da3633', color: '#da3633', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
          Reset Daily Budgets
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {Object.entries(budget).filter(([k]) => k !== '_date').map(([agent, data]) => {
          const pct = data.limit > 0 ? Math.min((data.spent / data.limit) * 100, 100) : 0;
          const color = data.exceeded ? '#da3633' : pct > 80 ? '#d29922' : '#238636';
          return (
            <div key={agent} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '20px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>{agent}</div>
              <div style={{ fontSize: '13px', color: '#8b949e', marginBottom: '12px' }}>
                ${data.spent.toFixed(2)} / ${data.limit.toFixed(2)}
              </div>
              <div style={{ background: '#21262d', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: '12px', color, marginTop: '8px' }}>
                {data.exceeded ? '⚠️ EXCEEDED' : `$${data.remaining.toFixed(2)} remaining`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
