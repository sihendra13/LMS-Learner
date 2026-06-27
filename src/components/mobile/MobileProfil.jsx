import React from 'react';
import { useTenant } from '../../context/TenantContext';

const MobileProfil = ({ onLogout }) => {
  const { currentUser, quizSubmissions, passingScore } = useTenant();

  const completedCount = quizSubmissions.filter(
    s => s.employeeName === currentUser.name && s.postScore >= passingScore
  ).length;

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  return (
    <div style={{ padding: '16px 16px 30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* HEADER */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text1)', marginBottom: '4px' }}>Profil Saya</h2>
        <p style={{ color: 'var(--text3)', fontSize: '12px' }}>
          Informasi akun dan pencapaian individu Anda.
        </p>
      </div>

      {/* USER IDENTITY CARD */}
      <div className="card" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center' }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2F7BFF, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: '700',
          color: '#fff',
          boxShadow: '0 4px 10px rgba(47,123,255,0.15)'
        }}>
          {currentUser.avatar}
        </div>
        
        <div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text1)' }}>{currentUser.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>Divisi {currentUser.dept}</div>
        </div>

        {/* STATS BADGE ROW */}
        <div style={{ display: 'flex', width: '100%', borderTop: '1px solid var(--border)', paddingTop: '14px', marginTop: '6px', justifyContent: 'space-around' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--accent)' }}>{completedCount}</div>
            <div style={{ fontSize: '10px', color: 'var(--text3)' }}>SOP Selesai</div>
          </div>
          <div style={{ width: '1px', background: 'var(--border)' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--accent)' }}>{completedCount}</div>
            <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Sertifikat</div>
          </div>
          <div style={{ width: '1px', background: 'var(--border)' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--accent)' }}>{currentUser.streak}</div>
            <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Hari Streak</div>
          </div>
        </div>
      </div>

      {/* ACCOUNT DETAILS CARD */}
      <div className="card" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '4px' }}>Detail Karyawan</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingBottom: '6px', borderBottom: '1px solid var(--surface2)' }}>
          <span style={{ color: 'var(--text3)' }}>Nama Lengkap</span>
          <span style={{ fontWeight: '500', color: 'var(--text1)' }}>{currentUser.name}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingBottom: '6px', borderBottom: '1px solid var(--surface2)' }}>
          <span style={{ color: 'var(--text3)' }}>Departemen / Divisi</span>
          <span style={{ fontWeight: '500', color: 'var(--text1)' }}>{currentUser.dept}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: 'var(--text3)' }}>Peran Pengguna</span>
          <span style={{ fontWeight: '500', color: 'var(--text1)' }}>Karyawan (Learner)</span>
        </div>
      </div>

      {/* LOGOUT BUTTON */}
      <button
        onClick={handleLogout}
        style={{
          width: '100%',
          background: 'var(--navy)',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline-block' }}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Keluar Akun
      </button>

      {/* FOOTER */}
      <div style={{ textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text3)', marginTop: '10px' }}>
        myAxara LMS Platform · Versi Mobile
      </div>

    </div>
  );
};

export default MobileProfil;
