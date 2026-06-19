import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';

const MobileSOPSaya = ({ onSelectVideo }) => {
  const { videos, quizSubmissions, currentUser, passingScore, MAX_RETAKES } = useTenant();
  const [selectedProgress, setSelectedProgress] = useState('all');
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

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
    <div style={{ padding: '16px 16px 30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* HEADER */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text1)', marginBottom: '4px' }}>SOP Saya</h2>
        <p style={{ color: 'var(--text3)', fontSize: '12px' }}>
          Akses dan pelajari modul Standar Operasional Prosedur (SOP) perusahaan Anda.
        </p>
      </div>

      {/* FILTER BAR */}
      <div className="card" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Status Progress</label>
          <div 
            onClick={() => setBottomSheetOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'var(--text1)',
              cursor: 'pointer',
              userSelect: 'none',
              height: '38px',
              boxSizing: 'border-box'
            }}
          >
            <span>
              {selectedProgress === 'all' && 'Semua Status'}
              {selectedProgress === 'completed' && 'Lulus / Selesai'}
              {selectedProgress === 'ongoing' && 'Dalam Proses'}
              {selectedProgress === 'new' && 'Belum Dimulai (Baru)'}
            </span>
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              style={{ width: '14px', height: '14px', color: 'var(--text3)' }}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
          Departemen Anda: <strong style={{ color: 'var(--text1)' }}>{currentUser.dept || 'Semua'}</strong>
        </div>
      </div>

      {/* VIDEOS LIST */}
      <div className="card">
        {filteredVideos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text3)' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📂</div>
            <h4 style={{ fontWeight: '600', color: 'var(--text1)', marginBottom: '4px', fontSize: '13px' }}>Tidak Ada Modul SOP</h4>
            <p style={{ fontSize: '11px' }}>Tidak ditemukan video SOP yang cocok dengan filter Anda.</p>
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
                  return { label: `Perlu Mengulang — Percobaan ke-${attempt} (Sisa ${remaining}x)`, color: '#b45309', bg: '#fff7ed' };
                }
                if (sub.certStatus === 'rejected') return { label: `Ditolak Final (${sub.postScore}%)`, color: '#b91c1c', bg: '#fff5f5' };
                if (sub.postScore >= passingScore) return { label: `Lulus — Menunggu Review (${sub.postScore}%)`, color: '#15803d', bg: '#e6f4ea' };
                if (sub.retakeCount > 0) return { label: `Menunggu Review — Percobaan ke-${sub.retakeCount + 1} (${sub.postScore}%)`, color: '#92400e', bg: '#fffbeb' };
                return { label: `Menunggu Review Supervisor (${sub.postScore}%)`, color: '#92400e', bg: '#fffbeb' };
              };
              const statusBadge = getStatusBadge(submission);

              return (
                <div key={video.id} className="sop-item" style={{ padding: '12px 16px', gap: '10px', flexDirection: 'column', alignItems: 'stretch' }} onClick={() => onSelectVideo(video)}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div className="sop-thumb" style={{ background: video.color || 'var(--navy2)', width: '64px', height: '40px', borderRadius: '6px', flexShrink: 0 }}>
                      {isCompleted ? (
                        <div className="sop-done-overlay" style={{ background: 'rgba(16,185,129,0.7)' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px' }}><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      ) : (
                        <div className="play-ic" style={{ width: '22px', height: '22px' }}>
                          <svg viewBox="0 0 24 24" fill="white" style={{ width: '8px', height: '8px' }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                        <span className={`dept-tag ${video.tagClass}`} style={{ fontSize: '8px', padding: '1px 5px' }}>{video.dept}</span>
                        {video.type === 'ppt' ? (
                          <span style={{ fontSize: '9px', fontWeight: '700', background: '#ede9fe', color: '#7c3aed', padding: '1px 5px', borderRadius: '4px' }}>
                            📊 {video.slideCount || '?'} slide
                          </span>
                        ) : (
                          <span className="sop-dur" style={{ fontSize: '10px' }}>⏱ {video.duration}</span>
                        )}
                      </div>
                      <div className="sop-title" style={{ fontSize: '13px', fontWeight: '600', marginTop: '4px', marginBottom: '2px', whiteSpace: 'normal', textOverflow: 'unset', overflow: 'visible' }}>{video.title}</div>
                    </div>
                  </div>

                  {statusBadge && (
                    <div style={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: statusBadge.color,
                      background: statusBadge.bg,
                      padding: '4px 8px',
                      borderRadius: '4px',
                      marginTop: '4px',
                      textAlign: 'center'
                    }}>
                      {statusBadge.label}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', gap: '10px' }}>
                    <div className="sop-prog" style={{ flex: 1 }}>
                      <div className="prog-bar">
                        <div 
                          className="prog-fill" 
                          style={{ 
                            width: `${video.progress}%`, 
                            background: isCompleted ? 'var(--green)' : isOngoing ? 'var(--accent)' : 'var(--text3)' 
                          }}
                        />
                      </div>
                      <div className="prog-pct" style={{ fontSize: '10px', minWidth: '22px' }}>{video.progress}%</div>
                    </div>
                    
                    <button 
                      className="btn-sec"
                      style={{ fontSize: '11px', padding: '4px 10px', flexShrink: 0 }}
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

      {/* BOTTOM SHEET FOR PROGRESS FILTER */}
      <div 
        className={`bottom-sheet-backdrop ${bottomSheetOpen ? 'open' : ''}`}
        onClick={() => setBottomSheetOpen(false)}
      />
      <div className={`bottom-sheet-container ${bottomSheetOpen ? 'open' : ''}`}>
        <div className="bottom-sheet-handle" />
        <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text1)', marginBottom: '16px', textAlign: 'center' }}>
          Pilih Status Progress
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { value: 'all', label: 'Semua Status' },
            { value: 'completed', label: 'Lulus / Selesai' },
            { value: 'ongoing', label: 'Dalam Proses' },
            { value: 'new', label: 'Belum Dimulai (Baru)' }
          ].map(opt => (
            <button
              key={opt.value}
              className={`bottom-sheet-option ${selectedProgress === opt.value ? 'active' : ''}`}
              onClick={() => {
                setSelectedProgress(opt.value);
                setBottomSheetOpen(false);
              }}
            >
              <span>{opt.label}</span>
              {selectedProgress === opt.value && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: '16px', height: '16px' }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileSOPSaya;
