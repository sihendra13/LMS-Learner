import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';

export const SyncPanel = ({ isOpen, onClose }) => {
  const { exportDBString, importDBString } = useTenant();
  const [jsonInput, setJsonInput] = useState(() => exportDBString());
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(exportDBString());
    setMsg('Database copied to clipboard!');
    setIsError(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleImport = () => {
    const res = importDBString(jsonInput);
    if (res.success) {
      setMsg('Database successfully imported and updated!');
      setIsError(false);
      setTimeout(() => {
        setMsg('');
        onClose();
        window.location.reload(); // reload to reflect changes globally
      }, 1500);
    } else {
      setMsg(res.error || 'Import failed.');
      setIsError(true);
    }
  };

  return (
    <div className="sync-panel-modal" onClick={onClose}>
      <div className="sync-panel-card" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text1)' }}>
            🔄 Local Database Sync Tool
          </h3>
          <button style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text3)' }} onClick={onClose}>✕</button>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: '1.4', marginBottom: '12px' }}>
          Gunakan tool ini untuk menyinkronkan data (Kuis, Sertifikasi, dll.) antara aplikasi <strong>LMS Learner</strong> (port ini) dengan <strong>LMS Admin</strong> (port lain) dengan menyalin dan menempelkan JSON state di bawah.
        </p>

        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text2)', display: 'block', textTransform: 'uppercase' }}>
          Raw Database State (JSON)
        </label>
        
        <textarea 
          className="sync-textarea" 
          value={jsonInput}
          onChange={e => setJsonInput(e.target.value)}
          placeholder="Paste JSON DB state here..."
        />

        {msg && (
          <div style={{ 
            padding: '10px 12px', 
            borderRadius: '6px', 
            fontSize: '12px', 
            marginBottom: '14px',
            background: isError ? '#fce8e6' : '#e6f4ea',
            color: isError ? '#c5221f' : '#137333',
            fontWeight: '600'
          }}>
            {msg}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn-sec" onClick={handleCopy}>
            📋 Salin (Export)
          </button>
          <button className="btn-primary" onClick={handleImport} style={{ background: '#002D72' }}>
            📥 Terapkan (Import)
          </button>
        </div>
      </div>
    </div>
  );
};
