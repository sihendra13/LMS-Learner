import React from 'react';
import { useTenant } from '../../context/TenantContext';

const MobileBeranda = ({ onSelectVideo, onNavigateToSOP }) => {
  const { currentUser, videos, quizSubmissions, passingScore, activities } = useTenant();

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
            const isCompleted = video.progress === 100 && submission && submission.postScore >= passingScore;
            const isOngoing = video.progress > 0 && video.progress < 100;

            return (
              <div key={video.id} className="sop-item" style={{ padding: '10px 16px', gap: '10px' }} onClick={() => onSelectVideo(video)}>
                <div className="sop-thumb" style={{ background: video.color || 'var(--navy2)', width: '60px', height: '38px', borderRadius: '6px' }}>
                  {isCompleted ? (
                    <div className="sop-done-overlay" style={{ background: 'rgba(16,185,129,0.7)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '14px', height: '14px' }}><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  ) : (
                    <div className="play-ic" style={{ width: '20px', height: '20px' }}>
                      <svg viewBox="0 0 24 24" fill="white" style={{ width: '8px', height: '8px' }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </div>
                  )}
                </div>
                <div className="sop-info">
                  <div className="sop-title" style={{ fontSize: '12px', fontWeight: '600', marginBottom: '2px' }}>{video.title}</div>
                  <div className="sop-meta" style={{ gap: '6px', marginBottom: '3px' }}>
                    <span className={`dept-tag ${video.tagClass}`} style={{ fontSize: '8px', padding: '1px 5px' }}>{video.dept}</span>
                    <span className="sop-dur" style={{ fontSize: '10px' }}>⏱ {video.duration}</span>
                    {submission && (
                      <span style={{ fontSize: '10px', fontWeight: 'bold', color: submission.postScore >= passingScore ? 'var(--green)' : 'var(--red)' }}>
                        Skor: {submission.postScore}%
                      </span>
                    )}
                  </div>
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
                    <div className="prog-pct" style={{ fontSize: '10px', minWidth: '22px' }}>{video.progress}%</div>
                  </div>
                </div>
                <div className="sop-status">
                  {isCompleted ? (
                    <span className="status-pill sp-done" style={{ fontSize: '8px', padding: '2px 6px' }}>Lulus</span>
                  ) : isOngoing ? (
                    <span className="status-pill sp-ongoing" style={{ fontSize: '8px', padding: '2px 6px' }}>Lanjutkan</span>
                  ) : (
                    <span className="status-pill sp-new" style={{ fontSize: '8px', padding: '2px 6px' }}>Baru</span>
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

    </div>
  );
};

export default MobileBeranda;
