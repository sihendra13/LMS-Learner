import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';

export const SyncPanel = ({ isOpen, onClose }) => {
  const { importDBString } = useTenant();
  const [status, setStatus] = useState('idle'); // idle | loading | preview | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [preview, setPreview] = useState(null);
  const [parsedData, setParsedData] = useState(null);

  if (!isOpen) return null;

  const handlePasteAndSync = async () => {
    setStatus('loading');
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim().startsWith('{')) {
        setStatus('error');
        setErrorMsg('Clipboard kosong atau bukan data valid. Salin ulang dari Admin dulu.');
        return;
      }
      const parsed = JSON.parse(text);
      const previewData = {
        videos: parsed.videos?.filter(v => !v.archived).length || 0,
        employees: parsed.employees?.length || 0,
        quizSubmissions: parsed.quizSubmissions?.length || 0,
      };
      setParsedData(text);
      setPreview(previewData);
      setStatus('preview');
    } catch (e) {
      setStatus('error');
      setErrorMsg('Gagal membaca clipboard. Pastikan browser mengizinkan akses clipboard, atau salin ulang dari Admin.');
    }
  };

  const handleConfirmSync = () => {
    const res = importDBString(parsedData);
    if (res.success) {
      setStatus('success');
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);
    } else {
      setStatus('error');
      setErrorMsg(res.error || 'Gagal menyinkronkan data.');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setErrorMsg('');
    setPreview(null);
    setParsedData(null);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '440px', maxWidth: '92vw', padding: '28px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }} onClick={e => e.stopPropagation()}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text1)', margin: '0 0 4px' }}>Sinkronisasi dari Admin</h3>
            <p style={{ fontSize: '12px', color: 'var(--text3)', margin: 0 }}>Tempel data yang disalin dari LMS Admin</p>
          </div>
          <button style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text3)', padding: '0' }} onClick={onClose}>✕</button>
        </div>

        {/* IDLE STATE */}
        {status === 'idle' && (
          <>
            <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>📋</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text1)', marginBottom: '6px' }}>Siap untuk sinkronisasi</div>
              <div style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: '1.5' }}>
                Pastikan sudah klik <strong>Sync State</strong> di LMS Admin terlebih dahulu — data akan tersalin otomatis ke clipboard.
              </div>
            </div>
            <button
              onClick={handlePasteAndSync}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Tempel & Sinkronkan dari Admin
            </button>
          </>
        )}

        {/* LOADING */}
        {status === 'loading' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '13px', color: 'var(--text3)' }}>Membaca clipboard...</div>
          </div>
        )}

        {/* PREVIEW STATE */}
        {status === 'preview' && preview && (
          <>
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#15803d', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Data dari Admin siap diterapkan
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {[
                  { label: 'Video', value: preview.videos, icon: '🎬' },
                  { label: 'Karyawan', value: preview.employees, icon: '👥' },
                  { label: 'Hasil Kuis', value: preview.quizSubmissions, icon: '📝' },
                ].map(item => (
                  <div key={item.label} style={{ background: '#fff', borderRadius: '6px', padding: '10px', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '16px' }}>{item.icon}</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text1)' }}>{item.value}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleReset} style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: '1px solid var(--border)', background: '#fff', color: 'var(--text2)', cursor: 'pointer' }}>
                Batal
              </button>
              <button onClick={handleConfirmSync} className="btn-primary" style={{ flex: 2, padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                Terapkan Sekarang
              </button>
            </div>
          </>
        )}

        {/* SUCCESS */}
        {status === 'success' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text1)', marginBottom: '6px' }}>Sinkronisasi Berhasil!</div>
            <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Halaman akan dimuat ulang...</div>
          </div>
        )}

        {/* ERROR */}
        {status === 'error' && (
          <>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '16px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{ fontSize: '13px', color: '#dc2626', lineHeight: '1.5' }}>{errorMsg}</span>
            </div>
            <button onClick={handleReset} className="btn-primary" style={{ width: '100%', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
              Coba Lagi
            </button>
          </>
        )}
      </div>
    </div>
  );
};
