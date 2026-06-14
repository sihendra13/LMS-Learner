// Simulated Local Database using LocalStorage for LMS integration
const DB_KEY = 'axara_lms_db';

const defaultDatabase = {
  passingScore: 80,
  validityMonths: 12,
  currentUser: {
    id: 1,
    name: 'Rini Wulandari',
    role: 'employee',
    dept: 'Sales',
    city: 'Jakarta',
    avatar: 'RW',
    streak: 7
  },
  employees: [
    { id: 1, name: 'Rini Wulandari', dept: 'Sales', city: 'Jakarta', score: 18 },
    { id: 2, name: 'Budi Pratama', dept: 'Finance', city: 'Surabaya', score: 15 },
    { id: 3, name: 'Sari Anggraeni', dept: 'HRD', city: 'Bandung', score: 14 },
    { id: 4, name: 'Dika Kurniawan', dept: 'IT', city: 'Jakarta', score: 12 },
    { id: 5, name: 'Nina Putri', dept: 'CS', city: 'Medan', score: 11 },
  ],
  videos: [
    {
      id: 1,
      title: 'SOP Sales: Proses Onboarding Klien Baru',
      dept: 'Sales',
      duration: '8:24',
      progress: 100,
      views: 156,
      color: '#1e3a5f',
      tagClass: 'dt-sales',
      videoUrl: 'https://vgefsqwjhyiezmlsegsf.supabase.co/storage/v1/object/public/videos/TEs%20AI%20podcast.mp4',
      preQuizzes: [
        { id: 1, question: "Apa tahapan awal sebelum klien baru melakukan pembayaran?", options: ["Kirim NDA", "Kirim Invoice", "Kirim Proposal Kerja", "Telepon Perkenalan"], answer: "D" },
        { id: 2, question: "Apakah tim CS perlu dilibatkan saat serah terima berkas?", options: ["Ya, wajib", "Tidak perlu", "Hanya jika klien meminta", "Tergantung ukuran proyek"], answer: "A" }
      ],
      postQuizzes: [
        { id: 1, question: "Berapa lama batas maksimal respon pertama ke leads klien baru?", options: ["5 menit", "30 menit", "1 jam", "24 jam"], answer: "A" },
        { id: 2, question: "Dokumen apa yang wajib dikirimkan di tahap awal onboarding?", options: ["Formulir KYC", "Invoice Pembayaran", "Company Profile & NDA", "Sertifikat Kelulusan"], answer: "C" }
      ]
    },
    { 
      id: 2, 
      title: 'SOP HRD: Rekrutmen & Seleksi Karyawan', 
      dept: 'HRD', 
      duration: '12:10', 
      progress: 65, 
      views: 48, 
      color: '#1a3d2b', 
      tagClass: 'dt-hrd',
      preQuizzes: [
        { id: 1, question: "Siapa yang membuat kriteria lowongan kerja?", options: ["User / Departemen terkait", "HRD saja", "Direktur Utama", "Karyawan magang"], answer: "A" }
      ],
      postQuizzes: [
        { id: 1, question: "Di mana formulir evaluasi wawancara disimpan?", options: ["Google Drive Pribadi", "Sistem HRIS Terpusat", "Grup WhatsApp", "Fisik Kertas saja"], answer: "B" }
      ]
    },
    { 
      id: 3, 
      title: 'SOP Operasional: K3 Gudang & Logistik', 
      dept: 'Operasional', 
      duration: '15:30', 
      progress: 45, 
      views: 72, 
      color: '#3d2200', 
      tagClass: 'dt-ops',
      preQuizzes: [
        { id: 1, question: "Alat pelindung diri apa yang wajib dipakai di gudang?", options: ["Helm & Sepatu Safety", "Masker saja", "Sarung tangan biasa", "Tidak ada yang wajib"], answer: "A" }
      ],
      postQuizzes: [
        { id: 1, question: "Berapa tinggi tumpukan kardus maksimal di area loading dock?", options: ["2 meter", "3.5 meter", "5 meter", "Tidak terbatas"], answer: "A" }
      ]
    },
    { 
      id: 4, 
      title: 'SOP Finance: Proses Reimbursement Karyawan', 
      dept: 'Finance', 
      duration: '6:45', 
      progress: 100, 
      views: 93, 
      color: '#2d1a4a', 
      tagClass: 'dt-fin',
      preQuizzes: [
        { id: 1, question: "Apakah reimbursement bisa diklaim menggunakan kwitansi fotokopi?", options: ["Bisa", "Tidak bisa, wajib asli", "Bisa jika disetujui direktur", "Hanya jika kwitansi hilang"], answer: "B" }
      ],
      postQuizzes: [
        { id: 1, question: "Batas tanggal penyerahan kwitansi reimbursement setiap bulannya adalah...", options: ["Tanggal 5", "Tanggal 15", "Tanggal 25", "Akhir bulan"], answer: "C" }
      ]
    },
    { 
      id: 5, 
      title: 'SOP Customer Service: Handling Komplain', 
      dept: 'CS', 
      duration: '10:15', 
      progress: 0, 
      views: 38, 
      color: '#072a30', 
      tagClass: 'dt-cs', 
      preQuizzes: [
        { id: 1, question: "Apakah pelanggan yang komplain wajib langsung ditawarkan kompensasi uang?", options: ["Ya, agar cepat selesai", "Tidak, dengarkan dulu masalahnya", "Hanya jika nominalnya kecil", "Tergantung mood CS"], answer: "B" }
      ], 
      postQuizzes: [
        { id: 1, question: "Bagaimana langkah awal menangani pelanggan marah?", isEssay: true },
        { id: 2, question: "Apa batas waktu maksimal eskalasi tiket jika komplain tidak selesai di tingkat pertama?", isEssay: true }
      ] 
    },
    { 
      id: 6, 
      title: 'SOP IT: Keamanan Password & Akun', 
      dept: 'IT', 
      duration: '7:50', 
      progress: 33, 
      views: 112, 
      color: '#2a1024', 
      tagClass: 'dt-it', 
      preQuizzes: [], 
      postQuizzes: [] 
    },
  ],
  quizSubmissions: [
    { id: 1, employeeName: 'Rini Wulandari', videoTitle: 'SOP Sales: Proses Onboarding Klien Baru', preScore: 40, postScore: 100, date: '05 Jun 2026', status: 'Lulus', certStatus: 'pending' },
    { id: 2, employeeName: 'Budi Pratama', videoTitle: 'SOP Finance: Proses Reimbursement Karyawan', preScore: 50, postScore: 100, date: '06 Jun 2026', status: 'Lulus', certStatus: 'pending' },
    { id: 3, employeeName: 'Sari Anggraeni', videoTitle: 'SOP HRD: Rekrutmen & Seleksi Karyawan', preScore: 30, postScore: 90, date: '07 Jun 2026', status: 'Lulus', certStatus: 'pending' },
    { id: 4, employeeName: 'Dika Kurniawan', videoTitle: 'SOP IT: Keamanan Password & Akun', preScore: 60, postScore: 95, date: '08 Jun 2026', status: 'Lulus', certStatus: 'pending' },
    { id: 5, employeeName: 'Nina Putri', videoTitle: 'SOP Customer Service: Handling Komplain', preScore: 20, postScore: 60, date: '09 Jun 2026', status: 'Remedi (Butuh Ujian Ulang)', certStatus: 'pending' },
  ],
  pendingEssays: [
    { 
      id: 101, 
      employeeName: 'Budi Pratama', 
      dept: 'Finance', 
      videoTitle: 'SOP Finance: Proses Reimbursement Karyawan', 
      date: 'Hari ini',
      questions: [
        { id: 1, question: 'Mengapa kuitansi fotokopi tidak dapat diklaim?', answer: 'Kuitansi fotokopi tidak dapat diklaim karena regulasi perpajakan mewajibkan bukti fisik asli untuk diaudit, serta mencegah klaim ganda.', score: 85 },
        { id: 2, question: 'Apa batas maksimum tanggal penyerahan kwitansi reimbursement setiap bulannya?', answer: 'Klaim reimbursement harus diserahkan selambat-lambatnya tanggal 25 setiap bulannya kepada bagian tim finance.', score: 90 },
        { id: 3, question: 'Siapa yang berwenang memberikan persetujuan jika nominal reimburse di atas Rp 5.000.000?', answer: 'Untuk nominal di atas 5 juta rupiah, wajib mendapatkan persetujuan langsung (tanda tangan) dari Direktur Keuangan.', score: null }
      ]
    },
    { 
      id: 102, 
      employeeName: 'Nina Putri', 
      dept: 'CS', 
      videoTitle: 'SOP Customer Service: Handling Komplain', 
      date: '1 hari lalu',
      questions: [
        { id: 1, question: 'Bagaimana langkah awal menangani pelanggan marah?', answer: 'Pertama-tama saya akan mendengarkan keluhan dengan empati tanpa memotong pembicaraannya, lalu memvalidasi emosinya dan menawarkan maaf atas ketidaknyamanan tersebut.', score: null },
        { id: 2, question: 'Apa batas waktu maksimal eskalasi tiket jika komplain tidak selesai di tingkat pertama?', answer: 'Eskalasi tiket harus dilakukan dalam waktu maksimal 2 jam setelah komplain pertama kali diterima dari nasabah.', score: null }
      ]
    }
  ],
  activities: [
    { id: 1, text: '<strong>Rini W.</strong> menyelesaikan SOP Sales Onboarding', time: '5 menit lalu', type: 'green' },
    { id: 2, text: 'Video baru <strong>SOP IT Security</strong> diunggah', time: '32 menit lalu', type: 'blue' },
    { id: 3, text: '<strong>12 karyawan</strong> mendapat sertifikat Finance', time: '1 jam lalu', type: 'purple' },
    { id: 4, text: '<strong>SOP K3 Gudang</strong> deadline besok — 38 belum nonton', time: '2 jam lalu', type: 'amber' },
    { id: 5, text: '<strong>Dika K.</strong> lulus quiz SOP IT dengan skor 95', time: '3 jam lalu', type: 'cyan' },
  ]
};

export const getDB = () => {
  const db = localStorage.getItem(DB_KEY);
  if (!db) {
    localStorage.setItem(DB_KEY, JSON.stringify(defaultDatabase));
    return defaultDatabase;
  }
  try {
    return JSON.parse(db);
  } catch (e) {
    return defaultDatabase;
  }
};

export const saveDB = (data) => {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
};
