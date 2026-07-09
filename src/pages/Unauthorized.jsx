import React from 'react';
import larisiLogo from '../assets/logo-larisi.svg';

export const Unauthorized = ({ onLogout }) => {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'linear-gradient(135deg, #0b1628 0%, #1a2d4a 50%, #0f2340 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px', fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ textAlign: 'center', marginBottom: '32px', background: '#ffffff', borderRadius: '16px', padding: '40px 32px', maxWidth: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '12px', padding: '10px 22px', marginBottom: '24px' }}>
          <img src={larisiLogo} alt="Logo" style={{ height: '28px', objectFit: 'contain' }} />
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>
          Akses Ditolak
        </h1>
        <p style={{ color: '#475569', fontSize: '14px', margin: '0 0 24px 0', lineHeight: '1.5' }}>
          Profil Karyawan tidak ditemukan untuk email ini. Silakan hubungi Administrator untuk mendaftarkan email Anda.
        </p>
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            background: '#2f7bff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 20px',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.background = '#2563eb'}
          onMouseOut={e => e.currentTarget.style.background = '#2f7bff'}
        >
          Keluar
        </button>
      </div>
    </div>
  );
};
