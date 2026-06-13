import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';

export const SOPManager = ({ onSelectVideo }) => {
  const { videos, quizSubmissions, currentUser, passingScore } = useTenant();
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`dept-tag ${video.tagClass}`}>{video.dept}</span>
                      <span className="sop-dur">⏱ {video.duration}</span>
                      {submission && (
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: 'bold', 
                          color: submission.postScore >= passingScore ? 'var(--green)' : 'var(--red)',
                          background: submission.postScore >= passingScore ? '#e6f4ea' : '#fce8e6',
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}>
                          Nilai: {submission.postScore}% ({submission.status})
                        </span>
                      )}
                    </div>
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
