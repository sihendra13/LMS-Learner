import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';

export const SOPManager = ({ onSelectVideo }) => {
  const { videos, quizSubmissions, currentUser, passingScore, MAX_RETAKES, enableSpvRole } = useTenant();
  const [selectedProgress, setSelectedProgress] = useState('all');
  const [detailVideo, setDetailVideo] = useState(null);

  const handleVideoClick = (video) => {
    const submission = quizSubmissions.find(s => s.videoTitle === video.title && s.employeeName === currentUser.name);
    const cs = submission?.certStatus;
    const isLegacyRemedial = !enableSpvRole && cs === 'pending' && submission?.postScore != null && submission?.postScore < passingScore;

    if (cs === 'pending' && !isLegacyRemedial) {
      if ((submission?.retakeCount || 0) >= MAX_RETAKES) setDetailVideo({ video, submission });
      return;
    }
    if (cs === 'supervisor_ok') {
      if (submission?.supervisorNote) setDetailVideo({ video, submission });
      return;
    }
    if (cs === 'approved') {
      if (submission?.approvalNote || submission?.supervisorNote) setDetailVideo({ video, submission });
      return;
    }
    if (cs === 'rejected') {
      setDetailVideo({ video, submission });
      return;
    }
    if (cs === 'remedial' && submission?.supervisorNote) {
      setDetailVideo({ video, submission });
      return;
    }
    onSelectVideo(video);
  };

  // Filter lists
  const filteredVideos = videos.filter(video => {
    const matchesDept = (video.dept === 'Semua' || video.dept.toLowerCase() === (currentUser.dept || '').toLowerCase()) && !video.archived;
    
    const submission = quizSubmissions.find(s => s.videoTitle === video.title && s.employeeName === currentUser.name);
    const isCompleted = submission?.certStatus === 'approved' || (video.progress === 100 && submission && submission.postScore >= passingScore);
    const isOngoing = video.progress > 0 && video.progress < 100;
    const isNew = video.progress === 0;

    let matchesProgress = true;
    if (selectedProgress === 'completed') matchesProgress = isCompleted;
    else if (selectedProgress === 'ongoing') matchesProgress = isOngoing;
    else if (selectedProgress === 'new') matchesProgress = isNew;

    return matchesDept && matchesProgress;
  });

  return (
    <>
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
              const hasNote = (cs === 'supervisor_ok' && submission?.supervisorNote) || (cs === 'approved' && (submission?.approvalNote || submission?.supervisorNote));
              const isLegacyRemedial = !enableSpvRole && cs === 'pending' && submission?.postScore != null && submission?.postScore < passingScore;
              const isPendingMaxed = cs === 'pending' && (submission?.retakeCount || 0) >= MAX_RETAKES;
              const isBlocked = (cs === 'pending' && !isPendingMaxed && !isLegacyRemedial) || (!hasNote && (cs === 'supervisor_ok' || cs === 'approved'));
              const isCompleted = cs === 'approved' || (video.progress === 100 && submission && submission.postScore >= passingScore);
              const isOngoing = !isCompleted && video.progress > 0 && video.progress < 100;
              const displayProgress =
                (cs === 'approved' || (cs === 'pending' && !isLegacyRemedial) || cs === 'supervisor_ok') ? 100
                : (cs === 'remedial' || cs === 'rejected' || isLegacyRemedial) ? 0
                : video.progress;

              const getStatusBadge = (sub) => {
                if (sub) {
                  if (sub.certStatus === 'approved') return {
                    label: 'Sertifikat Aktif',
                    color: '#15803d',
                    bg: '#f0fdf4',
                    border: '#86efac',
                    icon: (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginRight: '4px' }}>
                        <circle cx="12" cy="8" r="7" />
                        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                      </svg>
                    )
                  };
                  if (sub.certStatus === 'rejected')      return { label: 'Ditolak Final',                color: '#b91c1c', bg: '#fff5f5', border: '#fecaca' };
                  if (sub.certStatus === 'remedial' || isLegacyRemedial) return (sub.retakeCount || 0) >= MAX_RETAKES
                    ? { label: 'Tidak Lulus', color: '#b91c1c', bg: '#fff5f5', border: '#fecaca' }
                    : { label: 'Perlu Remedial', color: '#b45309', bg: '#fff7ed', border: '#fed7aa' };
                  if (sub.certStatus === 'supervisor_ok') return { label: enableSpvRole ? 'Direkomendasi — Menunggu HRD' : 'Menunggu HRD', color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' };
                  if ((sub.retakeCount || 0) >= MAX_RETAKES) return { label: 'Tidak Lulus', color: '#b91c1c', bg: '#fff5f5', border: '#fecaca' };
                  return { label: enableSpvRole ? 'Menunggu Review Supervisor' : 'Menunggu Review HRD', color: '#b45309', bg: '#fffbeb', border: '#fde68a' };
                }
                if (isCompleted) return {
                  label: 'Lulus',
                  color: '#15803d',
                  bg: '#f0fdf4',
                  border: '#86efac',
                  icon: (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginRight: '4px' }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )
                };
                if (isOngoing)   return { label: 'Lanjutkan', color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' };
                return { label: 'Baru', color: '#b45309', bg: '#fffbeb', border: '#fde68a' };
              };
              const statusBadge = getStatusBadge(submission);

              return (
                <div key={video.id} className="sop-item" style={{ cursor: 'default', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%' }}>
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
                    <div className="sop-info" style={{ flex: 1, minWidth: 0, marginLeft: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className={`dept-tag ${video.dept === 'Semua' || video.dept === 'Umum' ? 'dt-semua' : video.tagClass || 'dt-sales'}`}>{video.dept}</span>
                        {video.type === 'ppt' ? (
                          <span style={{ fontSize: '11px', fontWeight: '700', background: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb', padding: '2px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6b7280', flexShrink: 0 }}>
                              <line x1="18" y1="20" x2="18" y2="10" />
                              <line x1="12" y1="20" x2="12" y2="4" />
                              <line x1="6" y1="20" x2="6" y2="14" />
                            </svg>
                            {video.slideCount || '?'} slide
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: '700', background: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb', padding: '2px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6b7280', flexShrink: 0 }}>
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {video.duration}
                          </span>
                        )}
                        {submission && (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            background: submission.postScore >= passingScore ? '#ecfdf5' : '#fef2f2',
                            color: submission.postScore >= passingScore ? '#15803d' : '#dc2626',
                            border: `1px solid ${submission.postScore >= passingScore ? '#a7f3d0' : '#fca5a5'}`,
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}>
                            Skor: {submission.postScore}%
                          </span>
                        )}
                        {statusBadge && (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            color: statusBadge.color,
                            background: statusBadge.bg,
                            border: `1px solid ${statusBadge.border}`,
                            padding: '3px 10px',
                            borderRadius: '99px',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {statusBadge.icon}
                            {statusBadge.label}
                          </span>
                        )}
                      </div>

                      {(() => {
                        const note = (cs === 'approved' && (submission?.approvalNote || submission?.supervisorNote)) || (cs === 'supervisor_ok' && submission?.supervisorNote) || (cs === 'rejected' && submission?.rejectionNote) || (cs === 'remedial' && submission?.supervisorNote);
                        if (!note) return null;
                        return (
                          <span
                            onClick={(e) => { e.stopPropagation(); setDetailVideo({ video, submission }); }}
                            style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              color: '#2563eb',
                              background: 'rgba(59, 130, 246, 0.08)',
                              border: '1px solid rgba(59, 130, 246, 0.2)',
                              padding: '3px 10px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginTop: '6px',
                              cursor: 'pointer'
                            }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            Ada catatan — klik untuk lihat
                          </span>
                        );
                      })()}

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
                    </div>
                    
                    <div style={{ marginLeft: '20px', flexShrink: 0 }}>
                      {cs === 'approved' ? (
                        <span style={{ fontSize: '12px', fontWeight: '600', padding: '6px 14px', borderRadius: '8px', background: '#ecfdf5', color: '#15803d', border: '1px solid #d1fae5', display: 'inline-block', whiteSpace: 'nowrap' }}>
                          Selesai
                        </span>
                      ) : cs === 'pending' && !isLegacyRemedial ? (
                        (submission?.retakeCount || 0) >= MAX_RETAKES ? (
                          <span onClick={(e) => { e.stopPropagation(); setDetailVideo({ video, submission }); }} style={{ fontSize: '11px', fontWeight: '600', padding: '6px 10px', borderRadius: '8px', background: '#fff5f5', color: '#b91c1c', border: '1px solid #fecaca', display: 'inline-block', lineHeight: '1.4', textAlign: 'center', cursor: 'pointer' }}>
                            Hubungi HRD/Supervisor
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', fontWeight: '600', padding: '6px 14px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', display: 'inline-block', whiteSpace: 'nowrap' }}>
                            {enableSpvRole ? 'Menunggu Supervisor' : 'Menunggu HRD'}
                          </span>
                        )
                      ) : cs === 'supervisor_ok' ? (
                        <span style={{ fontSize: '12px', fontWeight: '600', padding: '6px 14px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', display: 'inline-block', whiteSpace: 'nowrap' }}>
                          Menunggu HRD
                        </span>
                      ) : (cs === 'remedial' || cs === 'rejected' || isLegacyRemedial) ? (
                        (submission?.retakeCount || 0) >= MAX_RETAKES ? (
                          <span onClick={(e) => { e.stopPropagation(); setDetailVideo({ video, submission }); }} style={{ fontSize: '11px', fontWeight: '600', padding: '6px 10px', borderRadius: '8px', background: '#fff5f5', color: '#b91c1c', border: '1px solid #fecaca', display: 'inline-block', lineHeight: '1.4', textAlign: 'center', cursor: 'pointer' }}>
                            Hubungi HRD/Supervisor
                          </span>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); onSelectVideo(video); }} className="btn-sec" style={{ fontSize: '12px', padding: '6px 14px', background: '#fff7ed', color: '#b45309', border: '1px solid #fed7aa', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                            Mulai SOP Ulang
                          </button>
                        )
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); onSelectVideo(video); }} className="btn-sec" style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                          {isOngoing ? 'Lanjutkan' : 'Mulai SOP'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="sop-prog" style={{ marginLeft: '118px' }}>
                    <div className="prog-bar">
                      <div
                        className="prog-fill"
                        style={{
                          width: `${displayProgress}%`,
                          background: isCompleted ? 'var(--green)' : isOngoing ? 'var(--accent)' : 'var(--text3)'
                        }}
                      />
                    </div>
                    <div className="prog-pct">{displayProgress}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>

    {/* DETAIL MODAL — catatan dari supervisor/HRD */}
    {detailVideo && (() => {
      const cs = detailVideo.submission?.certStatus;
      const cfg = cs === 'approved'
        ? { 
            badge: 'Sertifikat Aktif', 
            badgeBg: '#f0fdf4', 
            badgeColor: '#15803d', 
            badgeBorder: '#86efac', 
            badgeIcon: (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', flexShrink: 0 }}>
                <circle cx="12" cy="8" r="7" />
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
              </svg>
            ),
            noteLabel: detailVideo.submission.supervisorNote ? "Catatan Supervisor" : "Pesan dari HRD",
            noteBg: "#f8fafc",
            noteBorder: "#e2e8f0",
            noteColor: "#475569",
            note: detailVideo.submission.supervisorNote || detailVideo.submission.approvalNote,
            secondNoteLabel: (detailVideo.submission.supervisorNote && detailVideo.submission.approvalNote) ? "Pesan dari HRD" : null,
            secondNote: (detailVideo.submission.supervisorNote && detailVideo.submission.approvalNote) ? detailVideo.submission.approvalNote : null,
            canRetake: false
          }
        : cs === 'supervisor_ok'
        ? { 
            badge: 'Catatan dari Supervisor', 
            badgeBg: '#eff6ff', 
            badgeColor: '#1d4ed8', 
            badgeBorder: '#93c5fd', 
            badgeIcon: (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', flexShrink: 0 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            ),
            noteLabel: 'Catatan Supervisor', 
            noteBg: '#f8fafc', 
            noteBorder: '#e2e8f0', 
            noteColor: '#475569', 
            note: detailVideo.submission.supervisorNote, 
            canRetake: false 
          }
        : cs === 'rejected'
        ? { 
            badge: 'Ditolak Final', 
            badgeBg: '#fef2f2', 
            badgeColor: '#b91c1c', 
            badgeBorder: '#fecaca', 
            badgeIcon: (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            ),
            noteLabel: 'Catatan HRD', 
            noteBg: '#f8fafc', 
            noteBorder: '#e2e8f0', 
            noteColor: '#475569', 
            note: detailVideo.submission.rejectionNote, 
            canRetake: true 
          }
        : (detailVideo.submission.retakeCount || 0) >= MAX_RETAKES
        ? {
            badge: 'Tidak Lulus',
            badgeBg: '#fff5f5',
            badgeColor: '#b91c1c',
            badgeBorder: '#fecaca',
            badgeIcon: null,
            noteLabel: 'Informasi',
            noteBg: '#fff5f5',
            noteBorder: '#fecaca',
            noteColor: '#b91c1c',
            note: `Anda telah mencapai batas maksimal ${MAX_RETAKES}x remedial. Silakan hubungi HRD/Supervisor Anda untuk tindak lanjut.`,
            canRetake: false
          }
        : {
            badge: 'Perlu Remedial',
            badgeBg: '#fff7ed',
            badgeColor: '#b45309',
            badgeBorder: '#fed7aa',
            badgeIcon: (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', flexShrink: 0 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            ),
            noteLabel: 'Catatan Supervisor',
            noteBg: '#f8fafc',
            noteBorder: '#e2e8f0',
            noteColor: '#475569',
            note: detailVideo.submission.supervisorNote,
            canRetake: true
          };

      return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', webkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '28px', maxWidth: '460px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text1)', margin: 0 }}>{detailVideo.video.title}</h3>
                <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', background: cfg.badgeBg, color: cfg.badgeColor, border: `1px solid ${cfg.badgeBorder}`, display: 'inline-flex', alignItems: 'center' }}>
                  {cfg.badgeIcon}
                  {cfg.badge}
                </span>
              </div>
              <button onClick={() => setDetailVideo(null)} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9ca3af', padding: '4px', borderRadius: '50%', transition: 'background 0.2s' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div style={{ height: '1px', background: '#e2e8f0', margin: '0 0 16px 0' }} />

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ flex: 1, padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px' }}>Skor Pre-Test</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: (detailVideo.submission.preScore ?? 0) >= passingScore ? '#16a34a' : '#dc2626' }}>{detailVideo.submission.preScore ?? '—'}%</div>
              </div>
              <div style={{ width: '1px', height: '40px', background: '#e2e8f0' }} />
              <div style={{ flex: 1, padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px' }}>Skor Post-Test</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: (detailVideo.submission.postScore ?? 0) >= passingScore ? '#16a34a' : '#dc2626' }}>{detailVideo.submission.postScore ?? '—'}%</div>
              </div>
            </div>

            {detailVideo.video.deadline && cs !== 'approved' && (() => {
              const today = new Date(); today.setHours(0,0,0,0);
              const dl = new Date(detailVideo.video.deadline);
              const diff = Math.ceil((dl - today) / (1000 * 60 * 60 * 24));
              const dateStr = dl.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
              const color = diff < 0 ? '#dc2626' : '#b45309';
              const bg = diff < 0 ? '#fef2f2' : '#fff7ed';
              return (
                <div style={{ fontSize: '12px', color, background: bg, borderRadius: '6px', padding: '8px 12px', marginBottom: '16px' }}>
                  📅 {diff < 0 ? `Deadline terlewat · ${dateStr}` : diff === 0 ? `Deadline hari ini · ${dateStr}` : `Deadline ${diff} hari lagi · ${dateStr}`}
                </div>
              );
            })()}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{ border: `1px solid ${cfg.noteBorder}`, borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderBottom: `1px solid ${cfg.noteBorder}`, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: cfg.noteColor }}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: cfg.noteColor }}>{cfg.noteLabel}</span>
                </div>
                <div style={{ background: '#ffffff', padding: '14px', fontSize: '13px', color: 'var(--text1)', lineHeight: '1.6', fontWeight: '500' }}>
                  {cfg.note}
                </div>
              </div>
              {cfg.secondNote && (
                <div style={{ border: '1px solid #86efac', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ background: '#f0fdf4', padding: '10px 14px', borderBottom: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: '#15803d' }}>
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#15803d' }}>{cfg.secondNoteLabel}</span>
                  </div>
                  <div style={{ background: '#ffffff', padding: '14px', fontSize: '13px', color: 'var(--text1)', lineHeight: '1.6', fontWeight: '500' }}>
                    {cfg.secondNote}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setDetailVideo(null)} 
                style={{ 
                  flex: 1, 
                  padding: '11px', 
                  borderRadius: '8px', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  cursor: 'pointer', 
                  background: cfg.canRetake ? '#ffffff' : '#0f172a', 
                  border: cfg.canRetake ? '1px solid #d1d5db' : 'none', 
                  color: cfg.canRetake ? '#374151' : '#ffffff',
                  transition: 'all 0.15s'
                }}
              >
                {cfg.canRetake ? 'Batal' : 'Tutup'}
              </button>
              {cfg.canRetake && (
                <button
                  onClick={() => { setDetailVideo(null); onSelectVideo(detailVideo.video); }}
                  style={{ flex: 2, padding: '11px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', background: '#0f172a', border: 'none', color: '#fff' }}
                >
                  Mulai SOP Ulang
                </button>
              )}
            </div>
          </div>
        </div>
      );
    })()}
    </>
  );
};
