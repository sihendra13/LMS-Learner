import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import MobileBeranda from './MobileBeranda';
import MobileSOPSaya from './MobileSOPSaya';
import MobileSertifikat from './MobileSertifikat';
import MobileProfil from './MobileProfil';

const MobileLayout = ({ onSelectVideo }) => {
  const { 
    currentUser, 
    tenant, 
    videos, 
    quizSubmissions, 
    passingScore,
    notifications,
    readIds,
    markNotificationsAsRead
  } = useTenant();
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'sop' | 'certificates' | 'profile'
  const [showNotifSheet, setShowNotifSheet] = useState(false);

  // Calculate outstanding SOP count
  const outstandingCount = videos.filter(v => {
    if (v.dept !== currentUser.dept) return false;
    const sub = quizSubmissions.find(s => s.videoTitle === v.title && s.employeeName === currentUser.name);
    const passed = sub && sub.postScore >= passingScore;
    return v.progress < 100 || !passed;
  }).length;

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <MobileBeranda onSelectVideo={onSelectVideo} onNavigateToSOP={() => setActiveTab('sop')} />;
      case 'sop':
        return <MobileSOPSaya onSelectVideo={onSelectVideo} />;
      case 'certificates':
        return <MobileSertifikat />;
      case 'profile':
        return <MobileProfil />;
      default:
        return <MobileBeranda onSelectVideo={onSelectVideo} onNavigateToSOP={() => setActiveTab('sop')} />;
    }
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: 'var(--surface2)',
      color: 'var(--text1)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* MOBILE TOPBAR (Sticky at top) */}
      <header style={{
        position: 'sticky',
        top: 0,
        left: 0,
        width: '100%',
        height: '56px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        boxSizing: 'border-box',
        zIndex: 1100,
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {tenant.logo ? (
            <img src={tenant.logo} alt={tenant.name} style={{ height: '28px', maxWidth: '120px', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontWeight: '800', fontSize: '14px', color: 'var(--text1)' }}>{tenant.name}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="streak-pill" style={{ padding: '4px 10px', fontSize: '11px', margin: 0 }}>
            🔥 {currentUser.streak} Hari Streak
          </div>

          {/* MOBILE NOTIFICATION BELL */}
          <div
            onClick={() => {
              setShowNotifSheet(true);
              const unread = notifications.filter(n => !readIds.has(n.id)).map(n => n.id);
              if (unread.length > 0) markNotificationsAsRead(unread);
            }}
            style={{
              position: 'relative',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--surface2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text2)',
              cursor: 'pointer'
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: '18px', height: '18px' }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {notifications.filter(n => !readIds.has(n.id)).length > 0 && (
              <span style={{
                position: 'absolute', top: '-2px', right: '-2px',
                background: 'var(--red)', color: '#fff',
                fontSize: '8px', fontWeight: '800',
                minWidth: '13px', height: '13px',
                borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                lineHeight: 1, border: '1.5px solid var(--surface)'
              }}>
                {notifications.filter(n => !readIds.has(n.id)).length}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Content wrapper with padding-bottom to prevent fixed bottom navbar from overlaying the last element */}
      <main style={{
        flex: 1,
        width: '100%',
        boxSizing: 'border-box',
        paddingBottom: '80px'
      }}>
        {renderContent()}
      </main>

      {/* MOBILE BOTTOM NAVBAR (Fixed at bottom of mobile screen) */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '60px',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        boxSizing: 'border-box',
        zIndex: 1200,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
      }}>
        <button
          onClick={() => setActiveTab('home')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flex: 1,
            color: activeTab === 'home' ? 'var(--accent)' : 'var(--text3)',
            transition: 'color 0.15s'
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: '20px', height: '20px', color: activeTab === 'home' ? 'var(--accent)' : 'var(--text3)' }}>
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
          </svg>
          <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: activeTab === 'home' ? '600' : '400' }}>Beranda</span>
        </button>

        <button
          onClick={() => setActiveTab('sop')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flex: 1,
            color: activeTab === 'sop' ? 'var(--accent)' : 'var(--text3)',
            transition: 'color 0.15s',
            position: 'relative'
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: '20px', height: '20px', color: activeTab === 'sop' ? 'var(--accent)' : 'var(--text3)' }}>
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2"/>
          </svg>
          <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: activeTab === 'sop' ? '600' : '400' }}>SOP Saya</span>
          {outstandingCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '2px',
              right: '22%',
              background: 'var(--red)',
              color: '#fff',
              fontSize: '9px',
              fontWeight: '700',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {outstandingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flex: 1,
            color: activeTab === 'certificates' ? 'var(--accent)' : 'var(--text3)',
            transition: 'color 0.15s'
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: '20px', height: '20px', color: activeTab === 'certificates' ? 'var(--accent)' : 'var(--text3)' }}>
            <circle cx="12" cy="8" r="6"/>
            <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
          </svg>
          <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: activeTab === 'certificates' ? '600' : '400' }}>Sertifikat</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flex: 1,
            color: activeTab === 'profile' ? 'var(--accent)' : 'var(--text3)',
            transition: 'color 0.15s'
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: '20px', height: '20px', color: activeTab === 'profile' ? 'var(--accent)' : 'var(--text3)' }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: activeTab === 'profile' ? '600' : '400' }}>Profil</span>
        </button>
      </nav>

      {/* MOBILE BOTTOM SHEET FOR NOTIFICATIONS */}
      {showNotifSheet && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {/* Close trigger on tapping overlay area */}
          <div style={{ flex: 1 }} onClick={() => setShowNotifSheet(false)} />
          
          {/* Content container */}
          <div style={{
            background: 'var(--surface)',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            maxHeight: '75vh',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            boxSizing: 'border-box',
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}>
            {/* Sheet Handle bar */}
            <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '2px', margin: '12px auto', flexShrink: 0 }} />

            {/* Header */}
            <div style={{ padding: '0 20px 16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text1)' }}>Notifikasi</span>
              <button 
                onClick={() => setShowNotifSheet(false)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text3)', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold'
                }}
              >
                ×
              </button>
            </div>

            {/* Notification List */}
            <div style={{ overflowY: 'auto', padding: '8px 0', flex: 1 }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
                  Semua beres! Tidak ada notifikasi.
                </div>
              ) : notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => {
                    // Navigate on mobile
                    if (n.page === 'sertifikasi') {
                      setActiveTab('certificates');
                    } else {
                      setActiveTab('sop');
                    }
                    setShowNotifSheet(false);
                    markNotificationsAsRead([n.id]);
                  }}
                  style={{
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                    padding: '14px 20px',
                    borderBottom: '1px solid var(--border)',
                    background: readIds.has(n.id) ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                  }}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: n.bg, color: n.color, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0, fontSize: '15px'
                  }}>
                    {n.type === 'approved' ? '🎓' : n.type === 'remedial' ? '⚠️' : n.type === 'new-sop' ? '📚' : '⏰'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text1)', marginBottom: '2px', lineHeight: '1.4' }}>{n.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.4' }}>{n.message}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>{n.sub}</div>
                  </div>
                  {!readIds.has(n.id) && (
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: '5px' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default MobileLayout;
