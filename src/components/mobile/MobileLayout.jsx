import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import MobileBeranda from './MobileBeranda';
import MobileSOPSaya from './MobileSOPSaya';
import MobileSertifikat from './MobileSertifikat';
import MobileProfil from './MobileProfil';
import '../../mobile.css';

const MobileLayout = ({ onSelectVideo, onOpenSync }) => {
  const { currentUser, tenant, videos, quizSubmissions, passingScore } = useTenant();
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'sop' | 'certificates' | 'profile'
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  // Monitor resize events to accurately track simulated device viewport heights
  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        return <MobileSertifikat onOpenSync={onOpenSync} />;
      case 'profile':
        return <MobileProfil />;
      default:
        return <MobileBeranda onSelectVideo={onSelectVideo} onNavigateToSOP={() => setActiveTab('sop')} />;
    }
  };

  return (
    <div style={{
      width: '100%',
      height: `${viewportHeight}px`,
      background: 'var(--surface2)',
      color: 'var(--text1)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Inject mobile-only CSS overrides to align browser viewport container */}
      <style>{`
        html, body, #root {
          height: 100vh !important;
          min-height: 100vh !important;
          overflow: hidden !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      `}</style>

      {/* MOBILE TOPBAR */}
      <header style={{
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
            🔥 {currentUser.streak} Hari
          </div>
          <button 
            className="btn-sync" 
            onClick={onOpenSync}
            style={{ padding: '4px 8px', fontSize: '10px' }}
          >
            🔄 Sync
          </button>
        </div>
      </header>

      {/* Scrollable Content Container */}
      <main style={{
        flex: 1,
        width: '100%',
        boxSizing: 'border-box',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        {renderContent()}
      </main>

      {/* MOBILE BOTTOM NAVBAR */}
      <nav style={{
        height: '60px',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        boxSizing: 'border-box',
        zIndex: 1100,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
        flexShrink: 0
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
          <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${activeTab === 'home' ? 1 : 0}`, fontSize: '22px' }}>home</span>
          <span style={{ fontSize: '10px', marginTop: '2px', fontWeight: activeTab === 'home' ? '600' : '400' }}>Beranda</span>
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
          <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${activeTab === 'sop' ? 1 : 0}`, fontSize: '22px' }}>assignment</span>
          <span style={{ fontSize: '10px', marginTop: '2px', fontWeight: activeTab === 'sop' ? '600' : '400' }}>SOP Saya</span>
          {outstandingCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '2px',
              right: '18%',
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
          <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${activeTab === 'certificates' ? 1 : 0}`, fontSize: '22px' }}>verified</span>
          <span style={{ fontSize: '10px', marginTop: '2px', fontWeight: activeTab === 'certificates' ? '600' : '400' }}>Sertifikat</span>
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
          <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${activeTab === 'profile' ? 1 : 0}`, fontSize: '22px' }}>person</span>
          <span style={{ fontSize: '10px', marginTop: '2px', fontWeight: activeTab === 'profile' ? '600' : '400' }}>Profil</span>
        </button>
      </nav>
    </div>
  );
};

export default MobileLayout;
