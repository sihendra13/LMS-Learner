import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';

const MobileSertifikat = ({ onOpenSync }) => {
  const { quizSubmissions, videos, currentUser, passingScore, validityMonths, retakeQuiz, setActivePage, MAX_RETAKES, tenant } = useTenant();
  const [activeTab, setActiveTab] = useState('sertifikat');
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const mySubmissions = quizSubmissions.filter(s => s.employeeName === currentUser.name);

  // Approved certificates only
  const certificates = mySubmissions
    .filter(sub => sub.certStatus === 'approved')
    .map((sub, idx) => {
      const issueDate = sub.approvedDate || sub.date || '09 Jun 2026';
      const expiryDate = validityMonths === 999 ? 'Selamanya' : `09 Jun ${2026 + Math.floor(validityMonths / 12)}`;
      return {
        id: `CERT-2026${100 + idx}`,
        employeeName: sub.employeeName,
        videoTitle: sub.videoTitle,
        score: sub.postScore,
        preScore: sub.preScore,
        issueDate,
        approvedBy: sub.approvedBy || 'HRD',
        expiryDate,
      };
    });

  const certStatusLabel = (sub) => {
    if (sub.certStatus === 'approved')      return { label: 'Sertifikat Aktif',             color: '#15803d', bg: '#f0fdf4', border: '#86efac' };
    if (sub.certStatus === 'rejected')      return { label: 'Ditolak Final',                color: '#b91c1c', bg: '#fff5f5', border: '#fecaca' };
    if (sub.certStatus === 'remedial')      return { label: 'Perlu Remedial',               color: '#b45309', bg: '#fff7ed', border: '#fed7aa' };
    if (sub.certStatus === 'supervisor_ok') return { label: 'Direkomendasi — Menunggu HRD', color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' };
    return { label: 'Menunggu Review Supervisor', color: '#92400e', bg: '#fffbeb', border: '#fde68a' };
  };

  const handleRetake = (sub) => {
    const video = videos.find(v => v.title === sub.videoTitle);
    if (!video) return;
    retakeQuiz(video.id, sub.id);
  };

  const handleLocalSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSyncSuccess(true);
      if (onOpenSync) {
        onOpenSync();
      }
      setTimeout(() => {
        setSyncSuccess(false);
      }, 2000);
    }, 1200);
  };

  return (
    <div style={{ padding: '16px 16px 30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* HEADER */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text1)', marginBottom: '4px' }}>Sertifikat &amp; Riwayat Kuis</h2>
        <p style={{ color: 'var(--text3)', fontSize: '12px' }}>
          Pantau status sertifikat dan lihat riwayat kuis SOP yang sudah Anda kerjakan.
        </p>
      </div>

      {/* STATS ROW */}
      <div className="stats-row" style={{ margin: 0, gap: '10px' }}>
        <div className="stat-mini" style={{ padding: '10px 12px', gap: '8px' }}>
          <div className="stat-ic blue" style={{ width: '32px', height: '32px', borderRadius: '6px', fontSize: '15px' }}>🏆</div>
          <div>
            <div className="s-val" style={{ fontSize: '15px' }}>{certificates.length}</div>
            <div className="s-lbl" style={{ fontSize: '9px' }}>Sertifikat Aktif</div>
          </div>
        </div>
        <div className="stat-mini" style={{ padding: '10px 12px', gap: '8px' }}>
          <div className="stat-ic amber" style={{ width: '32px', height: '32px', borderRadius: '6px', fontSize: '15px' }}>⏳</div>
          <div>
            <div className="s-val" style={{ fontSize: '15px' }}>{mySubmissions.filter(s => !s.certStatus || s.certStatus === 'pending').length}</div>
            <div className="s-lbl" style={{ fontSize: '9px' }}>Menunggu</div>
          </div>
        </div>
        <div className="stat-mini" style={{ padding: '10px 12px', gap: '8px' }}>
          <div className="stat-ic green" style={{ width: '32px', height: '32px', borderRadius: '6px', fontSize: '15px' }}>🎯</div>
          <div>
            <div className="s-val" style={{ fontSize: '15px' }}>{passingScore}%</div>
            <div className="s-lbl" style={{ fontSize: '9px' }}>Passing Grade</div>
          </div>
        </div>
        <div className="stat-mini" style={{ padding: '10px 12px', gap: '8px' }}>
          <div className="stat-ic purple" style={{ width: '32px', height: '32px', borderRadius: '6px', fontSize: '15px' }}>📅</div>
          <div>
            <div className="s-val" style={{ fontSize: '15px' }}>{validityMonths === 999 ? '∞' : `${validityMonths} bln`}</div>
            <div className="s-lbl" style={{ fontSize: '9px' }}>Masa Berlaku</div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px', borderBottom: '2px solid var(--border)' }}>
        {[
          { key: 'sertifikat', label: `Sertifikat (${certificates.length})` },
          { key: 'riwayat', label: `Riwayat Kuis (${mySubmissions.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 14px', fontSize: '12px', fontWeight: '600', border: 'none',
              background: 'none', cursor: 'pointer', borderBottom: '2px solid transparent',
              marginBottom: '-2px', transition: 'all 0.15s',
              color: activeTab === tab.key ? 'var(--accent)' : 'var(--text3)',
              borderBottomColor: activeTab === tab.key ? 'var(--accent)' : 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: SERTIFIKAT */}
      {activeTab === 'sertifikat' && (
        <div className="card">
          {certificates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text3)' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
              <h4 style={{ fontWeight: '600', color: 'var(--text1)', marginBottom: '4px', fontSize: '13px' }}>Belum Ada Sertifikat Aktif</h4>
              <p style={{ fontSize: '11px', lineHeight: '1.5' }}>
                Sertifikat akan terbit setelah HRD memverifikasi hasil kuis Anda.<br/>
                Selesaikan kuis SOP dan tunggu konfirmasi dari HRD.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {certificates.map((cert) => (
                <div key={cert.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>ID: {cert.id}</div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a' }}>Skor: {cert.score}%</div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text1)' }}>{cert.videoTitle}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                    <div>Terbit: {cert.issueDate}</div>
                    <div style={{ fontWeight: '700', color: '#10b981' }}>Masa Berlaku: {cert.expiryDate}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <button
                      onClick={() => alert(`Unduh simulasi PDF untuk: ${cert.videoTitle}`)}
                      className="btn-sec"
                      style={{ fontSize: '11px', padding: '4px 10px', width: '100%' }}
                    >
                      📥 Unduh Sertifikat (PDF)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: RIWAYAT KUIS */}
      {activeTab === 'riwayat' && (
        <div className="card">
          {mySubmissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text3)' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📂</div>
              <h4 style={{ fontWeight: '600', color: 'var(--text1)', marginBottom: '4px', fontSize: '13px' }}>Belum Ada Riwayat Kuis</h4>
              <p style={{ fontSize: '11px' }}>Anda belum pernah mengerjakan kuis SOP.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {mySubmissions.map((sub) => {
                const status = certStatusLabel(sub);
                const isRemedial = sub.certStatus === 'remedial';
                
                return (
                  <div key={sub.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Tanggal: {sub.date || '09 Jun 2026'}</div>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: '700',
                        color: status.color,
                        background: status.bg,
                        border: `1px solid ${status.border}`,
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {status.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text1)' }}>{sub.videoTitle}</div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text2)' }}>
                        Skor: <strong style={{ color: sub.postScore >= passingScore ? 'var(--green)' : 'var(--red)' }}>{sub.postScore}%</strong> 
                        <span style={{ color: 'var(--text3)', marginLeft: '6px' }}> (Pre-test: {sub.preScore || 0}%)</span>
                      </div>
                      
                      {isRemedial && (
                        <button
                          onClick={() => handleRetake(sub)}
                          className="btn-primary"
                          style={{ fontSize: '11px', padding: '4px 10px' }}
                        >
                          Mengulang Kuis
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sync Data Action Section */}
      <div className="card" style={{ padding: '16px', borderStyle: 'dashed', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justify: 'center', fontSize: '20px' }}>🔄</div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text1)' }}>Data Belum Sinkron?</div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>
            Hubungkan dan sinkronkan data hasil kuis dan status sertifikat Anda dengan database admin.
          </div>
        </div>
        <button 
          onClick={handleLocalSync}
          disabled={syncing}
          className="btn-sync"
          style={{
            background: syncSuccess ? 'var(--green)' : 'var(--navy2)',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: syncing ? 'default' : 'pointer',
            width: '100%',
            justifyContent: 'center',
            height: '36px'
          }}
        >
          {syncing ? 'Menyinkronkan...' : syncSuccess ? 'Berhasil Disinkronkan ✓' : 'Sinkronkan State Database'}
        </button>
      </div>

    </div>
  );
};

export default MobileSertifikat;
