import React, { useState, useEffect } from 'react';
import { TenantProvider, useTenant } from './context/TenantContext';
import { Dashboard } from './pages/Dashboard';
import { SOPManager } from './pages/SOPManager';
import { Certifications } from './pages/Certifications';
import { LoginPage } from './pages/LoginPage';
import { EmployeePicker } from './pages/EmployeePicker';
import { QuizModal } from './components/QuizModal';
import MobileLayout from './components/mobile/MobileLayout';
import { supabase } from './utils/supabase';

const AppContent = ({ onLogout }) => {
  const { 
    activePage, 
    setActivePage, 
    currentUser, 
    videos, 
    quizSubmissions, 
    passingScore, 
    tenant,
    notifications,
    readIds,
    markNotificationsAsRead,
    toast,
    setToast
  } = useTenant();
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showNotif, setShowNotif] = useState(false);
  const panelRef = React.useRef(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768 || (window.innerWidth < 1024 && window.innerHeight < 500));

  const handleSelectVideo = (video) => {
    if (video?.id) {
      supabase.rpc('increment_video_views', { video_id: video.id });
    }
    setSelectedVideo(video);
  };

  React.useEffect(() => {
    const handleResize = () => {
      // Jika sedang fullscreen, kunci pendeteksian dan jangan ubah layout agar tidak unmount
      if (document.fullscreenElement || window.isFullscreenActive) return;
      setIsMobile(window.innerWidth < 768 || (window.innerWidth < 1024 && window.innerHeight < 500));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle click outside notification panel
  React.useEffect(() => {
    if (!showNotif) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setShowNotif(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotif]);

  // Calculate outstanding SOP count (assigned to user's dept, progress < 100 or quiz not passed)
  const outstandingCount = videos.filter(v => {
    if (v.archived) return false;
    if (v.dept !== currentUser.dept && v.dept !== 'Semua') return false;
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
        <MobileLayout onSelectVideo={handleSelectVideo} onLogout={onLogout} />

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
            {tenant.logo && tenant.plan === 'enterprise' ? (
              <img src={tenant.logo} alt={tenant.name} style={{ maxWidth: '180px', maxHeight: '40px', objectFit: 'contain' }} />
            ) : (
              <img src="/myaxara-logo.svg" alt="myAxara" style={{ maxWidth: '180px', maxHeight: '40px', objectFit: 'contain' }} />
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
            onClick={onLogout}
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
          <div style={{ textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em', paddingLeft: '4px' }}>
            myAxara LMS Platform
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
          <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>

            {/* NOTIFICATION BELL */}
            <div ref={panelRef} style={{ position: 'relative' }}>
              <div
                className="topbar-btn"
                onClick={() => {
                  setShowNotif(v => !v);
                  if (!showNotif) {
                    const unread = notifications.filter(n => !readIds.has(n.id)).map(n => n.id);
                    if (unread.length > 0) markNotificationsAsRead(unread);
                  }
                }}
                style={{
                  cursor: 'pointer',
                  position: 'relative',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                  transition: 'all 0.2s',
                }}
                title="Notifikasi"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: '18px', height: '18px' }}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {notifications.filter(n => !readIds.has(n.id)).length > 0 && (
                  <span style={{
                    position: 'absolute', top: '2px', right: '2px',
                    background: '#ef4444', color: '#fff',
                    fontSize: '9px', fontWeight: '700',
                    minWidth: '16px', height: '16px',
                    borderRadius: '8px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px', lineHeight: 1,
                    border: '1.5px solid #ffffff',
                  }}>
                    {notifications.filter(n => !readIds.has(n.id)).length}
                  </span>
                )}
              </div>

              {/* DROPDOWN PANEL */}
              {showNotif && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  width: '340px', background: '#ffffff',
                  border: '1px solid #e2e8f0', borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  zIndex: 999, overflow: 'hidden',
                  fontFamily: "'Plus Jakarta Sans', sans-serif"
                }}>
                  {/* Header */}
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>Notifikasi</span>
                    {notifications.filter(n => !readIds.has(n.id)).length > 0 && (
                      <button 
                        onClick={() => markNotificationsAsRead(notifications.map(n => n.id))} 
                        style={{ background: 'none', border: 'none', fontSize: '11px', color: '#3b82f6', cursor: 'pointer', fontWeight: '600', padding: 0 }}
                      >
                        Tandai semua dibaca
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎉</div>
                        Semua beres! Tidak ada notifikasi baru.
                      </div>
                    ) : notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setActivePage(n.page);
                          setShowNotif(false);
                          markNotificationsAsRead([n.id]);
                        }}
                        style={{
                          display: 'flex', gap: '12px', alignItems: 'flex-start',
                          padding: '12px 16px', cursor: 'pointer',
                          borderBottom: '1px solid #e2e8f0',
                          background: readIds.has(n.id) ? 'transparent' : '#f8faff',
                          transition: 'background 0.15s',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                        onMouseOut={e => e.currentTarget.style.background = readIds.has(n.id) ? 'transparent' : '#f8faff'}
                      >
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '8px',
                          background: n.bg, color: n.color, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', flexShrink: 0, fontSize: '16px'
                        }}>
                          {n.type === 'approved' ? '🎓' : n.type === 'remedial' ? '⚠️' : n.type === 'new-sop' ? '📚' : '⏰'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', lineHeight: '1.4', marginBottom: '2px' }}>{n.title}</div>
                          <div style={{ fontSize: '11px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {n.message}
                          </div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>{n.sub}</div>
                        </div>
                        {!readIds.has(n.id) && (
                          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: n.color, flexShrink: 0, marginTop: '5px' }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

      {/* REAL-TIME TOAST BANNER */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#1e293b',
          borderLeft: `4px solid ${toast.color || '#3b82f6'}`,
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          borderRadius: '8px',
          padding: '14px 16px',
          zIndex: 9999,
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          animation: 'slideIn 0.3s ease-out',
          maxWidth: '360px',
          border: '1px solid rgba(255,255,255,0.05)',
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: toast.bg || '#eff6ff',
            color: toast.color || '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            flexShrink: 0
          }}>
            🔔
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '700', fontSize: '12px', color: '#f8fafc', marginBottom: '2px' }}>{toast.title}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{toast.message}</div>
          </div>
          <button 
            onClick={() => setToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '18px',
              cursor: 'pointer',
              marginLeft: '8px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

    </>
  );
};

const EMPLOYEE_KEY = 'axara_learner_employee';

const SplashScreen = ({ onFinish }) => {
  useEffect(() => {
    const t = setTimeout(() => {
      onFinish();
    }, 3200);
    return () => clearTimeout(t);
  }, [onFinish]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#ffffff', zIndex: 999999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'splashFadeOut 0.8s cubic-bezier(0.4, 0, 0.2, 1) 2.5s forwards'
    }}>
      <div style={{
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'logoEntrance 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}>
        <img src="/myaxara-logo.svg" alt="myAxara LMS" style={{
          width: '240px', height: 'auto', display: 'block',
          filter: 'drop-shadow(0 12px 24px rgba(0, 45, 114, 0.15))'
        }} />
        <div style={{
          position: 'absolute', top: 0, left: '-150%', width: '100%', height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)',
          transform: 'skewX(-25deg)',
          animation: 'shimmer 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite'
        }} />
      </div>
      <style>{`
        @keyframes splashFadeOut { 
          0% { opacity: 1; visibility: visible; }
          100% { opacity: 0; transform: scale(1.05); visibility: hidden; } 
        }
        @keyframes logoEntrance {
          0% { transform: scale(0.85) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes shimmer {
          0% { left: '-150%'; }
          50% { left: '150%'; }
          100% { left: '150%'; }
        }
      `}</style>
    </div>
  );
};

function App() {
  const [authUser, setAuthUser] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(() => {
    try { return JSON.parse(localStorage.getItem(EMPLOYEE_KEY)); } catch { return null; }
  });
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user || null);
      setCheckingAuth(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user || null);
      if (!session) {
        localStorage.removeItem(EMPLOYEE_KEY);
        setSelectedEmployee(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (user) => setAuthUser(user);

  const handlePickEmployee = (emp) => {
    localStorage.setItem(EMPLOYEE_KEY, JSON.stringify(emp));
    setSelectedEmployee(emp);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(EMPLOYEE_KEY);
    setSelectedEmployee(null);
    setAuthUser(null);
  };

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      
      {checkingAuth ? (
        <div style={{ minHeight: '100vh', background: '#0b1628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#2f7bff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : !authUser ? (
        <LoginPage onLogin={handleLogin} />
      ) : !selectedEmployee ? (
        <EmployeePicker onPick={handlePickEmployee} onLogout={handleLogout} />
      ) : (
        <TenantProvider selectedEmployee={selectedEmployee}>
          <AppContent onLogout={handleLogout} />
        </TenantProvider>
      )}
    </>
  );
}

export default App;
