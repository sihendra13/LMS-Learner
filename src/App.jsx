import React, { useState } from 'react';
import { TenantProvider, useTenant } from './context/TenantContext';
import { Dashboard } from './pages/Dashboard';
import { SOPManager } from './pages/SOPManager';
import { Certifications } from './pages/Certifications';
import { QuizModal } from './components/QuizModal';
import MobileLayout from './components/mobile/MobileLayout';
import { supabase } from './utils/supabase';

const AppContent = () => {
  const { activePage, setActivePage, currentUser, videos, quizSubmissions, passingScore, tenant } = useTenant();
  const [selectedVideo, setSelectedVideo] = useState(null);

  const handleSelectVideo = (video) => {
    if (video?.id) {
      supabase.from('sop_videos').update({ views: (video.views || 0) + 1 }).eq('id', video.id);
    }
    setSelectedVideo(video);
  };
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768 || (window.innerWidth < 1024 && window.innerHeight < 500));

  React.useEffect(() => {
    const handleResize = () => {
      // Jika sedang fullscreen, kunci pendeteksian dan jangan ubah layout agar tidak unmount
      if (document.fullscreenElement || window.isFullscreenActive) return;
      setIsMobile(window.innerWidth < 768 || (window.innerWidth < 1024 && window.innerHeight < 500));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate outstanding SOP count (assigned to user's dept, progress < 100 or quiz not passed)
  const outstandingCount = videos.filter(v => {
    if (v.dept !== currentUser.dept) return false;
    const sub = quizSubmissions.find(s => s.videoTitle === v.title && s.employeeName === currentUser.name);
    const passed = sub && sub.postScore >= passingScore;
    return v.progress < 100 || !passed;
  }).length;

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard onSelectVideo={handleSelectVideo} />;
      case 'sop':
        return <SOPManager onSelectVideo={handleSelectVideo} />;
      case 'sertifikasi':
        return <Certifications />;
      default:
        return <Dashboard onSelectVideo={handleSelectVideo} />;
    }
  };

  if (isMobile) {
    return (
      <>
        <MobileLayout onSelectVideo={handleSelectVideo} />

        {/* SOP INTERACTIVE MODAL WIZARD */}
        {selectedVideo && (
          <QuizModal
            video={selectedVideo}
            onClose={() => setSelectedVideo(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      {/* SIDEBAR */}
      <aside className="sidebar">
        {/* BRANDING TOP: FULL WHITE HEADER CONTAINER FOR LOGO */}
        <div style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            height: '60px',
            overflow: 'hidden',
            padding: '0 20px',
            width: '100%',
            boxSizing: 'border-box',
            borderRight: '1px solid #e2e8f0'
          }} onClick={() => setActivePage('dashboard')}>
            {tenant.logo ? (
              <img src={tenant.logo} alt={tenant.name} style={{ maxWidth: '100%', maxHeight: '42px', objectFit: 'contain' }} />
            ) : (
              <>
                <span style={{ fontSize: '15px', flexShrink: 0 }}>🏢</span>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {tenant.name}
                </div>
              </>
            )}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', padding: '12px 20px', fontWeight: '600' }}>
            Paket {tenant.plan ? tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1) : 'Business'} · {tenant.status || 'Aktif'}
          </div>
        </div>

        {/* USER PROFILE BADGE */}
        <div className="tenant-badge" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '10px', padding: '10px 14px', borderRadius: '8px', margin: '14px', alignItems: 'center', textAlign: 'left' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: '700',
            color: '#fff',
            flexShrink: 0
          }}>
            {currentUser.avatar}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div className="tenant-name" style={{ fontWeight: '700', fontSize: '13px', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.name}</div>
            <div className="tenant-plan" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
              Divisi {currentUser.dept}
            </div>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          <div className="nav-section">Menu Utama</div>
          
          <button 
            className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActivePage('dashboard')}
            style={{ background: 'none', border: 'none', width: '90%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
            Beranda
          </button>
          
          <button 
            className={`nav-item ${activePage === 'sop' ? 'active' : ''}`}
            onClick={() => setActivePage('sop')}
            style={{ background: 'none', border: 'none', width: '90%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
            SOP Saya
            {outstandingCount > 0 && <span className="nav-badge" style={{ marginLeft: 'auto' }}>{outstandingCount}</span>}
          </button>
          
          <button 
            className={`nav-item ${activePage === 'sertifikasi' ? 'active' : ''}`}
            onClick={() => setActivePage('sertifikasi')}
            style={{ background: 'none', border: 'none', width: '90%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
            Sertifikat
          </button>

        </nav>

        {/* LOGOUT + BRANDING BOTTOM */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '12px 16px' }}>
          <button
            onClick={() => alert('Logout simulasi berhasil! Anda dapat memuat ulang halaman untuk masuk kembali.')}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.06)', border: 'none',
              borderRadius: '8px', padding: '9px 14px', color: 'rgba(255,255,255,0.7)',
              fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center',
              gap: '8px', marginBottom: '10px',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Keluar
          </button>
          <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>
            Axara LMS Platform
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="main">
        {/* TOPBAR */}
        <header className="topbar">
          <div>
            <div className="greeting">Selamat bekerja, {currentUser.name.split(' ')[0]} 👋</div>
            <div className="greeting-sub">Divisi {currentUser.dept} · Ada {outstandingCount} SOP yang perlu Anda tinjau & pelajari</div>
          </div>
          <div className="topbar-right">
            <div className="streak-pill">
              🔥 {currentUser.streak} Hari Streak
            </div>
            
          </div>
        </header>

        {/* PAGE CONTENT */}
        {renderActivePage()}
      </main>

      {/* SOP INTERACTIVE MODAL WIZARD */}
      {selectedVideo && (
        <QuizModal 
          video={selectedVideo} 
          onClose={() => setSelectedVideo(null)} 
        />
      )}

    </>
  );
};

function App() {
  return (
    <TenantProvider>
      <AppContent />
    </TenantProvider>
  );
}

export default App;
