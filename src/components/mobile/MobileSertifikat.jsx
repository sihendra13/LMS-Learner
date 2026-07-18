import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { PLANS } from '../../utils/featureGates';

const MobileSertifikat = () => {
  const { quizSubmissions, videos, currentUser, passingScore, validityMonths, retakeQuiz, setActivePage, MAX_RETAKES, tenant, companyLogo } = useTenant();
  const [activeTab, setActiveTab] = useState('sertifikat');
  const [previewCert, setPreviewCert] = useState(null);

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
    if (sub.certStatus === 'rejected')      return { label: 'Tidak Lulus',                color: '#b91c1c', bg: '#fff5f5', border: '#fecaca' };
    if (sub.certStatus === 'remedial') {
      const rCount = sub.retakeCount || 0;
      return rCount >= 3 
        ? { label: 'Tidak Lulus', color: '#b91c1c', bg: '#fff5f5', border: '#fecaca' }
        : { label: rCount > 0 ? `Perlu Remedial (Ke-${rCount + 1})` : 'Perlu Remedial', color: '#b45309', bg: '#fff7ed', border: '#fed7aa' };
    }
    if (sub.certStatus === 'supervisor_ok') return { label: 'Direkomendasi — Menunggu HRD', color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' };
    return { label: 'Menunggu Review Supervisor', color: '#92400e', bg: '#fffbeb', border: '#fde68a' };
  };

  const handleRetake = (sub) => {
    const video = videos.find(v => v.title === sub.videoTitle);
    if (!video) return;
    retakeQuiz(video.id, sub.id);
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
          <div className="stat-ic blue" style={{ width: '32px', height: '32px', borderRadius: '6px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/>
              <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"/>
              <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z"/>
            </svg>
          </div>
          <div>
            <div className="s-val" style={{ fontSize: '15px' }}>{certificates.length}</div>
            <div className="s-lbl" style={{ fontSize: '9px' }}>Sertifikat Aktif</div>
          </div>
        </div>
        <div className="stat-mini" style={{ padding: '10px 12px', gap: '8px' }}>
          <div className="stat-ic amber" style={{ width: '32px', height: '32px', borderRadius: '6px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 2h14"/>
              <path d="M5 22h14"/>
              <path d="M19 2v4c0 3-2 5-5 7 3 2 5 4 5 7v4"/>
              <path d="M5 2v4c0 3 2 5 5 7-3 2-5 4-5 7v4"/>
            </svg>
          </div>
          <div>
            <div className="s-val" style={{ fontSize: '15px' }}>{mySubmissions.filter(s => !s.certStatus || s.certStatus === 'pending').length}</div>
            <div className="s-lbl" style={{ fontSize: '9px' }}>Menunggu</div>
          </div>
        </div>
        <div className="stat-mini" style={{ padding: '10px 12px', gap: '8px' }}>
          <div className="stat-ic green" style={{ width: '32px', height: '32px', borderRadius: '6px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
          </div>
          <div>
            <div className="s-val" style={{ fontSize: '15px' }}>{passingScore}%</div>
            <div className="s-lbl" style={{ fontSize: '9px' }}>Passing Grade</div>
          </div>
        </div>
        <div className="stat-mini" style={{ padding: '10px 12px', gap: '8px' }}>
          <div className="stat-ic purple" style={{ width: '32px', height: '32px', borderRadius: '6px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
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
                      onClick={() => setPreviewCert(cert)}
                      className="btn-sec"
                      style={{ fontSize: '11px', padding: '6px 10px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Lihat Sertifikat
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
                const retakeCount = sub.retakeCount || 0;
                const canRetake = isRemedial && retakeCount < MAX_RETAKES;
                const maxReached = isRemedial && retakeCount >= MAX_RETAKES;
                
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
                    
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginTop: '2px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                        Pre-Test: <strong style={{ color: sub.preScore >= passingScore ? '#16a34a' : '#dc2626' }}>{sub.preScore ?? '—'}%</strong>
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                        Post-Test: <strong style={{ color: sub.postScore >= passingScore ? '#16a34a' : '#dc2626' }}>{sub.postScore ?? '—'}%</strong>
                      </span>
                      {isRemedial && retakeCount > 0 && (
                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#b45309', background: '#fff7ed', border: '1px solid #fed7aa', padding: '1px 7px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                            <path d="M9 14l2 2 4-4"></path>
                          </svg>
                          Remedial ke-{retakeCount} dari {MAX_RETAKES}
                        </span>
                      )}
                    </div>

                    {/* Remedial note from supervisor */}
                    {isRemedial && sub.supervisorNote && (
                      <div style={{ fontSize: '11px', color: '#b45309', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '6px', padding: '6px 10px', marginTop: '4px', lineHeight: '1.5' }}>
                        💬 <strong>Catatan Supervisor:</strong> {sub.supervisorNote}
                      </div>
                    )}
                    {/* Rejected note from HRD */}
                    {sub.certStatus === 'rejected' && sub.rejectionNote && (
                      <div style={{ fontSize: '11px', color: '#b91c1c', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 10px', marginTop: '4px', lineHeight: '1.5' }}>
                        ⛔ <strong>Alasan Penolakan:</strong> {sub.rejectionNote}
                      </div>
                    )}
                    {/* Max retake warning */}
                    {maxReached && (
                      <div style={{ fontSize: '11px', color: '#b91c1c', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 10px', marginTop: '4px', lineHeight: '1.5' }}>
                        Anda telah mencapai batas maksimal {MAX_RETAKES}x remedial. Silakan hubungi HRD/Supervisor Anda untuk tindak lanjut.
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                      {sub.certStatus === 'approved' && (() => {
                        const cert = certificates.find(c => c.videoTitle === sub.videoTitle);
                        return cert ? (
                          <button
                            onClick={() => setPreviewCert(cert)}
                            style={{
                              padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700',
                              background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                          >
                            🏆 Lihat Sertifikat
                          </button>
                        ) : null;
                      })()}
                      {canRetake && (
                        <button
                          onClick={() => handleRetake(sub)}
                          style={{
                            padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: '700',
                            background: '#fff7ed', border: '1px solid #fed7aa', color: '#b45309',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                          }}
                        >
                          ↩ Kerjakan Ulang
                          <span style={{ fontSize: '10px', color: '#92400e', fontWeight: '400' }}>({retakeCount}/{MAX_RETAKES})</span>
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

      {/* CERTIFICATE PREVIEW MODAL */}
      {previewCert && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }} onClick={() => setPreviewCert(null)}>
          <div style={{
            background: '#ffffff', padding: '20px 16px', borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: '90%',
            maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            <button
              style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text3)' }}
              onClick={() => setPreviewCert(null)}
            >✕</button>

            <div className="print-area" style={{
              border: '6px double #0f172a',
              padding: '16px', textAlign: 'center', background: '#fefefe',
              borderRadius: '8px', fontFamily: "'Plus Jakarta Sans', serif",
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: '#eff6ff', opacity: 0.5, zIndex: 1 }} />
              {tenant?.plan === PLANS.ENTERPRISE && companyLogo ? (
                <div style={{ marginBottom: '12px' }}>
                  <img src={companyLogo} alt={tenant?.name} style={{ maxHeight: '38px', maxWidth: '140px', objectFit: 'contain' }} />
                </div>
              ) : (
                <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text3)', marginBottom: '12px' }}>
                  {tenant?.name}
                </div>
              )}
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '0.5px' }}>
                SERTIFIKAT KELULUSAN
              </h1>
              <div style={{ width: '40px', height: '2px', background: '#0f172a', margin: '0 auto 16px auto' }} />
              <p style={{ fontSize: '10px', color: 'var(--text3)', margin: '0 0 12px 0', fontStyle: 'italic' }}>
                Dengan ini secara resmi menyatakan dan menganugerahkan penghargaan kepada:
              </p>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text1)', margin: '8px 0', textDecoration: 'underline' }}>
                {previewCert.employeeName}
              </h2>
              <p style={{ fontSize: '10px', color: 'var(--text3)', margin: '10px auto', maxWidth: '320px', lineHeight: '1.5' }}>
                Atas kelulusan luar biasa dan kompetensi penuh yang ditunjukkan dalam menyelesaikan pelatihan materi video standar perusahaan:
              </p>
              <h3 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', margin: '8px 0 20px 0' }}>
                {previewCert.videoTitle}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px', alignItems: 'stretch', position: 'relative', zIndex: 2, borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <div style={{ textAlign: 'left', fontSize: '10px', color: 'var(--text2)' }}>
                  <div style={{ marginBottom: '3px' }}><strong>ID Sertifikat:</strong> {previewCert.id}</div>
                  <div style={{ marginBottom: '3px' }}><strong>Tanggal Terbit:</strong> {previewCert.issueDate}</div>
                  <div style={{ marginBottom: '3px' }}><strong>Masa Berlaku:</strong> {previewCert.expiryDate}</div>
                  <div><strong>Skor Kuis:</strong> <span style={{ color: 'var(--green)', fontWeight: '600' }}>{previewCert.score}%</span></div>
                  <div style={{ marginTop: '6px', fontSize: '7px', color: '#cbd5e1' }}>Sertifikat ini diterbitkan melalui platform myAxara</div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '10px', borderTop: '1px dashed var(--border)', paddingTop: '10px' }}>
                  <div style={{ fontFamily: 'cursive', fontSize: '16px', color: '#1e3a8a', height: '25px', lineHeight: '25px' }}>
                    {previewCert.approvedBy}
                  </div>
                  <div style={{ width: '100px', height: '1px', background: 'var(--border)', margin: '4px auto' }} />
                  <div style={{ fontSize: '9px', color: 'var(--text3)', fontWeight: '600', textTransform: 'uppercase' }}>
                    HR Manager, {tenant?.name}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn-sec" style={{ fontSize: '11px', padding: '6px 12px' }} onClick={() => setPreviewCert(null)}>Tutup</button>
              <button className="btn-primary" style={{ background: '#002D72', fontSize: '11px', padding: '6px 12px' }} onClick={() => window.print()}>
                Download Sertifikat
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MobileSertifikat;
