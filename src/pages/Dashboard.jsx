import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';

export const Dashboard = ({ onSelectVideo }) => {
  const { currentUser, videos, quizSubmissions, activities, passingScore } = useTenant();
  const [detailVideo, setDetailVideo] = useState(null);

  const handleVideoClick = (video) => {
    const submission = quizSubmissions.find(s => s.videoTitle === video.title && s.employeeName === currentUser.name);
    const cs = submission?.certStatus;
    if (cs === 'pending') return;
    if (cs === 'supervisor_ok') {
      if (submission?.supervisorNote) setDetailVideo({ video, submission });
      return;
    }
    if (cs === 'approved') {
      if (submission?.approvalNote || submission?.supervisorNote) setDetailVideo({ video, submission });
      return;
    }
    if (cs === 'rejected') {
      if (submission?.rejectionNote) setDetailVideo({ video, submission });
      else onSelectVideo(video);
      return;
    }
    if (cs === 'remedial' && submission?.supervisorNote) {
      setDetailVideo({ video, submission });
      return;
    }
    onSelectVideo(video);
  };

  // Filter videos for Sales (the current employee dept)
  const mandatoryVideos = videos.filter(v => (v.dept === currentUser.dept || v.dept === 'Semua') && !v.archived);
  
  // Calculations
  const totalMandatory = mandatoryVideos.length;
  const completedMandatory = mandatoryVideos.filter(v => {
    const sub = quizSubmissions.find(s => s.videoTitle === v.title && s.employeeName === currentUser.name);
    return sub?.certStatus === 'approved' || (v.progress === 100 && sub && sub.postScore >= passingScore);
  }).length;

  const ongoingMandatory = mandatoryVideos.filter(v => {
    const sub = quizSubmissions.find(s => s.videoTitle === v.title && s.employeeName === currentUser.name);
    const done = sub?.certStatus === 'approved' || (v.progress === 100 && sub && sub.postScore >= passingScore);
    return !done && v.progress > 0 && v.progress < 100;
  }).length;
  const newMandatory = mandatoryVideos.filter(v => {
    const sub = quizSubmissions.find(s => s.videoTitle === v.title && s.employeeName === currentUser.name);
    const done = sub?.certStatus === 'approved' || (v.progress === 100 && sub && sub.postScore >= passingScore);
    return !done && v.progress === 0;
  }).length;

  const completionPercent = totalMandatory > 0 ? Math.round((completedMandatory / totalMandatory) * 100) : 0;
  
  // Calculate dashboard stats
  const totalCertificates = quizSubmissions.filter(s => s.employeeName === currentUser.name && s.postScore >= passingScore).length;

  // Average score of passed quizzes
  const passedSubmissions = quizSubmissions.filter(s => s.employeeName === currentUser.name && s.postScore >= passingScore);
  const averageScore = passedSubmissions.length > 0 
    ? Math.round(passedSubmissions.reduce((sum, s) => sum + s.postScore, 0) / passedSubmissions.length) 
    : 0;

  // SVG ring calculations
  // stroke-dasharray is 220. The stroke-dashoffset is: 220 - (220 * completionPercent) / 100
  const ringOffset = 220 - (220 * completionPercent) / 100;

  // Activities related to current user
  const recentActivities = activities.slice(0, 5);

  return (
    <>
    <div className="content">
      {/* HERO SECTION */}
      <div className="hero-bar">
        <div className="hero-ring">
          <svg className="ring-svg" viewBox="0 0 90 90">
            <circle className="ring-bg" cx="45" cy="45" r="35"/>
            <circle className="ring-fill" cx="45" cy="45" r="35" style={{ strokeDashoffset: ringOffset }}/>
          </svg>
          <div className="ring-label">
            <div className="ring-pct">{completionPercent}%</div>
            <div className="ring-sub">selesai</div>
          </div>
        </div>
        <div className="hero-info">
          <div className="hero-title">Progress Pelatihan Departemen {currentUser.dept}</div>
          <div className="hero-sub">
            Anda telah menyelesaikan {completedMandatory} dari {totalMandatory} SOP Wajib untuk divisi Anda. Terus tingkatkan kompetensi!
          </div>
          <div className="hero-pills">
            <div className="h-pill">
              🎬 <strong>{completedMandatory}</strong> ditonton
            </div>
            <div className="h-pill">
              🏆 <strong>{totalCertificates}</strong> sertifikat
            </div>
            <div className="h-pill">
              ⭐ <strong>{averageScore}%</strong> avg. skor
            </div>
            <div className="h-pill">
              🔥 <strong>{currentUser.streak} hari</strong> streak belajar
            </div>
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-mini">
          <div className="stat-ic blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <div>
            <div className="s-val">{totalMandatory}</div>
            <div className="s-lbl">SOP wajib divisi</div>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-ic green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <div className="s-val">{completedMandatory}</div>
            <div className="s-lbl">Sudah lulus kuis</div>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-ic amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 2h14"/>
              <path d="M5 22h14"/>
              <path d="M19 2v4c0 3-2 5-5 7 3 2 5 4 5 7v4"/>
              <path d="M5 2v4c0 3 2 5 5 7-3 2-5 4-5 7v4"/>
            </svg>
          </div>
          <div>
            <div className="s-val" style={{ color: 'var(--amber)' }}>{ongoingMandatory + newMandatory}</div>
            <div className="s-lbl">Tersisa / Belum Selesai</div>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-ic purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/>
              <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"/>
              <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z"/>
            </svg>
          </div>
          <div>
            <div className="s-val">{totalCertificates}</div>
            <div className="s-lbl">Sertifikat aktif</div>
          </div>
        </div>
      </div>

      {/* MAIN DASHBOARD GRID */}
      <div className="grid2">
        
        {/* LEFT COLUMN: SOP WAJIB */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">SOP Wajib Saya ({currentUser.dept})</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {mandatoryVideos.map(video => {
              const submission = quizSubmissions.find(s => s.videoTitle === video.title && s.employeeName === currentUser.name);
              const cs = submission?.certStatus;
              const hasNote = (cs === 'supervisor_ok' && submission?.supervisorNote) || (cs === 'approved' && (submission?.approvalNote || submission?.supervisorNote));
              const isBlocked = cs === 'pending' || (!hasNote && (cs === 'supervisor_ok' || cs === 'approved'));
              const isCompleted = cs === 'approved' || (video.progress === 100 && submission && submission.postScore >= passingScore);
              const isOngoing = !isCompleted && video.progress > 0 && video.progress < 100;
              const isNew = !isCompleted && video.progress === 0;
              const displayProgress =
                (cs === 'approved' || cs === 'pending' || cs === 'supervisor_ok') ? 100
                : (cs === 'remedial' || cs === 'rejected') ? 0
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
                  if (sub.certStatus === 'remedial')      return { label: 'Perlu Remedial',               color: '#b45309', bg: '#fff7ed', border: '#fed7aa' };
                  if (sub.certStatus === 'supervisor_ok') return { label: 'Direkomendasi — Menunggu HRD', color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' };
                  return { label: 'Menunggu Review Supervisor', color: '#b45309', bg: '#fffbeb', border: '#fde68a' };
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
                <div key={video.id} className="sop-item" style={{ cursor: 'default' }}>
                  <div className="sop-thumb" style={{ background: video.color || 'var(--navy2)' }}>
                    {isCompleted ? (
                      <div className="sop-done-overlay">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    ) : (
                      <div className="play-ic">
                        <svg viewBox="0 0 24 24" fill="white" style={{ width: '10px', height: '10px' }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      </div>
                    )}
                  </div>
                  <div className="sop-info">
                    <div className="sop-title">{video.title}</div>
                    <div className="sop-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                            marginTop: '4px',
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
                        <span style={{ fontSize: '11px', fontWeight: '700', background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                          Deadline terlewat · {dateStr}
                        </span>
                      );
                      if (diff <= 3) return (
                        <span style={{ fontSize: '11px', fontWeight: '700', background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                          Deadline {diff === 0 ? 'hari ini' : `${diff} hari lagi`} · {dateStr}
                        </span>
                      );
                      return (
                        <span style={{ fontSize: '11px', fontWeight: '700', background: '#fff7ed', border: '1px solid #fed7aa', color: '#ea580c', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          Deadline {diff} hari lagi · {dateStr}
                        </span>
                      );
                    })()}
                    <div className="sop-prog">
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
                  <div className="sop-status" style={{ marginLeft: '12px', flexShrink: 0 }}>
                    {statusBadge && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: statusBadge.color,
                        background: statusBadge.bg,
                        border: `1px solid ${statusBadge.border}`,
                        padding: '6px 14px',
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
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: WIDGETS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* DEADLINES */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Deadline Minggu Ini</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="deadline-item">
                <div className="dl-dot" style={{ background: 'var(--red)' }}></div>
                <div className="dl-title">SOP CS: Handling Komplain</div>
                <div className="dl-date dl-urgent">Besok</div>
              </div>
              <div className="deadline-item">
                <div className="dl-dot" style={{ background: 'var(--amber)' }}></div>
                <div className="dl-title">SOP Sales: Presentasi Produk</div>
                <div className="dl-date dl-soon">4 Jun</div>
              </div>
              <div className="deadline-item">
                <div className="dl-dot" style={{ background: 'var(--green)' }}></div>
                <div className="dl-title">SOP HRD: Peraturan Cuti</div>
                <div className="dl-date dl-ok">7 Jun</div>
              </div>
            </div>
          </div>

          {/* RECENT ACTIVITIES */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Aktivitas Belajar Terbaru</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', padding: '10px 0' }}>
              {recentActivities.map((act) => (
                <div key={act.id} style={{ display: 'flex', gap: '10px', padding: '10px 20px', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: act.type === 'green' ? 'var(--green)' : act.type === 'blue' ? 'var(--accent)' : act.type === 'purple' ? 'var(--purple)' : 'var(--amber)',
                    marginTop: '4px',
                    flexShrink: 0
                  }} />
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)' }} dangerouslySetInnerHTML={{ __html: act.text }} />
                    <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>{act.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* BOTTOM ROW GRID */}
      <div className="grid3">
        
        {/* LEADERBOARD WIDGET */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Peringkat Tim {currentUser.dept}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="rank-item me">
              <div className="rank-num">🥇</div>
              <div className="rank-av" style={{ background: '#2F7BFF' }}>RW</div>
              <div className="rank-name">Rini Wulandari <span className="rank-you">Kamu</span></div>
              <div className="rank-score">18</div>
            </div>
            <div className="rank-item">
              <div className="rank-num">2</div>
              <div className="rank-av" style={{ background: '#0891b2' }}>AH</div>
              <div className="rank-name">Agus Hermawan</div>
              <div className="rank-score">15</div>
            </div>
            <div className="rank-item">
              <div className="rank-num">3</div>
              <div className="rank-av" style={{ background: '#7c3aed' }}>DP</div>
              <div className="rank-name">Dini Puspita</div>
              <div className="rank-score">13</div>
            </div>
          </div>
        </div>

        {/* EXPLORE NEW VIDEOS */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Rekomendasi Video SOP</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {videos.filter(v => v.dept !== currentUser.dept).slice(0, 3).map(video => (
              <div key={video.id} className="explore-item" onClick={() => onSelectVideo(video)}>
                <div className="exp-thumb" style={{ background: video.color || 'var(--navy3)' }}>
                  🎥
                </div>
                <div>
                  <div className="exp-title">{video.title}</div>
                  <div className="exp-dur"><span className={`dept-tag ${video.tagClass}`} style={{ fontSize: '9px' }}>{video.dept}</span> · {video.duration}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ACHIEVEMENTS */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Pencapaian Saya</div>
          </div>
          <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🔥</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text1)' }}>{currentUser.streak} Hari Streak</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Belajar terus setiap hari</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🏆</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text1)' }}>Top Sales Learner</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Peringkat #1 di tim Sales</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>⭐</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text1)' }}>Quiz Master</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Rata-rata skor quiz {averageScore}%</div>
              </div>
            </div>
          </div>
        </div>

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
            noteLabel: detailVideo.submission.approvalNote ? "Pesan dari HRD" : "Catatan Supervisor", 
            noteBg: "#f8fafc", 
            noteBorder: "#e2e8f0", 
            noteColor: "#475569", 
            note: detailVideo.submission.approvalNote || detailVideo.submission.supervisorNote, 
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text1)', margin: '0 0 8px' }}>{detailVideo.video.title}</h3>
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

            <div style={{ background: cfg.noteBg, border: `1px solid ${cfg.noteBorder}`, borderRadius: '8px', padding: '14px', marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: cfg.noteColor, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {cfg.noteLabel}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text1)', lineHeight: '1.6', fontWeight: '500' }}>{cfg.note}</div>
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
