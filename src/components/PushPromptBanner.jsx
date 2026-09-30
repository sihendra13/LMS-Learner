import { useState } from 'react';
import { useTenant } from '../context/TenantContext';

const DISMISS_KEY = 'axara_push_banner_dismissed_until';
const DISMISS_DAYS = 3;

const isDismissed = () => {
  try {
    return Number(localStorage.getItem(DISMISS_KEY) || 0) > Date.now();
  } catch {
    return false;
  }
};

// Banner ajakan mengaktifkan notifikasi — muncul otomatis setelah login jika notifikasi belum aktif.
// Dialog izin browser hanya boleh dipicu dari ketukan user, jadi banner menyediakan tombol "Izinkan".
export const PushPromptBanner = ({ bottomOffset = 16 }) => {
  const { pushStatus, pushError, enablePush } = useTenant();
  const [dismissed, setDismissed] = useState(isDismissed);

  const visible = !dismissed && (pushStatus === 'default' || pushStatus === 'error');
  if (!visible) return null;

  const handleLater = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 86400000)); } catch { /* storage diblokir */ }
    setDismissed(true);
  };

  return (
    <div style={{
      position: 'fixed', left: '12px', right: '12px', bottom: `${bottomOffset}px`, zIndex: 9000,
      maxWidth: '440px', margin: '0 auto', background: '#0B1628', color: '#fff',
      borderRadius: '14px', padding: '14px 16px', boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
      display: 'flex', flexDirection: 'column', gap: '10px',
    }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '20px', lineHeight: 1 }}>🔔</span>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>Aktifkan notifikasi?</div>
          <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
            {pushStatus === 'error'
              ? `Notifikasi belum berhasil diaktifkan (${pushError}). Coba lagi.`
              : 'Dapatkan pemberitahuan saat ada SOP baru, hasil kuis, dan sertifikat Anda terbit.'}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button onClick={handleLater} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #334155', background: 'transparent', color: '#cbd5e1', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          Nanti
        </button>
        <button onClick={enablePush} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#2F7BFF', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          Izinkan
        </button>
      </div>
    </div>
  );
};
