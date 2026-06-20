import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import MobileBeranda from './MobileBeranda';
import MobileSOPSaya from './MobileSOPSaya';
import MobileSertifikat from './MobileSertifikat';
import MobileProfil from './MobileProfil';

const MobileLayout = ({ onSelectVideo }) => {
  const { currentUser, tenant, videos, quizSubmissions, passingScore } = useTenant();
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'sop' | 'certificates' | 'profile'

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="streak-pill" style={{ padding: '4px 10px', fontSize: '11px', margin: 0 }}>
            🔥 {currentUser.streak} Hari Streak
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
    </div>
  );
};

export default MobileLayout;
