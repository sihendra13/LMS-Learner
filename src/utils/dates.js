// Tanggal dari database bisa berupa ISO ("2026-10-01T01:07:15.604Z") atau teks Indonesia
// dari dashboard admin ("01 Okt 2026" / "1 Oktober 2026"). Fungsi ini membaca keduanya.
const MONTHS_ID = {
  jan: 0, januari: 0, feb: 1, februari: 1, mar: 2, maret: 2, apr: 3, april: 3,
  mei: 4, jun: 5, juni: 5, jul: 6, juli: 6, agu: 7, agt: 7, agustus: 7,
  sep: 8, september: 8, okt: 9, oktober: 9, nov: 10, november: 10, des: 11, desember: 11,
};

export const parseAnyDate = (value) => {
  if (!value) return null;
  const iso = new Date(value);
  if (!isNaN(iso.getTime()) && /\d{4}-\d{2}-\d{2}/.test(String(value))) return iso;
  const m = String(value).trim().match(/^(\d{1,2})\s+([A-Za-z]+)\.?\s+(\d{4})$/);
  if (m) {
    const month = MONTHS_ID[m[2].toLowerCase()];
    if (month !== undefined) return new Date(Number(m[3]), month, Number(m[1]));
  }
  return isNaN(iso.getTime()) ? null : iso;
};

// "1 Okt 2026, 08:07" (jam hanya jika tersedia)
export const formatDateTime = (value) => {
  const d = parseAnyDate(value);
  if (!d) return value || '-';
  const date = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const hasTime = /T\d{2}:\d{2}/.test(String(value));
  return hasTime ? `${date}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : date;
};

// "1 Oktober 2026"
export const formatDateLong = (value) => {
  const d = parseAnyDate(value);
  return d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : (value || '-');
};

// Tanggal kedaluwarsa sertifikat dari tanggal terbit + masa berlaku (bulan)
export const certExpiry = (issued, validityMonths) => {
  if (validityMonths === 999) return 'Selamanya';
  const d = parseAnyDate(issued);
  if (!d) return '-';
  const exp = new Date(d);
  exp.setMonth(exp.getMonth() + Number(validityMonths || 12));
  return exp.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

// Nomor sertifikat unik & tetap, dari id hasil kuis (UUID) — sama dengan yang tampil di admin
export const certificateId = (sub) => {
  const year = (parseAnyDate(sub.approvedDate || sub.date) || new Date()).getFullYear();
  const code = String(sub.id || '').replace(/-/g, '').slice(0, 8).toUpperCase();
  return `CERT-${year}-${code || '00000000'}`;
};
