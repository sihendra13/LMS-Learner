import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';

export const SOPManager = ({ onSelectVideo }) => {
  const { videos, quizSubmissions, currentUser, passingScore, MAX_RETAKES } = useTenant();
  const [selectedProgress, setSelectedProgress] = useState('all');

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
              const isCompleted = video.progress === 100 && submission && submission.postScore >= passingScore;
              const isOngoing = video.progress > 0 && video.progress < 100;

              const getStatusBadge = (sub) => {
                if (!sub) return null;
                if (sub.certStatus === 'approved')      return { label: `Lulus ✓ (${sub.postScore}%)`,              color: '#15803d', bg: '#f0fdf4' };
                if (sub.certStatus === 'supervisor_ok') return { label: `Direkomendasi — Menunggu HRD (${sub.postScore}%)`, color: '#1d4ed8', bg: '#eff6ff' };
                if (sub.certStatus === 'remedial') {
                  const attempt = (sub.retakeCount || 0) + 2;
                  const remaining = MAX_RETAKES - (sub.retakeCount || 0);
                  return { label: `Perlu Mengulang — Percobaan ke-${attempt} dari ${MAX_RETAKES} (Sisa ${remaining}x)`, color: '#b45309', bg: '#fff7ed' };
                }
                if (sub.certStatus === 'rejected') return { label: `Ditolak Final (${sub.postScore}%)`, color: '#b91c1c', bg: '#fff5f5' };
                // pending: submitted or retaken, waiting for review
                if (sub.postScore >= passingScore) return { label: `Lulus — Menunggu Review (${sub.postScore}%)`, color: '#15803d', bg: '#e6f4ea' };
                if (sub.retakeCount > 0) return { label: `Menunggu Review — Percobaan ke-${sub.retakeCount + 1} dari ${MAX_RETAKES} (${sub.postScore}%)`, color: '#92400e', bg: '#fffbeb' };
                return { label: `Menunggu Review Supervisor (${sub.postScore}%)`, color: '#92400e', bg: '#fffbeb' };
              };
              const statusBadge = getStatusBadge(submission);

              return (
                <div key={video.id} className="sop-item" onClick={() => onSelectVideo(video)}>
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
                          fontWeight: 'bold',
                          color: statusBadge.color,
                          background: statusBadge.bg,
                          padding: '1px 8px',
                          borderRadius: '4px'
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
                        <span style={{ fontSize: '11px', fontWeight: '700', background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                          Deadline terlewat · {dateStr}
                        </span>
                      );
                      if (diff <= 3) return (
                        <span style={{ fontSize: '11px', fontWeight: '700', background: '#fffbeb', border: '1px solid #fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                          </svg>
                          Deadline {diff === 0 ? 'hari ini' : `${diff} hari lagi`} · {dateStr}
                        </span>
                      );
                      return (
                        <span style={{ fontSize: '11px', fontWeight: '700', background: '#fffaf8', border: '1px solid #ffedd5', color: '#ea580c', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
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
                    <button 
                      className="btn-sec"
                      style={{ fontSize: '12px', padding: '6px 14px' }}
                    >
                      {isCompleted ? 'Pelajari Ulang' : isOngoing ? 'Lanjutkan' : 'Mulai SOP'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
