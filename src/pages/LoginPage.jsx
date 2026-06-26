import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';

const mockSops = [
  { id: 1, title: 'SOP Proses Onboarding Klien Baru', dept: 'Sales', time: '8 Min', color: '#3b82f6', videoUrl: '/videos/onboarding-client.mp4' },
  { id: 2, title: 'SOP Standar Pelayanan Kasir', dept: 'Operations', time: '12 Min', color: '#10b981', videoUrl: '/videos/cashier-service.mp4' },
  { id: 3, title: 'SOP Penanganan Komplain Pelanggan', dept: 'Customer Care', time: '6 Min', color: '#f59e0b', videoUrl: '/videos/customer-complaint.mp4' },
  { id: 4, title: 'SOP Protokol Kesehatan & Keselamatan Kerja', dept: 'HRD & GA', time: '10 Min', color: '#ef4444', videoUrl: '/videos/workplace-safety.mp4' },
  { id: 5, title: 'SOP Manajemen Inventori Gudang', dept: 'Logistics', time: '15 Min', color: '#8b5cf6', videoUrl: '/videos/warehouse-inventory.mp4' },
];

export const LoginPage = ({ onLogin }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const [activeSopIdx, setActiveSopIdx] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const tiltContainerRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSopIdx(prev => (prev + 1) % mockSops.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleMouseMove = (e) => {
    const rect = tiltContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 15, y: -y * 15 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const getCardStyle = (idx) => {
    let diff = (idx - activeSopIdx + mockSops.length) % mockSops.length;

    if (diff === mockSops.length - 1) {
      return {
        position: 'absolute', width: '380px', padding: '24px', borderRadius: '20px', background: '#ffffff',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.06)', border: '1.5px solid #f1f5f9',
        transform: 'translate(-280px, -35px) rotate(-12deg) scale(0.9)', opacity: 0, zIndex: 10,
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)', pointerEvents: 'none', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: '16px'
      };
    }

    if (diff >= 3) {
      return {
        position: 'absolute', width: '380px', padding: '24px', borderRadius: '20px', background: '#ffffff',
        opacity: 0, transform: 'translate(40px, 40px) scale(0.8) rotate(6deg)', zIndex: 0,
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)', pointerEvents: 'none', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: '16px'
      };
    }

    const offsets = [
      {
        transform: diff === 0 && (tilt.x !== 0 || tilt.y !== 0)
          ? `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) scale(${isFocused ? 1.05 : 1.02})`
          : `perspective(1000px) rotate(-2deg) scale(${isFocused ? 1.03 : 1})`,
        zIndex: 5, opacity: 1
      },
      {
        transform: 'perspective(1000px) translate(14px, 18px) scale(0.95) rotate(2deg)',
        zIndex: 4, opacity: 0.9
      },
      {
        transform: 'perspective(1000px) translate(28px, 36px) scale(0.90) rotate(5deg)',
        zIndex: 3, opacity: 0.65
      }
    ];

    const config = offsets[diff];
    return {
      position: 'absolute',
      width: '380px',
      padding: '24px',
      borderRadius: '20px',
      background: '#ffffff',
      boxShadow: diff === 0 ? '0 25px 50px rgba(15, 23, 42, 0.08)' : '0 15px 35px rgba(15, 23, 42, 0.05)',
      border: '1.5px solid #f1f5f9',
      transform: config.transform,
      zIndex: config.zIndex,
      opacity: config.opacity,
      transition: tilt.x !== 0 || tilt.y !== 0 ? 'opacity 0.8s, transform 0.1s ease-out' : 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      pointerEvents: diff === 0 ? 'auto' : 'none',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    };
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Email dan password harus diisi.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      if (err) throw err;
      onLogin(data.user);
    } catch (err) {
      if (err.message?.includes('Invalid login credentials')) {
        setError('Email atau password tidak sesuai.');
      } else {
        setError(err.message || 'Gagal masuk. Periksa koneksi internet Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!form.email) { setError('Masukkan email terlebih dahulu.'); return; }
    setForgotLoading(true);
    setError('');
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (err) throw err;
      setForgotSuccess(true);
    } catch (err) {
      setError(err.message || 'Gagal mengirim email reset.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      position: 'relative',
      overflow: 'hidden',
      background: '#ffffff',
      display: 'flex',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: '100vh',
        background: '#ffffff',
        animation: 'fadeIn 0.6s ease-out',
        padding: '24px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '1.1fr 1fr',
          width: '100%',
          maxWidth: '1060px',
          margin: '0 auto',
          gap: '100px',
          alignItems: 'center',
        }}>
          {/* Left: Form */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            zIndex: 10,
          }}>
            <div style={{ width: '100%', maxWidth: '380px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.75px' }}>
                {forgotMode ? 'Reset Password' : 'Mulai Belajar Hari Ini'}
              </h1>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 32px 0', lineHeight: '1.5' }}>
                {forgotMode
                  ? 'Masukkan email perusahaan Anda untuk menerima link reset password.'
                  : 'Silakan masuk menggunakan akun karyawan yang terdaftar untuk mengakses modul pembelajaran Anda.'}
              </p>

              {forgotSuccess ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '16px' }}>📧</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Email Terkirim!</div>
                  <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', marginBottom: '24px' }}>
                    Link reset password sudah dikirim ke <strong>{form.email}</strong>. Cek inbox atau folder spam Anda.
                  </div>
                  <button
                    onClick={() => { setForgotSuccess(false); setForgotMode(false); setError(''); }}
                    style={{
                      width: '100%', padding: '14px', borderRadius: '8px',
                      background: '#002D72', color: '#ffffff', border: 'none', fontSize: '14px', fontWeight: '700',
                      cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,45,114,0.15)',
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = '#001A4E'; }}
                    onMouseOut={e => { e.currentTarget.style.background = '#002D72'; }}
                  >
                    Kembali ke Login
                  </button>
                </div>
              ) : forgotMode ? (
                <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="nama@perusahaan.com"
                      value={form.email}
                      onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setError(''); }}
                      autoComplete="email"
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: '10px',
                        border: error ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                        fontSize: '14px', color: '#0f172a', outline: 'none', background: '#ffffff',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                      }}
                      onFocus={e => { e.target.style.borderColor = '#002D72'; e.target.style.boxShadow = '0 0 0 3px rgba(0,45,114,0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = error ? '#ef4444' : '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>

                  {error && (
                    <div style={{
                      background: '#fef2f2', border: '1px solid #fecaca',
                      borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#dc2626',
                      display: 'flex', gap: '8px', alignItems: 'flex-start'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span style={{ color: '#dc2626' }}>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    style={{
                      width: '100%', padding: '14px', borderRadius: '8px',
                      background: forgotLoading ? '#94a3b8' : '#002D72',
                      color: '#ffffff', border: 'none', fontSize: '14px', fontWeight: '700',
                      cursor: forgotLoading ? 'not-allowed' : 'pointer',
                      boxShadow: forgotLoading ? 'none' : '0 4px 12px rgba(0,45,114,0.15)',
                      transition: 'transform 0.2s, background-color 0.2s',
                    }}
                    onMouseOver={e => { if (!forgotLoading) { e.currentTarget.style.background = '#001A4E'; } }}
                    onMouseOut={e => { if (!forgotLoading) { e.currentTarget.style.background = '#002D72'; } }}
                  >
                    {forgotLoading ? 'Mengirim...' : 'Kirim Link Reset Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setForgotMode(false); setError(''); }}
                    style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer', textAlign: 'center', marginTop: '4px' }}
                  >
                    Kembali ke Login
                  </button>
                </form>
              ) : (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="nama@perusahaan.com"
                    value={form.email}
                    onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setError(''); }}
                    autoComplete="email"
                    style={{
                      width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: '10px',
                      border: error ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                      fontSize: '14px', color: '#0f172a', outline: 'none', background: '#ffffff',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#002D72';
                      e.target.style.boxShadow = '0 0 0 3px rgba(0,45,114,0.1)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = error ? '#ef4444' : '#cbd5e1';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Password
                    </label>
                    <button type="button" onClick={() => { setForgotMode(true); setError(''); }} style={{ background: 'none', border: 'none', color: '#002D72', fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: 0 }}>
                      Lupa Password?
                    </button>
                  </div>
                  <div style={{ position: 'relative', marginTop: '8px' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan password"
                      value={form.password}
                      onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setError(''); }}
                      autoComplete="current-password"
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: '12px 44px 12px 16px', borderRadius: '10px',
                        border: error ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                        fontSize: '14px', color: '#0f172a', outline: 'none', background: '#ffffff',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = '#002D72';
                        e.target.style.boxShadow = '0 0 0 3px rgba(0,45,114,0.1)';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = error ? '#ef4444' : '#cbd5e1';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px'
                      }}
                    >
                      {showPassword
                        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>

                {error && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#dc2626',
                    display: 'flex', gap: '8px', alignItems: 'flex-start'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span style={{ color: '#dc2626' }}>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '8px',
                    background: loading ? '#94a3b8' : '#0B1628',
                    color: '#ffffff', border: 'none', fontSize: '14px', fontWeight: '700',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : '0 4px 12px rgba(0,0,0,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'transform 0.2s, background-color 0.2s',
                    marginTop: '6px',
                  }}
                  onMouseOver={e => { if (!loading) { e.currentTarget.style.background = '#2F7BFF'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                  onMouseOut={e => { if (!loading) { e.currentTarget.style.background = '#0B1628'; e.currentTarget.style.transform = 'translateY(0)'; } }}
                >
                  {loading ? (
                    <><span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Memverifikasi...</>
                  ) : (
                    <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>Masuk</>
                  )}
                </button>
              </form>
              )}
            </div>
          </div>

          {/* Right: 3D Interactive SOP Card Stack */}
          <div
            style={{
              display: window.innerWidth < 1024 ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#ffffff',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '24px',
              width: '100%',
              height: '500px',
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            ref={tiltContainerRef}
          >
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'radial-gradient(#e2e8f0 1.5px, transparent 0)',
              backgroundSize: '32px 32px',
              opacity: 0.5,
              zIndex: 1,
            }} />

            <div style={{
              position: 'absolute',
              width: '420px',
              height: '420px',
              borderRadius: '50%',
              border: '1.5px dashed #e2e8f0',
              bottom: '-100px',
              right: '-100px',
              opacity: 0.4,
              zIndex: 1,
              animation: 'rotate-ring-reverse 45s linear infinite',
            }} />

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
            }}>
              <div style={{
                position: 'relative',
                width: '440px',
                height: '380px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'bounce-subtle 6s ease-in-out infinite',
                transform: isFocused ? 'translateY(-12px) scale(1.02)' : 'translateY(0px)',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                {mockSops.map((sop, idx) => (
                  <div
                    key={idx}
                    style={getCardStyle(idx)}
                    onMouseEnter={() => setIsFocused(true)}
                    onMouseLeave={() => setIsFocused(false)}
                  >
                    <div style={{
                      width: '100%',
                      height: '180px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      position: 'relative',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                    }}>
                      <video
                        src={sop.videoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: sop.color, background: `${sop.color}15`, padding: '2px 8px', borderRadius: '20px' }}>
                          {sop.dept}
                        </span>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>▷ Video ⏱ {sop.time}</span>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', lineHeight: '1.4' }}>{sop.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.99); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes rotate-ring-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
