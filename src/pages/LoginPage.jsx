import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';

const mockSops = [
  { id: 1, title: 'SOP Proses Onboarding Klien Baru', dept: 'Sales', time: '8 Min', color: '#3b82f6', videoUrl: '/videos/onboarding-client.mp4' },
  { id: 2, title: 'SOP Standar Pelayanan Kasir', dept: 'Operations', time: '12 Min', color: '#10b981', videoUrl: '/videos/cashier-service.mp4' },
  { id: 3, title: 'SOP Penanganan Komplain Pelanggan', dept: 'Customer Care', time: '6 Min', color: '#f59e0b', videoUrl: '/videos/customer-complaint.mp4' },
  { id: 4, title: 'SOP Protokol Kesehatan & Keselamatan Kerja', dept: 'K3 & Safety', time: '10 Min', color: '#ef4444', videoUrl: '/videos/workplace-safety.mp4' },
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

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isIosPromptVisible, setIsIosPromptVisible] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Detect iOS (Safari/Chrome on iOS)
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    // Detect if already installed (standalone)
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

    // Show prompt if iOS and not installed
    if (isIos() && !isStandalone) {
      setIsIosPromptVisible(true);
    }
  }, []);

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
          gridTemplateColumns: isMobile ? '1fr' : '1.1fr 1fr',
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
              {/* Mobile: Logo above card stack */}
              {isMobile && (
                <img src="/myaxara-logo.svg" alt="myAxara" style={{ maxWidth: '120px', height: 'auto', marginBottom: '56px' }} />
              )}

              {/* Mobile Card Stack */}
              {isMobile && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', height: '240px', marginBottom: '16px', overflow: 'visible',
                }}>
                  <div style={{
                    position: 'relative', width: '100%', maxWidth: '310px', height: '240px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'bounce-subtle 6s ease-in-out infinite',
                  }}>
                    {mockSops.map((sop, idx) => {
                      let diff = (idx - activeSopIdx + mockSops.length) % mockSops.length;
                      let mStyle;
                      if (diff === mockSops.length - 1) {
                        mStyle = { transform: 'translate(-200px, -20px) rotate(-12deg) scale(0.9)', zIndex: 10, opacity: 0 };
                      } else if (diff >= 3) {
                        mStyle = { transform: 'translate(30px, 30px) scale(0.8) rotate(6deg)', zIndex: 0, opacity: 0 };
                      } else {
                        const ms = [
                          { transform: 'rotate(-2deg) scale(1)', zIndex: 5, opacity: 1 },
                          { transform: 'translate(10px, 14px) scale(0.95) rotate(2deg)', zIndex: 4, opacity: 0.85 },
                          { transform: 'translate(20px, 28px) scale(0.90) rotate(4deg)', zIndex: 3, opacity: 0.6 },
                        ];
                        mStyle = ms[diff];
                      }
                      return (
                        <div key={idx} style={{
                          position: 'absolute', width: '280px', padding: '12px', borderRadius: '16px',
                          background: '#fff', boxShadow: diff === 0 ? '0 16px 40px rgba(15,23,42,0.07)' : '0 8px 20px rgba(15,23,42,0.04)',
                          border: '1px solid #eaecf0', display: 'flex', flexDirection: 'column', gap: '10px',
                          transform: mStyle.transform, zIndex: mStyle.zIndex, opacity: mStyle.opacity,
                          transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)', pointerEvents: 'none', boxSizing: 'border-box',
                        }}>
                          <div style={{
                            width: '100%', height: '140px', borderRadius: '10px', overflow: 'hidden',
                            background: '#f8f9fc', border: '1px solid #f2f4f7',
                          }}>
                            <video src={sop.videoUrl} autoPlay loop muted playsInline
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '10px', fontWeight: '700', color: sop.color, background: `${sop.color}15`, padding: '2px 8px', borderRadius: '20px' }}>{sop.dept}</span>
                            <span style={{ fontSize: '10px', color: '#98a2b3' }}>▷ Video ⏱ {sop.time}</span>
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#0c111d', lineHeight: '1.4' }}>{sop.title}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!isMobile && (
                <img src="/myaxara-logo.svg" alt="myAxara" style={{ maxWidth: '160px', height: 'auto', marginBottom: '24px' }} />
              )}
              <h1 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.75px' }}>
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
                        fontSize: '16px', color: '#0f172a', outline: 'none', background: '#ffffff',
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
                      fontSize: '16px', color: '#0f172a', outline: 'none', background: '#ffffff',
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
                        fontSize: '16px', color: '#0f172a', outline: 'none', background: '#ffffff',
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
              <div style={{ marginTop: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>Powered by myAxara</span>
                <span style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              </div>
            </div>
          </div>

          {/* Right: 3D Interactive SOP Card Stack */}
          <div
            style={{
              display: isMobile ? 'none' : 'flex',
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
                        <span style={{ fontSize: '10px', color: '#b0b8c4' }}>▷ Video ⏱ {sop.time}</span>
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

      {/* iOS Install Prompt */}
      {isIosPromptVisible && (
        <div style={{
          position: 'fixed', bottom: '20px', left: '20px', right: '20px',
          background: '#0B1628', border: '1px solid #1e293b', borderRadius: '16px',
          padding: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 100,
          animation: 'slideUp 0.5s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>Install myAxara LMS - Learning Dashboard</h4>
            <button onClick={() => setIsIosPromptVisible(false)} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#cbd5e1' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#e2e8f0', lineHeight: '1.5' }}>
            Install aplikasi ini di iPhone Anda: Tap <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" style={{ verticalAlign: 'middle', margin: '0 2px' }}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> (Share) di bawah, lalu pilih <strong style={{ color: '#ffffff' }}>"Add to Home Screen"</strong>.
          </p>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
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

export const InviteSetPasswordPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken) { setError('Link tidak valid.'); setLoading(false); return; }

    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken || '' })
      .then(({ data, error: err }) => {
        if (err || !data?.user) { setError('Link sudah expired atau tidak valid. Minta undangan baru.'); }
        else {
          setEmail(data.user.email || '');
          setName(data.user.user_metadata?.name || '');
        }
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password minimal 6 karakter.'); return; }
    if (password !== confirm) { setError('Password tidak sama.'); return; }
    setSaving(true); setError('');
    try {
      const { data, error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      window.history.replaceState(null, '', window.location.pathname);
      onLogin(data.user);
    } catch (err) {
      setError(err.message || 'Gagal menyimpan password.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#2f7bff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: '#fff', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0b1628', marginBottom: '6px' }}>Buat Password Anda</div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Selamat datang di myAxara! Buat password untuk mulai belajar.</div>
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#dc2626', marginBottom: '16px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>NAMA</label>
            <input value={name} readOnly style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: '#f8fafc', color: '#64748b', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>EMAIL</label>
            <input value={email} readOnly style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: '#f8fafc', color: '#64748b', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>PASSWORD BARU</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimal 6 karakter" style={{ width: '100%', padding: '12px 40px 12px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
              <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>KONFIRMASI PASSWORD</label>
            <input type={showPass ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Ulangi password" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <button type="submit" disabled={saving} style={{ width: '100%', padding: '14px', borderRadius: '8px', background: saving ? '#94a3b8' : '#0b1628', color: '#fff', border: 'none', fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', marginTop: '4px' }}>
            {saving ? 'Menyimpan...' : 'Simpan & Mulai Belajar →'}
          </button>
        </form>
      </div>
    </div>
  );
};
