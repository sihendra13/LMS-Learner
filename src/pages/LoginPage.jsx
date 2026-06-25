import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';

// Mock SOP list for Concept A
const mockSops = [
  { id: 1, title: 'Proses Onboarding Klien Baru', dept: 'Sales', time: '8 Min', color: '#3b82f6', bg: '#eff6ff', videoUrl: '/videos/classroom.mp4' },
  { id: 2, title: 'Standar Pelayanan Kasir', dept: 'Operations', time: '12 Min', color: '#10b981', bg: '#ecfdf5', videoUrl: '/videos/store-aisle.mp4' },
  { id: 3, title: 'SOP Penanganan Komplain Pelanggan', dept: 'Customer Care', time: '6 Min', color: '#f59e0b', bg: '#fffbeb', videoUrl: '/videos/driver-action.mp4' },
  { id: 4, title: 'Protokol Kesehatan & Keselamatan Kerja', dept: 'HRD & GA', time: '10 Min', color: '#ef4444', bg: '#fef2f2', videoUrl: '/videos/classroom.mp4' },
  { id: 5, title: 'Manajemen Inventori Gudang', dept: 'Logistics', time: '15 Min', color: '#8b5cf6', bg: '#f5f3ff', videoUrl: '/videos/store-aisle.mp4' },
];

