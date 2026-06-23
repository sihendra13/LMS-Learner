# Handover Documentation - Pembaruan Desain Detail Modal & Progress Bar (Desktop & Mobile)

Dokumen ini ditujukan bagi agen kecerdasan buatan (AI coding agent) atau pengembang yang akan melanjutkan pengerjaan layout dan penyelarasan visual pada **LMS-Learner**.

---

## 1. Perubahan yang Telah Diimplementasikan (Desktop)

Seluruh perubahan visual berikut telah berhasil di-build, di-test, dan di-push ke branch `main`:

### A. Modal Detail Video (Popup Catatan & Remedial)
*   **File Target**: [Dashboard.jsx](file:///Users/kayuwangi/Desktop/Axara/LMS-Learner/src/pages/Dashboard.jsx) & [SOPManager.jsx](file:///Users/kayuwangi/Desktop/Axara/LMS-Learner/src/pages/SOPManager.jsx)
*   **Garis Pembatas Horizontal**: Ditambahkan di bawah area header/judul modal (`border-bottom: 1px solid #e2e8f0`).
*   **Penyelarasan Badge**: Badge status ("Sertifikat Aktif", "Perlu Remedial", dll.) diposisikan sejajar di sebelah kanan judul materi menggunakan layout `flex` (`flex-wrap: wrap`, `gap: 8px`).
*   **Garis Pembatas Vertikal Skor**: Menghilangkan background box abu-abu tebal pada pre-test & post-test, menggantikannya dengan susunan kolom bersandingan yang dipisahkan oleh garis vertikal (`width: 1px`, `height: 40px`, `background: #e2e8f0`).
*   **Desain Card Catatan**: Diubah menjadi sebuah box utuh yang memiliki header band abu-abu terang (`#f8fafc`) bertuliskan "Catatan Supervisor" / "Catatan HRD" dan isi pesannya berada di area latar putih di bawahnya.
*   **Box Catatan Ganda**: Jika terdapat catatan dari Supervisor sekaligus HRD, sistem akan menampilkan 2 box terpisah (Box SPV abu-abu, Box HRD hijau muda `#f0fdf4`).

### B. Progress Bar List Item SOP
*   **File Target**: [Dashboard.jsx](file:///Users/kayuwangi/Desktop/Axara/LMS-Learner/src/pages/Dashboard.jsx) & [SOPManager.jsx](file:///Users/kayuwangi/Desktop/Axara/LMS-Learner/src/pages/SOPManager.jsx)
*   **Penyelarasan Lebar**: Struktur `.sop-item` diubah menjadi vertical flex (`flex-direction: column`). Progress bar dipisahkan dari `.sop-info` dan diposisikan di baris bawah dengan `margin-left` dinamis (`86px` untuk Dashboard, `118px` untuk SOPManager) agar sejajar dengan posisi awal teks judul dan ujung kanannya memanjang selaras dengan ujung kanan badge status.
*   **Label Persentase**: Teks "menonton" dihapus dari label persentase progress bar pada halaman **SOP Saya** agar seragam dengan halaman **Beranda** (hanya menampilkan angka persentase, contoh: `100%`).

### C. Ikon KPI Card
*   **File Target**: [Dashboard.jsx](file:///Users/kayuwangi/Desktop/Axara/LMS-Learner/src/pages/Dashboard.jsx)
*   **Perubahan**: Ikon piala pada kartu KPI "Sertifikat aktif" diganti dengan ikon pita sertifikat (*ribbon icon*) agar seragam dengan ikon yang dipakai di dalam chip badge.

---

## 2. Rencana Kelanjutan untuk Versi Mobile

Komponen untuk tampilan seluler (mobile) terletak di direktori [src/components/mobile/](file:///Users/kayuwangi/Desktop/Axara/LMS-Learner/src/components/mobile/). Berikut adalah panduan langkah demi langkah untuk menyelaraskan tampilan mobile agar memiliki fitur visual yang serupa:

### A. Penyelarasan Progress Bar Mobile
*   **File Target**: [MobileBeranda.jsx](file:///Users/kayuwangi/Desktop/Axara/LMS-Learner/src/components/mobile/MobileBeranda.jsx) & [MobileSOPSaya.jsx](file:///Users/kayuwangi/Desktop/Axara/LMS-Learner/src/components/mobile/MobileSOPSaya.jsx)
*   **Tugas**: Periksa render list SOP di perangkat mobile. Pastikan progress bar ditarik melebar dan seragam, serta hilangkan teks kata "menonton" jika ada, sehingga hanya berupa persentase murni (misal: `85%`).

### B. Penyelarasan Detail Modal Mobile
*   **File Target**: [MobileSertifikat.jsx](file:///Users/kayuwangi/Desktop/Axara/LMS-Learner/src/components/mobile/MobileSertifikat.jsx)
*   **Tugas**:
    1.  Cari bagian render popup detail/remedial/sertifikat aktif pada mobile.
    2.  Terapkan **Garis Pembatas Horizontal** di bawah judul/badge.
    3.  Terapkan **Garis Pembatas Vertikal** di antara skor Pre-Test dan Post-Test (pastikan menggunakan layout flex bersih tanpa background box abu-abu tebal).
    4.  Sesuaikan style box catatan agar memiliki header band abu-abu terang (`#f8fafc`) dengan isi pesan berlatar putih seperti di versi desktop.

---

## 3. Catatan Pengembangan & Verifikasi
*   **Build Command**: Jalankan perintah `npm run build` setelah melakukan perubahan untuk memverifikasi kebersihan kompilasi Rolldown/Vite.
*   **Git Branch**: Selalu lakukan komit pada file kerja masing-masing dan lakukan push langsung ke `main` jika verifikasi lokal telah lulus.
