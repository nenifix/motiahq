// src/ui/src/components/HermesReviewModal.jsx
// Developed by nenifix.com

import React, { useState } from 'react';

export default function HermesReviewModal({ task, onClose }) {
  const [reviewing, setReviewing] = useState(false);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '12px', padding: '24px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ color: '#ffd700', margin: 0 }}>🏔️ Hermes Review</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: '#8b949e' }}>Task: {task.id}</div>
          <div style={{ fontSize: '15px', marginTop: '4px' }}>{task.goal}</div>
        </div>
        {task.hermesReview ? (
          <div>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              Score: <span style={{ color: '#ffd700', fontWeight: 'bold' }}>{task.hermesReview.score}/10</span>
              {' '}Status: <span style={{ color: task.hermesReview.approved ? '#238636' : '#da3633', fontWeight: 'bold' }}>
                {task.hermesReview.approved ? '✅ APPROVED' : '❌ REJECTED'}
              </span>
            </div>
            <pre style={{ background: '#0d1117', padding: '12px', borderRadius: '6px', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
              {task.hermesReview.feedback}
            </pre>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#484f58', padding: '24px' }}>
            {reviewing ? '⏳ Consulting Hermes…' : 'Click "Request Review" to start'}
          </div>
        )}
      </div>
    </div>
  );
}
