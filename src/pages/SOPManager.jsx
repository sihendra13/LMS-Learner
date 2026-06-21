import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';

export const SOPManager = ({ onSelectVideo }) => {
  const { videos, quizSubmissions, currentUser, passingScore, MAX_RETAKES } = useTenant();
  const [selectedProgress, setSelectedProgress] = useState('all');
  const [detailVideo, setDetailVideo] = useState(null);

  const handleVideoClick = (video) => {
    const submission = quizSubmissions.find(s => s.videoTitle === video.title && s.employeeName === currentUser.name);
    const cs = submission?.certStatus;
    if (cs === 'pending' || cs === 'supervisor_ok' || cs === 'approved') return;
    if (cs === 'remedial' && submission?.supervisorNote) {
      setDetailVideo({ video, submission });
    } else {
      onSelectVideo(video);
    }
  };

  // Filter lists
  const filteredVideos = videos.filter(video => {
    const matchesDept = (video.dept === 'Semua' || video.dept.toLowerCase() === (currentUser.dept || '').toLowerCase()) && !video.archived;
    
    const submission = quizSubmissions.find(s => s.videoTitle === video.title && s.employeeName === currentUser.name);
    const isCompleted = video.progress === 100 && submission && submission.postScore >= passingScore;
    const isOngoing = video.progress > 0 && video.progress < 100;
    const isNew = video.progress === 0;

    let matchesProgress = true;
    if (selectedProgress === 'completed') matchesProgress = isCompleted;
    else if (selectedProgress === 'ongoing') matchesProgress = isOngoing;
    else if (selectedProgress === 'new') matchesProgress = isNew;

    return matchesDept && matchesProgress;
  });

  return (
    <div className="content">
      {/* HEADER */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text1)', marginBottom: '6px' }}>SOP Saya</h2>
          <p style={{ color: 'var(--text3)', fontSize: '13px' }}>
            Akses dan pelajari modul Standar Operasional Prosedur (SOP) perusahaan Anda.
          </p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ minWidth: '180px' }}>
          <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Progress</label>
          <select className="form-select" value={selectedProgress} onChange={e => setSelectedProgress(e.target.value)}>
            <option value="all">Semua Status</option>
            <option value="completed">Lulus / Selesai</option>
            <option value="ongoing">Dalam Proses</option>
            <option value="new">Belum Dimulai (Baru)</option>
          </select>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text3)', paddingBottom: '8px' }}>
          Menampilkan SOP untuk departemen: <strong style={{ color: 'var(--text1)' }}>{currentUser.dept || 'Semua'}</strong>
        </div>
      </div>

      {/* VIDEOS LIST */}
      <div className="card">
        {filteredVideos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📂</div>
            <h4 style={{ fontWeight: '600', color: 'var(--text1)', marginBottom: '4px' }}>Tidak Ada Modul SOP</h4>
            <p style={{ fontSize: '13px' }}>Tidak ditemukan video SOP yang cocok dengan filter Anda.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredVideos.map(video => {
              const submission = quizSubmissions.find(s => s.videoTitle === video.title && s.employeeName === currentUser.name);
              const cs = submission?.certStatus;
              const isBlocked = cs === 'pending' || cs === 'supervisor_ok' || cs === 'approved';
              const isCompleted = video.progress === 100 && submission && submission.postScore >= passingScore;
              const isOngoing = video.progress > 0 && video.progress < 100;

              const getStatusBadge = (sub) => {
                if (!sub) return null;
                if (sub.certStatus === 'approved')      return { label: 'Sertifikat Aktif',             color: '#15803d', bg: '#f0fdf4', border: '#86efac' };
                if (sub.certStatus === 'rejected')      return { label: 'Ditolak Final',                color: '#b91c1c', bg: '#fff5f5', border: '#fecaca' };
                if (sub.certStatus === 'remedial')      return { label: 'Perlu Remedial',               color: '#b45309', bg: '#fff7ed', border: '#fed7aa' };
                if (sub.certStatus === 'supervisor_ok') return { label: 'Direkomendasi — Menunggu HRD', color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' };
                return { label: 'Menunggu Review Supervisor', color: '#92400e', bg: '#fffbeb', border: '#fde68a' };
              };
              const statusBadge = getStatusBadge(submission);

              return (
                <div key={video.id} className="sop-item" onClick={() => handleVideoClick(video)} style={{ cursor: isBlocked ? 'default' : 'pointer' }}>
                  <div className="sop-thumb" style={{ background: video.color || 'var(--navy2)', width: '90px', height: '56px' }}>
                    {isCompleted ? (
                      <div className="sop-done-overlay">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '22px', height: '22px' }}><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    ) : (
                      <div className="play-ic">
                        <svg viewBox="0 0 24 24" fill="white" style={{ width: '12px', height: '12px' }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      </div>
                    )}
                  </div>
                  <div className="sop-info" style={{ marginLeft: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className={`dept-tag ${video.tagClass}`}>{video.dept}</span>
                      {video.type === 'ppt' ? (
                        <span style={{ fontSize: '11px', fontWeight: '700', background: '#ede9fe', color: '#7c3aed', padding: '2px 8px', borderRadius: '4px' }}>
                          📊 {video.slideCount || '?'} slide
                        </span>
                      ) : (
                        <span className="sop-dur">⏱ {video.duration}</span>
                      )}
                      {statusBadge && (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: statusBadge.color,
                          background: statusBadge.bg,
                          border: `1px solid ${statusBadge.border}`,
                          padding: '4px 10px',
                          borderRadius: '8px'
                        }}>
                          {statusBadge.label}
                        </span>
                      )}
                    </div>

                    {(() => {
                      if (!video.deadline || isCompleted) return null;
                      const today = new Date(); today.setHours(0,0,0,0);
                      const dl = new Date(video.deadline);
                      const diff = Math.ceil((dl - today) / (1000 * 60 * 60 * 24));
                      const dateStr = dl.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                      if (diff < 0) return (
                        <span style={{ fontSize: '11px', fontWeight: '700', background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                          Deadline terlewat · {dateStr}
                        </span>
                      );
                      if (diff <= 3) return (
                        <span style={{ fontSize: '11px', fontWeight: '700', background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                          </svg>
                          Deadline {diff === 0 ? 'hari ini' : `${diff} hari lagi`} · {dateStr}
                        </span>
                      );
                      return (
                        <span style={{ fontSize: '11px', fontWeight: '700', background: '#fff7ed', border: '1px solid #fed7aa', color: '#ea580c', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          Deadline {diff} hari lagi · {dateStr}
                        </span>
                      );
                    })()}

                    <div className="sop-title" style={{ fontSize: '14px', fontWeight: '600', marginTop: '6px', marginBottom: '6px' }}>{video.title}</div>
                    
                    <div className="sop-prog">
                      <div className="prog-bar">
                        <div 
                          className="prog-fill" 
                          style={{ 
                            width: `${video.progress}%`, 
                            background: isCompleted ? 'var(--green)' : isOngoing ? 'var(--accent)' : 'var(--text3)' 
                          }}
                        />
                      </div>
                      <div className="prog-pct">{video.progress}% menonton</div>
                    </div>
                  </div>
                  
                  <div style={{ marginLeft: '20px' }}>
                    {cs === 'approved' ? null : cs === 'pending' ? (
                      <button className="btn-sec" disabled style={{ fontSize: '12px', padding: '6px 14px', opacity: 0.5, cursor: 'not-allowed' }}>
                        Menunggu Supervisor
                      </button>
                    ) : cs === 'supervisor_ok' ? (
                      <button className="btn-sec" disabled style={{ fontSize: '12px', padding: '6px 14px', opacity: 0.5, cursor: 'not-allowed' }}>
                        Menunggu HRD
                      </button>
                    ) : (cs === 'remedial' || cs === 'rejected') ? (
                      <button className="btn-sec" style={{ fontSize: '12px', padding: '6px 14px', background: '#fff7ed', color: '#b45309', border: '1px solid #fed7aa' }}>
                        Mulai SOP Ulang
                      </button>
                    ) : (
                      <button className="btn-sec" style={{ fontSize: '12px', padding: '6px 14px' }}>
                        {isOngoing ? 'Lanjutkan' : 'Mulai SOP'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>

    {/* DETAIL MODAL — hanya muncul saat remedial + ada catatan supervisor */}
    {detailVideo && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ background: 'var(--card)', borderRadius: '16px', padding: '28px', maxWidth: '460px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text1)', margin: '0 0 6px' }}>{detailVideo.video.title}</h3>
              <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', background: '#fff7ed', color: '#b45309', border: '1px solid #fed7aa' }}>
                ⚠️ Perlu Remedial
              </span>
            </div>
            <button onClick={() => setDetailVideo(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text3)' }}>✕</button>
          </div>

          {/* Skor terakhir */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1, background: 'var(--bg2)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px' }}>Skor Pre-Test</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text1)' }}>{detailVideo.submission.preScore ?? '—'}%</div>
            </div>
            <div style={{ flex: 1, background: 'var(--bg2)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px' }}>Skor Post-Test</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#dc2626' }}>{detailVideo.submission.postScore ?? '—'}%</div>
            </div>
          </div>

          {/* Deadline */}
          {detailVideo.video.deadline && (() => {
            const today = new Date(); today.setHours(0,0,0,0);
            const dl = new Date(detailVideo.video.deadline);
            const diff = Math.ceil((dl - today) / (1000 * 60 * 60 * 24));
            const dateStr = dl.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            const color = diff < 0 ? '#dc2626' : diff <= 3 ? '#b45309' : '#ea580c';
            const bg = diff < 0 ? '#fef2f2' : diff <= 3 ? '#fff7ed' : '#fff7ed';
            return (
              <div style={{ fontSize: '12px', color, background: bg, borderRadius: '6px', padding: '8px 12px', marginBottom: '16px' }}>
                📅 {diff < 0 ? `Deadline terlewat · ${dateStr}` : diff === 0 ? `Deadline hari ini · ${dateStr}` : `Deadline ${diff} hari lagi · ${dateStr}`}
              </div>
            );
          })()}

          {/* Catatan supervisor */}
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '14px', marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#b45309', marginBottom: '6px' }}>💬 Catatan Supervisor:</div>
            <div style={{ fontSize: '13px', color: 'var(--text1)', lineHeight: '1.6' }}>{detailVideo.submission.supervisorNote}</div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setDetailVideo(null)} style={{ flex: 1, padding: '11px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text2)' }}>
              Batal
            </button>
            <button
              onClick={() => { setDetailVideo(null); onSelectVideo(detailVideo.video); }}
              style={{ flex: 2, padding: '11px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', background: 'var(--navy)', border: 'none', color: '#fff' }}
            >
              Mulai SOP Ulang
            </button>
          </div>
        </div>
      </div>
    )}
  );
};
