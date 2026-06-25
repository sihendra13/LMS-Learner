import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import larisiLogo from '../assets/logo-larisi.svg';

const DEPT_COLORS = {
  Sales:       '#1e3a5f',
  HRD:         '#1a3d2b',
  Finance:     '#2d1a4a',
  IT:          '#2a1024',
  CS:          '#072a30',
  Operasional: '#3d2200',
};

const getColor = (dept) => DEPT_COLORS[dept] || '#1e3a5f';

const getInitials = (name) =>
  name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

export const EmployeePicker = ({ onPick, onLogout }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('employees').select('*').order('name').then(({ data }) => {
      if (data && data.length > 0) {
        setEmployees(data);
      } else {
        // Fallback default jika Supabase kosong
        setEmployees([
          { name: 'Rini Wulandari',  email: 'rini.w@majubersama.com',  dept: 'Sales',   city: 'Jakarta'  },
          { name: 'Budi Pratama',    email: 'budi.p@majubersama.com',  dept: 'Finance', city: 'Surabaya' },
          { name: 'Sari Anggraeni',  email: 'sari.a@majubersama.com',  dept: 'HRD',     city: 'Bandung'  },
          { name: 'Dika Kurniawan',  email: 'dika.k@majubersama.com',  dept: 'IT',      city: 'Jakarta'  },
          { name: 'Nina Putri',      email: 'nina.p@majubersama.com',  dept: 'CS',      city: 'Medan'    },
        ]);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0b1628 0%, #1a2d4a 50%, #0f2340 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '32px 20px', fontFamily: "'Inter', sans-serif",
    }}>
      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', borderRadius: '14px', padding: '10px 22px', marginBottom: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
          <img src={larisiLogo} alt="Logo" style={{ height: '28px', objectFit: 'contain' }} />
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
          Pilih Profil Karyawan
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', margin: 0 }}>
          Pilih nama Anda untuk melanjutkan ke portal pelatihan
        </p>
      </div>

      {/* EMPLOYEE CARDS */}
      {loading ? (
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '40px' }}>
          Memuat daftar karyawan...
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          width: '100%',
          maxWidth: '720px',
        }}>
          {employees.map((emp) => (
            <button
              key={emp.email}
              onClick={() => onPick(emp)}
              style={{
                background: '#ffffff',
                border: '2px solid transparent',
                borderRadius: '16px',
                padding: '24px 20px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = '#2f7bff';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(47,123,255,0.25)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
              }}
            >
              {/* AVATAR */}
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%',
                background: getColor(emp.dept),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
                fontSize: '20px', fontWeight: '800', color: '#ffffff',
                boxShadow: `0 4px 12px ${getColor(emp.dept)}40`,
              }}>
                {getInitials(emp.name)}
              </div>

              {/* NAME */}
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                {emp.name}
              </div>

              {/* DEPT BADGE */}
              <div style={{
                display: 'inline-block', fontSize: '11px', fontWeight: '600',
                color: getColor(emp.dept), background: `${getColor(emp.dept)}15`,
                padding: '3px 10px', borderRadius: '20px', marginBottom: '4px',
              }}>
                {emp.dept}
              </div>

              {emp.city && (
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  📍 {emp.city}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* LOGOUT */}
      <button
        onClick={onLogout}
        style={{
          marginTop: '32px', background: 'none', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '8px', padding: '9px 20px', color: 'rgba(255,255,255,0.45)',
          fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          transition: 'all 0.2s',
        }}
        onMouseOver={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Keluar dari akun
      </button>
    </div>
  );
};
