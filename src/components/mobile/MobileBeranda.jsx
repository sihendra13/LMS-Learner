import React from 'react';
import { useTenant } from '../../context/TenantContext';

const MobileBeranda = ({ onSelectVideo, onNavigateToSOP }) => {
  const { currentUser, videos, quizSubmissions, passingScore, activities, MAX_RETAKES } = useTenant();
  const [detailVideo, setDetailVideo] = React.useState(null);

  // Filter videos for user's department
  const mandatoryVideos = videos.filter(v => (v.dept === currentUser.dept || v.dept === 'Semua') && !v.archived);
  
  const totalMandatory = mandatoryVideos.length;
  const completedMandatory = mandatoryVideos.filter(v => {
    const sub = quizSubmissions.find(s => s.videoTitle === v.title && s.employeeName === currentUser.name);
    return v.progress === 100 && sub && sub.postScore >= passingScore;
  }).length;

  const ongoingMandatory = mandatoryVideos.filter(v => v.progress > 0 && v.progress < 100).length;
  const newMandatory = mandatoryVideos.filter(v => v.progress === 0).length;
  const remainingCount = totalMandatory - completedMandatory;

  const completionPercent = totalMandatory > 0 ? Math.round((completedMandatory / totalMandatory) * 100) : 0;
  
  // Total certificates for current user
  const totalCertificates = quizSubmissions.filter(s => s.employeeName === currentUser.name && s.postScore >= passingScore).length;

  // Average score of passed quizzes
  const passedSubmissions = quizSubmissions.filter(s => s.employeeName === currentUser.name && s.postScore >= passingScore);
  const averageScore = passedSubmissions.length > 0 
    ? Math.round(passedSubmissions.reduce((sum, s) => sum + s.postScore, 0) / passedSubmissions.length) 
    : 0;

  // SVG ring calculations (stroke-dasharray is 220)
  const ringOffset = 220 - (220 * completionPercent) / 100;

  // Explore/recommend videos (videos not in user's dept)
  const recommendedVideos = videos.filter(v => v.dept !== currentUser.dept).slice(0, 3);

  // Activities related to current user
  const recentActivities = activities.slice(0, 3);

  return (
    <div style={{ padding: '16px 16px 30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Welcome Section */}
      <div>
        <div className="greeting" style={{ fontSize: '18px' }}>Selamat bekerja, {currentUser.name.split(' ')[0]} 👋</div>
        <div className="greeting-sub" style={{ fontSize: '12px', marginTop: '2px' }}>
          Divisi {currentUser.dept} · Ada {remainingCount} SOP yang perlu Anda tinjau &amp; pelajari
        </div>
      </div>

      {/* Main Progress Hero Card */}
      <div className="hero-bar" style={{ margin: 0, padding: '16px 20px', gap: '20px' }}>
        <div className="hero-ring" style={{ width: '80px', height: '80px' }}>
          <svg className="ring-svg" viewBox="0 0 90 90" style={{ width: '80px', height: '80px' }}>
            <circle className="ring-bg" cx="45" cy="45" r="35"/>
            <circle className="ring-fill" cx="45" cy="45" r="35" style={{ strokeDashoffset: ringOffset }}/>
          </svg>
          <div className="ring-label">
            <div className="ring-pct" style={{ fontSize: '18px' }}>{completionPercent}%</div>
            <div className="ring-sub" style={{ fontSize: '8px' }}>selesai</div>
          </div>
        </div>
        <div className="hero-info">
          <div className="hero-title" style={{ fontSize: '14px', marginBottom: '4px' }}>Progress Pelatihan Departemen {currentUser.dept}</div>
          <div className="hero-sub" style={{ fontSize: '12px', marginBottom: '10px', lineHeight: '1.4' }}>
            Anda telah menyelesaikan {completedMandatory} dari {totalMandatory} SOP Wajib untuk divisi Anda. Terus tingkatkan kompetensi!
          </div>
          <div className="hero-pills" style={{ gap: '6px' }}>
            <div className="h-pill" style={{ padding: '4px 8px', fontSize: '11px' }}>
              🎬 <strong>{completedMandatory}</strong> ditonton
            </div>
            <div className="h-pill" style={{ padding: '4px 8px', fontSize: '11px' }}>
              🏆 <strong>{totalCertificates}</strong> sertifikat
            </div>
            <div className="h-pill" style={{ padding: '4px 8px', fontSize: '11px' }}>
              ⭐ <strong>{averageScore}%</strong> avg. skor
            </div>
            <div className="h-pill" style={{ padding: '4px 8px', fontSize: '11px' }}>
              🔥 <strong>{currentUser.streak} hari</strong> streak
            </div>
          </div>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="stats-row" style={{ margin: 0, gap: '10px' }}>
        <div className="stat-mini" style={{ padding: '10px 12px', gap: '8px' }}>
          <div className="stat-ic blue" style={{ width: '32px', height: '32px', borderRadius: '6px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <div>
            <div className="s-val" style={{ fontSize: '15px' }}>{totalMandatory}</div>
            <div className="s-lbl" style={{ fontSize: '9px' }}>SOP wajib divisi</div>
          </div>
        </div>
        <div className="stat-mini" style={{ padding: '10px 12px', gap: '8px' }}>
          <div className="stat-ic green" style={{ width: '32px', height: '32px', borderRadius: '6px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <div className="s-val" style={{ fontSize: '15px' }}>{completedMandatory}</div>
            <div className="s-lbl" style={{ fontSize: '9px' }}>Sudah lulus kuis</div>
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
            <div className="s-val" style={{ fontSize: '15px', color: 'var(--amber)' }}>{remainingCount}</div>
            <div className="s-lbl" style={{ fontSize: '9px' }}>Tersisa / Belum</div>
          </div>
        </div>
        <div className="stat-mini" style={{ padding: '10px 12px', gap: '8px' }}>
          <div className="stat-ic purple" style={{ width: '32px', height: '32px', borderRadius: '6px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/>
              <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"/>
              <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z"/>
            </svg>
          </div>
          <div>
            <div className="s-val" style={{ fontSize: '15px' }}>{totalCertificates}</div>
            <div className="s-lbl" style={{ fontSize: '9px' }}>Sertifikat aktif</div>
          </div>
        </div>
      </div>

      {/* SOP Wajib Saya */}
      <div className="card">
        <div className="card-head" style={{ padding: '12px 16px' }}>
          <div className="card-title" style={{ fontSize: '13px' }}>SOP Wajib Saya ({currentUser.dept})</div>
          <span className="card-link" style={{ fontSize: '11px' }} onClick={onNavigateToSOP}>Lihat Semua</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {mandatoryVideos.map(video => {
            const submission = quizSubmissions.find(s => s.videoTitle === video.title && s.employeeName === currentUser.name);
            const cs = submission?.certStatus;
            const isMaxReached = submission && (submission.retakeCount || 0) >= MAX_RETAKES && submission.postScore < passingScore;
            const isCompleted = cs === 'approved' || (video.progress === 100 && submission && submission.postScore >= passingScore);
            const isOngoing = !isCompleted && video.progress > 0 && video.progress < 100;
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
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginRight: '3px' }}>
                      <circle cx="12" cy="8" r="7" />
                      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                    </svg>
                  )
                };
                if (sub.certStatus === 'rejected')      return { label: 'Ditolak Final',                color: '#b91c1c', bg: '#fff5f5', border: '#fecaca' };
                if (sub.certStatus === 'remedial')      return (sub.retakeCount || 0) >= MAX_RETAKES
                  ? { label: 'Tidak Lulus', color: '#b91c1c', bg: '#fff5f5', border: '#fecaca' }
                  : { label: 'Perlu Remedial', color: '#b45309', bg: '#fff7ed', border: '#fed7aa' };
                if (sub.certStatus === 'supervisor_ok') return { label: 'Direkomendasi — Menunggu HRD', color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' };
                if ((sub.retakeCount || 0) >= MAX_RETAKES) return { label: 'Tidak Lulus', color: '#b91c1c', bg: '#fff5f5', border: '#fecaca' };
                return { label: 'Menunggu Review Supervisor', color: '#b45309', bg: '#fffbeb', border: '#fde68a' };
              }
              if (isCompleted) return {
                label: 'Lulus',
                color: '#15803d',
                bg: '#f0fdf4',
                border: '#86efac',
                icon: (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginRight: '3px' }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )
              };
              if (isOngoing)   return { label: 'Lanjutkan', color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' };
              return { label: 'Baru', color: '#b45309', bg: '#fffbeb', border: '#fde68a' };
            };
            const statusBadge = getStatusBadge(submission);

            const handleItemClick = () => {
              if (cs === 'pending') {
                if ((submission?.retakeCount || 0) >= MAX_RETAKES) {
                  setDetailVideo({ video, submission });
                }
                return;
              }
              if (cs === 'supervisor_ok') {
                if (submission?.supervisorNote) {
                  setDetailVideo({ video, submission });
                }
                return;
              }
              if (cs === 'approved') {
                if (submission?.approvalNote || submission?.supervisorNote) {
                  setDetailVideo({ video, submission });
                }
                return;
              }
              onSelectVideo(video);
            };

            return (
              <div key={video.id} className="sop-item" style={{ padding: '16px', gap: '10px', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }} onClick={handleItemClick}>
                {/* Top Section: Thumbnail + Info */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', width: '100%' }}>
                  <div className="sop-thumb" style={{ background: video.color || 'var(--navy2)', width: '64px', height: '40px', borderRadius: '6px', flexShrink: 0, position: 'relative' }}>
                    {isCompleted ? (
                      <div className="sop-done-overlay" style={{ background: 'rgba(16,185,129,0.7)', borderRadius: '6px' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '14px', height: '14px' }}><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    ) : (
                      <div className="play-ic" style={{ width: '20px', height: '20px' }}>
                        <svg viewBox="0 0 24 24" fill="white" style={{ width: '8px', height: '8px' }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      </div>
                    )}
                  </div>
                  <div className="sop-info" style={{ flex: 1, minWidth: 0 }}>
                    <div className="sop-title" style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      marginBottom: '4px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: '1.4',
                      color: 'var(--text1)'
                    }}>
                      {video.title}
                    </div>
                    <div className="sop-meta" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span className={`dept-tag ${video.tagClass}`} style={{ fontSize: '8px', padding: '1px 5px' }}>{video.dept}</span>
                      <span className="sop-dur" style={{ fontSize: '10px' }}>⏱ {video.duration}</span>
                    </div>
                    {submission && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          background: submission.postScore >= passingScore ? '#ecfdf5' : '#fef2f2',
                          color: submission.postScore >= passingScore ? '#15803d' : '#dc2626',
                          border: `1px solid ${submission.postScore >= passingScore ? '#a7f3d0' : '#fca5a5'}`,
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}>
                          Skor: {submission.postScore}%
                        </span>
                        {isMaxReached && (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            background: '#fff5f5',
                            color: '#b91c1c',
                            border: '1px solid #fecaca',
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}>
                            Tidak Lulus
                          </span>
                        )}
                        {!isMaxReached && cs === 'remedial' && (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            background: '#fff7ed',
                            color: '#b45309',
                            border: '1px solid #fed7aa',
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}>
                            Perlu Remedial
                          </span>
                        )}
                      </div>
                    )}
                    {(() => {
                      const note = (cs === 'approved' && (submission?.approvalNote || submission?.supervisorNote)) || (cs === 'supervisor_ok' && submission?.supervisorNote) || (cs === 'rejected' && submission?.rejectionNote) || (cs === 'remedial' && submission?.supervisorNote);
                      if (!note) return null;
                      return (
                        <span
                          onClick={(e) => { e.stopPropagation(); setDetailVideo({ video, submission }); }}
                          style={{
                            fontSize: '9px',
                            fontWeight: '600',
                            color: '#2563eb',
                            background: 'rgba(59, 130, 246, 0.08)',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '4px',
                            cursor: 'pointer'
                          }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          Ada catatan
                        </span>
                      );
                    })()}
                  </div>
                </div>
                
                {/* Middle Section: Progress Bar */}
                <div className="sop-prog" style={{ marginLeft: '0px', marginTop: '4px', marginBottom: '4px' }}>
                  <div className="prog-bar">
                    <div 
                      className="prog-fill" 
                      style={{ 
                        width: `${displayProgress}%`, 
                        background: isCompleted ? 'var(--green)' : isOngoing ? 'var(--accent)' : 'var(--text3)' 
                      }}
                    />
                  </div>
                  <div className="prog-pct" style={{ fontSize: '10px', minWidth: '22px' }}>{displayProgress}%</div>
                </div>

                {/* Bottom Section: Full-width Action Button */}
                <div style={{ marginTop: '4px' }}>
                  {isMaxReached ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDetailVideo({ video, submission }); }} 
                      style={{ width: '100%', background: '#fff5f5', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textAlign: 'center', boxSizing: 'border-box' }}
                    >
                      Hubungi HRD/Supervisor
                    </button>
                  ) : cs === 'approved' ? (
                    <div 
                      onClick={(e) => { e.stopPropagation(); setDetailVideo({ video, submission }); }}
                      style={{ width: '100%', background: '#ecfdf4', color: '#15803d', border: '1px solid #d1fae5', borderRadius: '8px', padding: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textAlign: 'center', boxSizing: 'border-box' }}
                    >
                      Selesai
                    </div>
                  ) : cs === 'pending' ? (
                    <div 
                      style={{ width: '100%', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', fontSize: '12px', fontWeight: '700', textAlign: 'center', boxSizing: 'border-box' }}
                    >
                      Menunggu Supervisor
                    </div>
                  ) : cs === 'supervisor_ok' ? (
                    <div 
                      style={{ width: '100%', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', fontSize: '12px', fontWeight: '700', textAlign: 'center', boxSizing: 'border-box' }}
                    >
                      Menunggu HRD
                    </div>
                  ) : (cs === 'remedial' || cs === 'rejected') ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onSelectVideo(video); }} 
                      style={{ width: '100%', background: '#fff7ed', color: '#b45309', border: '1px solid #fed7aa', borderRadius: '8px', padding: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textAlign: 'center', boxSizing: 'border-box' }}
                    >
                      Mulai SOP Ulang
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onSelectVideo(video); }} 
                      style={{ width: '100%', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textAlign: 'center', boxSizing: 'border-box' }}
                    >
                      {isOngoing ? 'Lanjutkan' : 'Mulai SOP'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deadline Minggu Ini */}
      <div className="card">
        <div className="card-head" style={{ padding: '12px 16px' }}>
          <div className="card-title" style={{ fontSize: '13px' }}>Deadline Minggu Ini</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="deadline-item" style={{ padding: '10px 16px', gap: '10px' }}>
            <div className="dl-dot" style={{ background: 'var(--red)', width: '7px', height: '7px' }}></div>
            <div className="dl-title" style={{ fontSize: '12px' }}>SOP CS: Handling Komplain</div>
            <div className="dl-date dl-urgent" style={{ fontSize: '10px', padding: '2px 6px' }}>Besok</div>
          </div>
          <div className="deadline-item" style={{ padding: '10px 16px', gap: '10px' }}>
            <div className="dl-dot" style={{ background: 'var(--amber)', width: '7px', height: '7px' }}></div>
            <div className="dl-title" style={{ fontSize: '12px' }}>SOP Sales: Presentasi Produk</div>
            <div className="dl-date dl-soon" style={{ fontSize: '10px', padding: '2px 6px' }}>4 Jun</div>
          </div>
          <div className="deadline-item" style={{ padding: '10px 16px', gap: '10px' }}>
            <div className="dl-dot" style={{ background: 'var(--green)', width: '7px', height: '7px' }}></div>
            <div className="dl-title" style={{ fontSize: '12px' }}>SOP HRD: Peraturan Cuti</div>
            <div className="dl-date dl-ok" style={{ fontSize: '10px', padding: '2px 6px' }}>7 Jun</div>
          </div>
        </div>
      </div>

      {/* Aktivitas Belajar Terbaru */}
      <div className="card">
        <div className="card-head" style={{ padding: '12px 16px' }}>
          <div className="card-title" style={{ fontSize: '13px' }}>Aktivitas Belajar Terbaru</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '6px 0' }}>
          {recentActivities.map((act) => (
            <div key={act.id} style={{ display: 'flex', gap: '10px', padding: '10px 16px', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
              <div style={{ 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                background: act.type === 'green' ? 'var(--green)' : act.type === 'blue' ? 'var(--accent)' : act.type === 'purple' ? 'var(--purple)' : 'var(--amber)',
                marginTop: '5px',
                flexShrink: 0
              }} />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text2)', lineHeight: '1.4' }} dangerouslySetInnerHTML={{ __html: act.text }} />
                <div style={{ fontSize: '9px', color: 'var(--text3)', marginTop: '2px' }}>{act.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Peringkat Tim */}
      <div className="card">
        <div className="card-head" style={{ padding: '12px 16px' }}>
          <div className="card-title" style={{ fontSize: '13px' }}>Peringkat Tim {currentUser.dept}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="rank-item me" style={{ padding: '8px 16px', gap: '8px' }}>
            <div className="rank-num" style={{ width: '16px', fontSize: '11px' }}>🥇</div>
            <div className="rank-av" style={{ background: '#2F7BFF', width: '26px', height: '26px', fontSize: '10px' }}>RW</div>
            <div className="rank-name" style={{ fontSize: '12px' }}>Rini Wulandari <span className="rank-you" style={{ fontSize: '9px', padding: '1px 5px' }}>Kamu</span></div>
            <div className="rank-score" style={{ fontSize: '12px' }}>18</div>
          </div>
          <div className="rank-item" style={{ padding: '8px 16px', gap: '8px' }}>
            <div className="rank-num" style={{ width: '16px', fontSize: '11px' }}>2</div>
            <div className="rank-av" style={{ background: '#0891b2', width: '26px', height: '26px', fontSize: '10px' }}>AH</div>
            <div className="rank-name" style={{ fontSize: '12px' }}>Agus Hermawan</div>
            <div className="rank-score" style={{ fontSize: '12px' }}>15</div>
          </div>
          <div className="rank-item" style={{ padding: '8px 16px', gap: '8px' }}>
            <div className="rank-num" style={{ width: '16px', fontSize: '11px' }}>3</div>
            <div className="rank-av" style={{ background: '#7c3aed', width: '26px', height: '26px', fontSize: '10px' }}>DP</div>
            <div className="rank-name" style={{ fontSize: '12px' }}>Dini Puspita</div>
            <div className="rank-score" style={{ fontSize: '12px' }}>13</div>
          </div>
        </div>
      </div>

      {/* Rekomendasi Video SOP */}
      <div className="card">
        <div className="card-head" style={{ padding: '12px 16px' }}>
          <div className="card-title" style={{ fontSize: '13px' }}>Rekomendasi Video SOP</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {videos.filter(v => v.dept !== currentUser.dept).slice(0, 3).map(video => (
            <div key={video.id} className="explore-item" style={{ padding: '8px 16px', gap: '10px' }} onClick={() => onSelectVideo(video)}>
              <div className="exp-thumb" style={{ background: video.color || 'var(--navy3)', width: '40px', height: '26px', fontSize: '12px', borderRadius: '4px' }}>
                🎥
              </div>
              <div>
                <div className="exp-title" style={{ fontSize: '12px', fontWeight: '500' }}>{video.title}</div>
                <div className="exp-dur" style={{ fontSize: '10px' }}>
                  <span className={`dept-tag ${video.tagClass}`} style={{ fontSize: '8px', padding: '1px 5px' }}>{video.dept}</span> · {video.duration}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pencapaian Saya */}
      <div className="card">
        <div className="card-head" style={{ padding: '12px 16px' }}>
          <div className="card-title" style={{ fontSize: '13px' }}>Pencapaian Saya</div>
        </div>
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fffbeb', display: 'flex', alignItems: 'center', justify: 'center', fontSize: '16px', flexShrink: 0 }}>🔥</div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text1)' }}>{currentUser.streak} Hari Streak</div>
              <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Belajar terus setiap hari</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dbeafe', display: 'flex', alignItems: 'center', justify: 'center', fontSize: '16px', flexShrink: 0 }}>🏆</div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text1)' }}>Top Sales Learner</div>
              <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Peringkat #1 di tim Sales</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justify: 'center', fontSize: '16px', flexShrink: 0 }}>⭐</div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text1)' }}>Quiz Master</div>
              <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Rata-rata skor quiz {averageScore}%</div>
            </div>
          </div>
        </div>
      </div>

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
          : (detailVideo.submission?.retakeCount || 0) >= MAX_RETAKES
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
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', webkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', maxWidth: '340px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text1)', margin: 0 }}>{detailVideo.video.title}</h3>
                  <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: cfg.badgeBg, color: cfg.badgeColor, border: `1px solid ${cfg.badgeBorder}`, display: 'inline-flex', alignItems: 'center' }}>
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
                  <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>Skor Pre-Test</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: (detailVideo.submission.preScore ?? 0) >= passingScore ? '#16a34a' : '#dc2626' }}>{detailVideo.submission.preScore ?? '—'}%</div>
                </div>
                <div style={{ width: '1px', height: '36px', background: '#e2e8f0' }} />
                <div style={{ flex: 1, padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>Skor Post-Test</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: (detailVideo.submission.postScore ?? 0) >= passingScore ? '#16a34a' : '#dc2626' }}>{detailVideo.submission.postScore ?? '—'}%</div>
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
                  <div style={{ fontSize: '11px', color, background: bg, borderRadius: '6px', padding: '6px 10px', marginBottom: '16px' }}>
                    📅 {diff < 0 ? `Deadline terlewat · ${dateStr}` : diff === 0 ? `Deadline hari ini · ${dateStr}` : `Deadline ${diff} hari lagi · ${dateStr}`}
                  </div>
                );
              })()}

              {cfg.note && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ border: `1px solid ${cfg.noteBorder}`, borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ background: '#f8fafc', padding: '8px 12px', borderBottom: `1px solid ${cfg.noteBorder}`, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: cfg.noteColor }}>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: cfg.noteColor }}>{cfg.noteLabel}</span>
                    </div>
                    <div style={{ background: '#ffffff', padding: '12px', fontSize: '12px', color: 'var(--text1)', lineHeight: '1.5', fontWeight: '500' }}>
                      {cfg.note}
                    </div>
                  </div>
                  {cfg.secondNote && (
                    <div style={{ border: '1px solid #86efac', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ background: '#f0fdf4', padding: '8px 12px', borderBottom: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: '#15803d' }}>
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#15803d' }}>{cfg.secondNoteLabel}</span>
                      </div>
                      <div style={{ background: '#ffffff', padding: '12px', fontSize: '12px', color: 'var(--text1)', lineHeight: '1.5', fontWeight: '500' }}>
                        {cfg.secondNote}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setDetailVideo(null)} 
                  style={{ 
                    flex: 1, 
                    padding: '9px', 
                    borderRadius: '8px', 
                    fontSize: '12px', 
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
                    style={{ flex: 2, padding: '9px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', background: '#0f172a', border: 'none', color: '#fff' }}
                  >
                    Mulai SOP Ulang
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default MobileBeranda;