export const LoginPage = ({ onLogin }) => {
  const [concept, setConcept] = useState('C'); // Default to C
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States for Concept A 3D interactive card stack
  const [activeSopIdx, setActiveSopIdx] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const tiltContainerRef = useRef(null);

  // Rotate Concept A card stack automatically
  useEffect(() => {
    if (concept !== 'A') return;
    const timer = setInterval(() => {
      setActiveSopIdx(prev => (prev + 1) % mockSops.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [concept]);

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
    
    // Swipe out card animation
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

  const [videoUrls, setVideoUrls] = useState([
    // Video 1: Classroom/Training environment
    '/videos/classroom.mp4',
    // Video 2: Store/Retail floor operation environment
    '/videos/store-aisle.mp4',
    // Video 3: Driving/Operator recognition environment
    '/videos/driver-action.mp4'
  ]);

  // Fetch actual uploaded SOP videos directly from Supabase to show as clips (if available)
  useEffect(() => {
    supabase
      .from('sop_videos')
      .select('video_url')
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const urls = data.map(v => v.video_url).filter(Boolean);
          if (urls.length > 0) {
            setVideoUrls(prev => {
              const next = [...urls, ...prev];
              return [...new Set(next)].slice(0, 3);
            });
          }
        }
      })
      .catch(() => {});
  }, []);

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
      {/* DESIGN CONCEPT SWITCHER (Floating top-right) */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '30px',
        padding: '5px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        zIndex: 10000,
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
      }}>
        <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase', marginRight: '4px' }}>Style:</span>
        {['A', 'B', 'C'].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => { setConcept(c); setError(''); }}
            style={{
              background: concept === c ? '#3b82f6' : 'transparent',
              border: 'none',
              color: concept === c ? '#ffffff' : '#64748b',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '800',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {c === 'A' ? 'A (Split Carousel)' : c === 'B' ? 'B (Glass Orbs)' : 'C (Fluid Gradient)'}
          </button>
        ))}
      </div>

      {/* -------------------- STYLE A: SPLIT SCREEN & INTERACTIVE CARD STACK -------------------- */}
      {concept === 'A' && (
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
            {/* Left: Clean Form Layout */}
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
                  Mulai Belajar Hari Ini
                </h1>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 32px 0', lineHeight: '1.5' }}>
                  Silakan masuk menggunakan akun karyawan yang terdaftar untuk mengakses modul pembelajaran Anda.
                </p>

                {/* Form Input Fields */}
                {renderLoginForm()}
              </div>
            </div>

            {/* Right: Premium 3D Interactive SOP Card Stack Deck (Like LMS Admin Login) */}
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
              {/* Fine Grid Background */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'radial-gradient(#e2e8f0 1.5px, transparent 0)',
                backgroundSize: '32px 32px',
                opacity: 0.5,
                zIndex: 1,
              }} />

              {/* Dash Circle Decor */}
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
                      {/* Video clip preview block at the top */}
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

                      {/* Info layout */}
                      <div>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '10px', fontWeight: '700', color: sop.color, background: `${sop.color}15`, padding: '2px 8px', borderRadius: '20px' }}>
                            {sop.dept}
                          </span>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>⏱ {sop.time}</span>
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
      )}

      {/* -------------------- STYLE B: GLASSMORPHISM & DYNAMIC VIDEOS -------------------- */}
      {concept === 'B' && (
        <div style={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          animation: 'fadeIn 0.6s ease-out',
          position: 'relative',
          background: '#ffffff'
        }}>
          {/* Morphing Video Orbs in Background (Fragments) */}
          <div style={{
            position: 'absolute', width: '280px', height: '280px',
            top: '15%', left: '15%',
            animation: 'orbitOrb1 20s linear infinite',
            overflow: 'hidden', pointerEvents: 'none',
            borderRadius: '50%',
            border: '2px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
          }}>
            <video src={videoUrls[0]} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(30%)' }} />
          </div>

          <div style={{
            position: 'absolute', width: '220px', height: '220px',
            bottom: '15%', right: '20%',
            animation: 'orbitOrb2 25s linear infinite',
            overflow: 'hidden', pointerEvents: 'none',
            borderRadius: '50%',
            border: '2px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
          }}>
            <video src={videoUrls[1]} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(30%)' }} />
          </div>

          {/* Form Container */}
          <div style={{
            width: '100%',
            maxWidth: '420px',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid #e2e8f0',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.05)',
            zIndex: 10,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>Portal LMS Learner</h2>
              <p style={{ color: '#64748b', fontSize: '12px', margin: 0, textAlign: 'center' }}>Masuk untuk melanjutkan pembelajaran</p>
            </div>

            {renderLoginForm()}
          </div>
        </div>
      )}

      {/* -------------------- STYLE C: MORPHING FLUID GRADIENT WAVE WITH VIDEO CLIPS -------------------- */}
      {concept === 'C' && (
        <div style={{ display: 'flex', width: '100%', minHeight: '100vh', animation: 'fadeIn 0.6s ease-out' }}>
          {/* Left: Minimal Clean White Layout */}
          <div style={{
            flex: '1',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px 24px',
            background: '#ffffff',
            zIndex: 10,
          }}>
            <div style={{ width: '100%', maxWidth: '380px' }}>
              {/* Form Card Header (Clean: No Logo/No Target emoji) */}
              <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.75px' }}>
                Mulai Belajar Hari Ini
              </h1>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 32px 0', lineHeight: '1.5' }}>
                Gunakan email dan password perusahaan Anda untuk mengakses materi SOP dan pengerjaan kuis.
              </p>

              {/* Form Input Fields */}
              {renderLoginForm()}
            </div>
          </div>

          {/* Right: Morphing Fluid Video Fragments Banner (Clean White Background) */}
          <div style={{
            flex: '1.2',
            background: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
            display: window.innerWidth < 1024 ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            borderLeft: '1px solid #f1f5f9',
          }}>
            {/* Fine Grid Background */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'radial-gradient(#e2e8f0 1.5px, transparent 0)',
              backgroundSize: '32px 32px',
              opacity: 0.4
            }} />

            {/* Layout containing morphing video fragments/clips */}
            <div style={{ position: 'relative', width: '100%', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              
              {/* Main big morphing video shape */}
              <div style={{
                width: '360px',
                height: '360px',
                borderRadius: '50%',
                animation: 'morphFluid 12s ease-in-out infinite alternate',
                boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
                position: 'relative',
                overflow: 'hidden',
                border: '3px solid #f1f5f9',
                zIndex: 2,
              }}>
                <video 
                  src={videoUrls[0]} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>

            </div>

            {/* Sub-label overlay */}
            <div style={{
              position: 'absolute',
              bottom: '40px',
              left: '40px',
              right: '40px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>Belajar Mudah & Terukur</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Kuasai SOP perusahaan dengan visual interaktif dan instan.</div>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL REUSABLE KEYFRAME STYLES */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.99); }
          to { opacity: 1; transform: scale(1); }
        }

        /* 3D bounce & ring rotation animations */
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes rotate-ring-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        /* Rotating orbs background shapes */
        @keyframes orbitOrb1 {
          0% { transform: translate(0, 0) rotate(0deg); border-radius: 40% 60% 60% 40% / 40% 40% 60% 60%; }
          50% { transform: translate(40px, 30px) rotate(180deg); border-radius: 60% 40% 40% 60% / 60% 60% 40% 40%; }
          100% { transform: translate(0, 0) rotate(360deg); border-radius: 40% 60% 60% 40% / 40% 40% 60% 60%; }
        }
        @keyframes orbitOrb2 {
          0% { transform: translate(0, 0) rotate(0deg); border-radius: 50% 50% 30% 70% / 50% 60% 40% 50%; }
          50% { transform: translate(-30px, -40px) rotate(-180deg); border-radius: 30% 70% 70% 30% / 60% 40% 60% 40%; }
          100% { transform: translate(0, 0) rotate(-360deg); border-radius: 50% 50% 30% 70% / 50% 60% 40% 50%; }
        }

        /* Morphing organic shapes */
        @keyframes morphFluid {
          0% {
            border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%;
          }
          33% {
            border-radius: 70% 30% 52% 48% / 60% 40% 60% 40%;
          }
          66% {
            border-radius: 28% 72% 35% 65% / 35% 60% 40% 65%;
          }
          100% {
            border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%;
          }
        }

        @keyframes morphFluidSecondary {
          0% {
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          }
          50% {
            border-radius: 30% 70% 60% 40% / 40% 60% 40% 60%;
          }
          100% {
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  // Reusable login form renderer
  function renderLoginForm() {
    return (
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
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
            }}
            onBlur={e => {
              e.target.style.borderColor = error ? '#ef4444' : '#cbd5e1';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
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
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
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
            width: '100%', padding: '13px', borderRadius: '10px',
            background: loading ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: '#ffffff', border: 'none', fontSize: '14px', fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 14px rgba(59,130,246,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseOver={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseOut={e => { if (!loading) e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          {loading ? (
            <><span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Memverifikasi...</>
          ) : (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>Masuk</>
          )}
        </button>
      </form>
    );
  }
};
