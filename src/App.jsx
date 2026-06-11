import React, { useState } from 'react';
import { TenantProvider, useTenant } from './context/TenantContext';
import { Dashboard } from './pages/Dashboard';
import { SOPManager } from './pages/SOPManager';
import { Certifications } from './pages/Certifications';
import { QuizModal } from './components/QuizModal';
import { SyncPanel } from './components/SyncPanel';

const AppContent = () => {
  const { activePage, setActivePage, currentUser, videos, quizSubmissions, passingScore } = useTenant();
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [syncOpen, setSyncOpen] = useState(false);

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
        return <Dashboard onSelectVideo={setSelectedVideo} />;
      case 'sop':
        return <SOPManager onSelectVideo={setSelectedVideo} />;
      case 'sertifikasi':
        return <Certifications />;
      default:
        return <Dashboard onSelectVideo={setSelectedVideo} />;
    }
  };

  return (
    <>
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo-area">
          <div className="logo">SOP<span>Learn</span></div>
          <div className="logo-tag">PT Maju Bersama Tbk</div>
        </div>

        <div className="user-card">
          <div className="user-av">{currentUser.avatar}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name">{currentUser.name}</div>
            <div className="user-dept">{currentUser.dept} · {currentUser.city}</div>
          </div>
        </div>

        <nav>
          <div className="nav-section">Menu Utama</div>
          
          <button 
            className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActivePage('dashboard')}
            style={{ background: 'none', border: 'none', width: '90%', textAlign: 'left' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
            Beranda
          </button>
          
          <button 
            className={`nav-item ${activePage === 'sop' ? 'active' : ''}`}
            onClick={() => setActivePage('sop')}
            style={{ background: 'none', border: 'none', width: '90%', textAlign: 'left', display: 'flex', alignItems: 'center' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
            SOP Saya
            {outstandingCount > 0 && <span className="nav-badge">{outstandingCount}</span>}
          </button>
          
          <button 
            className={`nav-item ${activePage === 'sertifikasi' ? 'active' : ''}`}
            onClick={() => setActivePage('sertifikasi')}
            style={{ background: 'none', border: 'none', width: '90%', textAlign: 'left' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
            Sertifikat
          </button>

          <div className="nav-section">Integrasi</div>
          <button 
            className="nav-item"
            onClick={() => setSyncOpen(true)}
            style={{ background: 'none', border: 'none', width: '90%', textAlign: 'left', color: '#60a5fa' }}
          >
            🔄 Sync Data DB
          </button>
        </nav>

        <div className="sidebar-bot">
          <div className="company-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            PT Maju Bersama Tbk
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
            
            <button 
              className="btn-sync" 
              onClick={() => setSyncOpen(true)}
              title="Hubungkan state database dengan Admin"
            >
              🔄 Sync State
            </button>
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

      {/* SYNC TOOL MODAL */}
      <SyncPanel 
        isOpen={syncOpen} 
        onClose={() => setSyncOpen(false)} 
      />
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
