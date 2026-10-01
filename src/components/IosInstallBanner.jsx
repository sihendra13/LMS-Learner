import { useState } from 'react';

const DISMISS_KEY = 'axara_ios_install_dismissed_until';
const DISMISS_DAYS = 3;

const isIosSafari = () => {
  const ua = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(ua);
  const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  return isIos && !isStandalone;
};

const readJustSetPassword = () => {
  try { return sessionStorage.getItem('axara_just_set_password') === '1'; } catch { return false; }
};

const isDismissed = () => {
  try { return Number(localStorage.getItem(DISMISS_KEY) || 0) > Date.now(); } catch { return false; }
};

// Ajakan install di iPhone (Safari) setelah karyawan login. Di iPhone aplikasi Home Screen punya
// penyimpanan sendiri, jadi karyawan perlu masuk sekali lagi di aplikasi dengan email & password.
export const IosInstallBanner = ({ bottomOffset = 16 }) => {
  const [justSetPassword] = useState(readJustSetPassword);
  const [visible, setVisible] = useState(() => isIosSafari() && (readJustSetPassword() || !isDismissed()));
  if (!visible) return null;

  const handleClose = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 86400000));
      sessionStorage.removeItem('axara_just_set_password');
    } catch { /* storage diblokir */ }
    setVisible(false);
  };

  const steps = [
    <>Ketuk <strong style={{ color: '#fff' }}>•••</strong> di kanan bawah layar</>,
    <>Pilih <strong style={{ color: '#fff' }}>Share</strong></>,
    <>Pilih <strong style={{ color: '#fff' }}>Add to Home Screen</strong>, lalu <strong style={{ color: '#fff' }}>Add</strong></>,
  ];

  return (
    <div style={{
      position: 'fixed', left: '12px', right: '12px', bottom: `${bottomOffset}px`, zIndex: 9000,
      maxWidth: '440px', margin: '0 auto', background: '#0B1628', color: '#fff',
      borderRadius: '14px', padding: '14px 16px', boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700 }}>
          {justSetPassword ? 'Password tersimpan ✅ Install aplikasi:' : 'Install aplikasi myAxara:'}
        </div>
        <button onClick={handleClose} aria-label="Tutup" style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '18px', lineHeight: 1, cursor: 'pointer', padding: 0 }}>×</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px', color: '#cbd5e1' }}>
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#2F7BFF', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
            <span>{step}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '10px', lineHeight: 1.5 }}>
        Lalu buka myAxara dari Home Screen dan masuk dengan email & password Anda.
        <br />iPhone versi lama: langsung ketuk ikon Share di bawah layar.
      </div>
    </div>
  );
};
