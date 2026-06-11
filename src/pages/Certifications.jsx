import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';

export const Certifications = () => {
  const { quizSubmissions, currentUser, passingScore, validityMonths } = useTenant();
  const [previewCert, setPreviewCert] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('modern-navy');

  // Filter only passed submissions for certificates list belonging to the current user
  const certificates = quizSubmissions.map((sub, idx) => {
    // Generate dates based on submission
    const issueDate = sub.date === 'Hari ini' ? '09 Jun 2026' : 
                      sub.date === '1 hari lalu' ? '08 Jun 2026' : 
                      sub.date === '2 hari lalu' ? '07 Jun 2026' : '05 Jun 2026';
    
    // Calculate expiry
    const expiryDate = validityMonths === 999 ? 'Selamanya' : `09 Jun ${2026 + Math.floor(validityMonths / 12)}`;

    return {
      id: `CERT-2026${100 + idx}`,
      employeeName: sub.employeeName,
      videoTitle: sub.videoTitle,
      score: sub.postScore,
      issueDate,
      expiryDate,
      status: sub.status === 'Lulus' || sub.postScore >= passingScore ? 'Aktif' : 'Kedaluwarsa'
    };
  }).filter(c => c.employeeName === currentUser.name && c.score >= passingScore);

  return (
    <div className="content">
      {/* HEADER */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text1)', marginBottom: '6px' }}>Sertifikat Saya</h2>
        <p style={{ color: 'var(--text3)', fontSize: '13px' }}>
          Unduh sertifikat kompetensi digital Anda yang terbit otomatis setelah lulus kuis video SOP.
        </p>
      </div>

      {/* STATS OVERVIEW */}
      <div className="stats-row">
        <div className="stat-mini">
          <div className="stat-ic blue">🏆</div>
          <div>
            <div className="s-val">{certificates.length}</div>
            <div className="s-lbl">Sertifikat Diperoleh</div>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-ic green">🎯</div>
          <div>
            <div className="s-val">{passingScore}%</div>
            <div className="s-lbl">Kriteria Kelulusan</div>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-ic purple">📅</div>
          <div>
            <div className="s-val">{validityMonths === 999 ? 'Selamanya' : `${validityMonths} bln`}</div>
            <div className="s-lbl">Masa Berlaku Sertifikat</div>
          </div>
        </div>
      </div>

      {/* CERTIFICATES LIST */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-head">
          <div className="card-title">Daftar Sertifikat Kompetensi</div>
        </div>

        {certificates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏆</div>
            <h4 style={{ fontWeight: '600', color: 'var(--text1)', marginBottom: '4px' }}>Belum Ada Sertifikat</h4>
            <p style={{ fontSize: '13px' }}>Selesaikan kuis SOP dengan skor minimal {passingScore}% untuk menerbitkan sertifikat.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 20px', fontWeight: '600', color: 'var(--text2)' }}>ID Sertifikat</th>
                  <th style={{ padding: '12px 20px', fontWeight: '600', color: 'var(--text2)' }}>Materi Video SOP</th>
                  <th style={{ padding: '12px 20px', fontWeight: '600', color: 'var(--text2)' }}>Skor Kuis</th>
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
                    <td style={{ padding: '12px 20px', fontWeight: '700', color: 'var(--green)' }}>{cert.score}%</td>
                    <td style={{ padding: '12px 20px', color: 'var(--text3)' }}>{cert.issueDate}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span className="dept-tag dt-sales" style={{ background: cert.expiryDate === 'Selamanya' ? '#ecfdf5' : '#fef2f2', color: cert.expiryDate === 'Selamanya' ? '#10b981' : '#ef4444' }}>
                        {cert.expiryDate}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <button
                        onClick={() => setPreviewCert(cert)}
                        className="btn-sec"
                        style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        👁 Lihat Sertifikat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CERTIFICATE PREVIEW MODAL */}
      {previewCert && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }} onClick={() => setPreviewCert(null)}>
          
          <div style={{
            background: '#ffffff',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            width: '750px',
            maxWidth: '95vw',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Close button */}
            <button 
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text3)' }}
              onClick={() => setPreviewCert(null)}
            >
              ✕
            </button>

            {/* Template Chooser */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text2)' }}>Pilih Template Sertifikat:</span>
              <select 
                className="form-select" 
                style={{ width: '200px', fontSize: '12px', padding: '4px 8px' }}
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                <option value="modern-navy">Elegant Navy (Corporate)</option>
                <option value="luxury-gold">Luxury Gold (Premium)</option>
                <option value="emerald-green">Emerald Compliance (Formal)</option>
              </select>
            </div>

            {/* Certificate Frame */}
            <div className="print-area" style={{
              border: `8px double ${selectedTemplate === 'modern-navy' ? '#0f172a' : selectedTemplate === 'luxury-gold' ? '#d97706' : '#047857'}`,
              padding: '30px',
              textAlign: 'center',
              background: '#fefefe',
              borderRadius: '8px',
              fontFamily: "'Plus Jakarta Sans', serif",
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Background badge decorations */}
              <div style={{
                position: 'absolute',
                bottom: '-20px',
                right: '-20px',
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                background: selectedTemplate === 'modern-navy' ? '#eff6ff' : selectedTemplate === 'luxury-gold' ? '#fffbeb' : '#f0fdf4',
                opacity: 0.5,
                zIndex: 1
              }} />

              {/* Logo Area */}
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: '20px' }}>
                🏢 PT Maju Bersama · Corporate LMS
              </div>

              {/* Title */}
              <h1 style={{ 
                fontFamily: "Georgia, serif", 
                fontSize: '26px', 
                fontWeight: '700', 
                color: selectedTemplate === 'modern-navy' ? '#0f172a' : selectedTemplate === 'luxury-gold' ? '#b45309' : '#065f46',
                margin: '0 0 10px 0',
                letterSpacing: '1px'
              }}>
                SERTIFIKAT KELULUSAN
              </h1>
              <div style={{ width: '60px', height: '2px', background: selectedTemplate === 'modern-navy' ? '#0f172a' : selectedTemplate === 'luxury-gold' ? '#d97706' : '#047857', margin: '0 auto 24px auto' }}></div>

              {/* Sub-info */}
              <p style={{ fontSize: '12px', color: 'var(--text3)', margin: '0 0 20px 0', fontStyle: 'italic' }}>
                Dengan ini secara resmi menyatakan dan menganugerahkan penghargaan kepada:
              </p>

              {/* Recipient Name */}
              <h2 style={{ 
                fontSize: '22px', 
                fontWeight: '700', 
                color: 'var(--text1)', 
                margin: '10px 0',
                textDecoration: 'underline'
              }}>
                {previewCert.employeeName}
              </h2>

              <p style={{ fontSize: '12px', color: 'var(--text3)', margin: '15px auto', maxWidth: '480px', lineHeight: '1.6' }}>
                Atas kelulusan luar biasa dan kompetensi penuh yang ditunjukkan dalam menyelesaikan pelatihan materi video standar perusahaan:
              </p>

              {/* Course Title */}
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--accent)', margin: '10px 0 30px 0' }}>
                {previewCert.videoTitle}
              </h3>

              {/* Footer details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '40px', alignItems: 'end', position: 'relative', zIndex: 2 }}>
                {/* Left: Date & Score */}
                <div style={{ textAlign: 'left', fontSize: '11px', color: 'var(--text2)', borderRight: '1px solid var(--border)', paddingRight: '20px' }}>
                  <div style={{ marginBottom: '4px' }}><strong>ID Sertifikat:</strong> {previewCert.id}</div>
                  <div style={{ marginBottom: '4px' }}><strong>Tanggal Terbit:</strong> {previewCert.issueDate}</div>
                  <div style={{ marginBottom: '4px' }}><strong>Masa Berlaku:</strong> {previewCert.expiryDate}</div>
                  <div><strong>Skor Kuis:</strong> <span style={{ color: 'var(--green)', fontWeight: '600' }}>{previewCert.score}%</span></div>
                </div>

                {/* Right: Signature */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "cursive", fontSize: '20px', color: '#1e3a8a', height: '35px', lineHeight: '35px' }}>
                    Andi Saputra
                  </div>
                  <div style={{ width: '120px', height: '1px', background: 'var(--border)', margin: '4px auto' }}></div>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: '600', textTransform: 'uppercase' }}>
                    HR Manager, PT Maju Bersama
                  </div>
                </div>
              </div>

            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn-sec" onClick={() => setPreviewCert(null)}>
                Tutup
              </button>
              <button 
                className="btn-primary" 
                style={{ background: '#002D72' }}
                onClick={() => window.print()}
              >
                🖨️ Cetak / Simpan PDF
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
