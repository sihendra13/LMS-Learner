import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';

export const Certifications = () => {
  const { quizSubmissions, videos, currentUser, passingScore, validityMonths, retakeQuiz, setActivePage, MAX_RETAKES } = useTenant();
  const [previewCert, setPreviewCert] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('modern-navy');
  const [activeTab, setActiveTab] = useState('sertifikat');

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
    setActivePage('dashboard');
  };

  return (
    <div className="content">
      {/* HEADER */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text1)', marginBottom: '6px' }}>Sertifikat & Riwayat Kuis</h2>
        <p style={{ color: 'var(--text3)', fontSize: '13px' }}>
          Pantau status sertifikat dan lihat riwayat kuis SOP yang sudah Anda kerjakan.
        </p>
      </div>

      {/* STATS */}
      <div className="stats-row" style={{ marginBottom: '20px' }}>
        <div className="stat-mini">
          <div className="stat-ic blue">🏆</div>
          <div>
            <div className="s-val">{certificates.length}</div>
            <div className="s-lbl">Sertifikat Aktif</div>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-ic amber">⏳</div>
          <div>
            <div className="s-val">{mySubmissions.filter(s => !s.certStatus || s.certStatus === 'pending').length}</div>
            <div className="s-lbl">Menunggu Verifikasi</div>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-ic green">🎯</div>
          <div>
            <div className="s-val">{passingScore}%</div>
            <div className="s-lbl">Standar Kelulusan</div>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-ic purple">📅</div>
          <div>
            <div className="s-val">{validityMonths === 999 ? '∞' : `${validityMonths} bln`}</div>
            <div className="s-lbl">Masa Berlaku</div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '2px solid var(--border)' }}>
        {[
          { key: 'sertifikat', label: `Sertifikat Saya (${certificates.length})` },
          { key: 'riwayat', label: `Riwayat Kuis (${mySubmissions.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 18px', fontSize: '13px', fontWeight: '600', border: 'none',
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
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
              <h4 style={{ fontWeight: '600', color: 'var(--text1)', marginBottom: '4px' }}>Belum Ada Sertifikat Aktif</h4>
              <p style={{ fontSize: '13px', lineHeight: '1.6' }}>
                Sertifikat akan terbit setelah HRD memverifikasi hasil kuis Anda.<br/>
                Selesaikan kuis SOP dan tunggu konfirmasi dari HRD.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 20px', fontWeight: '600', color: 'var(--text2)' }}>ID Sertifikat</th>
                    <th style={{ padding: '12px 20px', fontWeight: '600', color: 'var(--text2)' }}>Materi Video SOP</th>
                    <th style={{ padding: '12px 20px', fontWeight: '600', color: 'var(--text2)' }}>Skor</th>
                    <th style={{ padding: '12px 20px', fontWeight: '600', color: 'var(--text2)' }}>Diterbitkan Oleh</th>
                    <th style={{ padding: '12px 20px', fontWeight: '600', color: 'var(--text2)' }}>Tgl Terbit</th>
                    <th style={{ padding: '12px 20px', fontWeight: '600', color: 'var(--text2)' }}>Masa Berlaku</th>
                    <th style={{ padding: '12px 20px', fontWeight: '600', color: 'var(--text2)' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((cert) => (
                    <tr key={cert.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 20px', fontWeight: '500', color: 'var(--text3)' }}>{cert.id}</td>
                      <td style={{ padding: '12px 20px', fontWeight: '600', color: 'var(--text1)' }}>{cert.videoTitle}</td>
                      <td style={{ padding: '12px 20px', fontWeight: '700', color: '#16a34a' }}>{cert.score}%</td>
                      <td style={{ padding: '12px 20px', color: 'var(--text2)' }}>{cert.approvedBy}</td>
                      <td style={{ padding: '12px 20px', color: 'var(--text3)' }}>{cert.issueDate}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', background: '#ecfdf5', color: '#10b981' }}>
                          {cert.expiryDate}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <button
                          onClick={() => setPreviewCert(cert)}
                          className="btn-sec"
                          style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          👁 Lihat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: RIWAYAT KUIS */}
      {activeTab === 'riwayat' && (
        <div className="card">
          {mySubmissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
              <h4 style={{ fontWeight: '600', color: 'var(--text1)', marginBottom: '4px' }}>Belum Ada Riwayat</h4>
              <p style={{ fontSize: '13px' }}>Selesaikan kuis SOP untuk melihat riwayat di sini.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {mySubmissions.map(sub => {
                const s = certStatusLabel(sub);
                const isRemedial = sub.certStatus === 'remedial';
                const retakeCount = sub.retakeCount || 0;
                const canRetake = isRemedial && retakeCount < MAX_RETAKES;
                const maxReached = isRemedial && retakeCount >= MAX_RETAKES;
                return (
                  <div key={sub.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text1)', marginBottom: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {sub.videoTitle}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                            Pre-Test: <strong style={{ color: sub.preScore >= passingScore ? '#16a34a' : '#dc2626' }}>{sub.preScore ?? '—'}%</strong>
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                            Post-Test: <strong style={{ color: sub.postScore >= passingScore ? '#16a34a' : '#dc2626' }}>{sub.postScore ?? '—'}%</strong>
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{sub.date}</span>
                          {retakeCount > 0 && (
                            <span style={{ fontSize: '10px', fontWeight: '700', color: '#b45309', background: '#fff7ed', border: '1px solid #fed7aa', padding: '1px 7px', borderRadius: '10px' }}>
                              Percobaan ke-{retakeCount + 1} dari {MAX_RETAKES}
                            </span>
                          )}
                        </div>
                        {/* Remedial note from supervisor */}
                        {isRemedial && sub.supervisorNote && (
                          <div style={{ fontSize: '12px', color: '#b45309', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '6px', padding: '6px 10px', marginBottom: '8px', lineHeight: '1.5' }}>
                            💬 <strong>Catatan Supervisor:</strong> {sub.supervisorNote}
                          </div>
                        )}
                        {/* Rejected note from HRD */}
                        {sub.certStatus === 'rejected' && sub.rejectionNote && (
                          <div style={{ fontSize: '12px', color: '#b91c1c', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 10px', lineHeight: '1.5' }}>
                            ⛔ <strong>Alasan Penolakan:</strong> {sub.rejectionNote}
                          </div>
                        )}
                        {/* Max retake warning */}
                        {maxReached && (
                          <div style={{ fontSize: '12px', color: '#b91c1c', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 10px', lineHeight: '1.5' }}>
                            ⚠️ Batas maksimal {MAX_RETAKES}x percobaan telah tercapai. Hubungi HRD untuk tindak lanjut.
                          </div>
                        )}
                      </div>

                      {/* Right: badge + action buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                          {s.label}
                        </span>
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
                              padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
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
            background: '#ffffff', padding: '32px', borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: '750px',
            maxWidth: '95vw', position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            <button
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text3)' }}
              onClick={() => setPreviewCert(null)}
            >✕</button>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text2)' }}>Pilih Template:</span>
              <select className="form-select" style={{ width: '200px', fontSize: '12px', padding: '4px 8px' }}
                value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}>
                <option value="modern-navy">Elegant Navy (Corporate)</option>
                <option value="luxury-gold">Luxury Gold (Premium)</option>
                <option value="emerald-green">Emerald Compliance (Formal)</option>
              </select>
            </div>

            <div className="print-area" style={{
              border: `8px double ${selectedTemplate === 'modern-navy' ? '#0f172a' : selectedTemplate === 'luxury-gold' ? '#d97706' : '#047857'}`,
              padding: '30px', textAlign: 'center', background: '#fefefe',
              borderRadius: '8px', fontFamily: "'Plus Jakarta Sans', serif",
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '150px', height: '150px', borderRadius: '50%', background: selectedTemplate === 'modern-navy' ? '#eff6ff' : selectedTemplate === 'luxury-gold' ? '#fffbeb' : '#f0fdf4', opacity: 0.5, zIndex: 1 }} />
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: '20px' }}>
                🏢 PT Maju Bersama · Corporate LMS
              </div>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '26px', fontWeight: '700', color: selectedTemplate === 'modern-navy' ? '#0f172a' : selectedTemplate === 'luxury-gold' ? '#b45309' : '#065f46', margin: '0 0 10px 0', letterSpacing: '1px' }}>
                SERTIFIKAT KELULUSAN
              </h1>
              <div style={{ width: '60px', height: '2px', background: selectedTemplate === 'modern-navy' ? '#0f172a' : selectedTemplate === 'luxury-gold' ? '#d97706' : '#047857', margin: '0 auto 24px auto' }} />
              <p style={{ fontSize: '12px', color: 'var(--text3)', margin: '0 0 20px 0', fontStyle: 'italic' }}>
                Dengan ini secara resmi menyatakan dan menganugerahkan penghargaan kepada:
              </p>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text1)', margin: '10px 0', textDecoration: 'underline' }}>
                {previewCert.employeeName}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text3)', margin: '15px auto', maxWidth: '480px', lineHeight: '1.6' }}>
                Atas kelulusan luar biasa dan kompetensi penuh yang ditunjukkan dalam menyelesaikan pelatihan materi video standar perusahaan:
              </p>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--accent)', margin: '10px 0 30px 0' }}>
                {previewCert.videoTitle}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '40px', alignItems: 'end', position: 'relative', zIndex: 2 }}>
                <div style={{ textAlign: 'left', fontSize: '11px', color: 'var(--text2)', borderRight: '1px solid var(--border)', paddingRight: '20px' }}>
                  <div style={{ marginBottom: '4px' }}><strong>ID Sertifikat:</strong> {previewCert.id}</div>
                  <div style={{ marginBottom: '4px' }}><strong>Tanggal Terbit:</strong> {previewCert.issueDate}</div>
                  <div style={{ marginBottom: '4px' }}><strong>Masa Berlaku:</strong> {previewCert.expiryDate}</div>
                  <div><strong>Skor Kuis:</strong> <span style={{ color: 'var(--green)', fontWeight: '600' }}>{previewCert.score}%</span></div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'cursive', fontSize: '20px', color: '#1e3a8a', height: '35px', lineHeight: '35px' }}>
                    {previewCert.approvedBy}
                  </div>
                  <div style={{ width: '120px', height: '1px', background: 'var(--border)', margin: '4px auto' }} />
                  <div style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: '600', textTransform: 'uppercase' }}>
                    HR Manager, PT Maju Bersama
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn-sec" onClick={() => setPreviewCert(null)}>Tutup</button>
              <button className="btn-primary" style={{ background: '#002D72' }} onClick={() => window.print()}>
                🖨️ Cetak / Simpan PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
