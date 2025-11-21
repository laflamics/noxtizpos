## Noxtiz POS Quotation

### Ringkasan Nilai

- **Offline-first + Redis Hybrid**: tetap jalan walau internet putus, bisa switch ke Upstash Redis kalau butuh sinkron cloud.
- **Android Native Ready**: build APK langsung, sudah lengkap izin Bluetooth, FileProvider, dan fallback PDF-print untuk device apa pun.
- **Printer Thermal Lengkap**: urutan BLE → Classic Intent → share file/text, jauh lebih fleksibel dari POS lain yang cuma dukung hardware tertentu.
- **Automation QA**: ada halaman StorageTest + CLI `npm run test:storage` buat regression check sebelum rilis.
- **Seed & Local Tools**: bisa bootstrap kategori/produk/user tanpa server, cocok buat demo cepat atau roll-out multi outlet.
- **UI Modern & Responsive**: sidebar collapsible, animasi framer-motion, layout desktop/tablet/mobile konsisten.

---

### Paket Harga

| Paket | Isi Utama | Harga Estimasi | Support |
|-------|-----------|----------------|---------|
| Core POS Offline | POS, Inventory, Orders, Tables, localStorage, seed UI, share/download receipt | Rp25–30 jt | Bugfix 1 bln |
| Pro Android & Thermal | Paket Core + APK Android, print BLE & Classic, native share, PDF fallback, CLI test suite, Redis optional | Rp45–55 jt | Bugfix 2 bln |
| Enterprise Hybrid Cloud | Paket Pro + Redis full switcher, custom role/permission, activity log lengkap, automation QA report, deploy assist (Play Store/Electron) | Rp75–90 jt | Bugfix 3 bln + 1 batch enhancement minor |

> *Harga opsional untuk maintenance bulanan: Rp3–5 jt/bln (patch, monitoring, prioritas support).*

---

### Pembanding POS Indonesia

| Produk | Kelebihan Mereka | Gap dibanding Noxtiz |
|--------|------------------|-----------------------|
| Majoo | Paket hardware lengkap & backoffice cloud | Tidak ada offline full, printer terbatas (harus device resmi), nggak ada CLI test/local seed |
| Moka (GoTo POS) | Ekosistem GoPay/QRIS, laporan finance cloud | Android share masih basic (email/WA), butuh koneksi terus, integrasi printer custom terbatas |
| Pawoon | Multi cabang, training luas | Subscription per outlet, tidak ada APK mandiri/offline seed, print thermal via hardware sendiri |
| Olsera | Fitur loyalty & ecommerce | Fokus cloud, belum ada fallback offline + CLI automation, printer support terbatas |
| Qasir | Simpel buat UMKM | Fitur advanced (Bluetooth classic, Redis, automation test) belum tersedia |

**Value Unique Noxtiz**

- Bisa dipakai 100% offline (localStorage) tapi switch ke Server Online kapan aja.
- Print thermal langsung dari Android (BLE atau Classic) tanpa hardware vendor tertentu.
- Share receipt native file/text, cocok ke app printer pihak ketiga.
- Tooling developer lengkap (seed data, CLI test) → roll-out cepat, regresi minim.
- UI/UX modern siap tablet, desktop, HP; sidebar toggle, animasi, dsb.

---

### Deliverable Tambahan (opsional)

- Dokumentasi teknis & video onboarding.
- Build Electron (Windows/Mac/Linux) untuk kasir desktop.
- Integrasi payment gateway lokal atau hardware scanner khusus.
- White-label branding (logo, warna, domain).

Silakan pilih paket sesuai kebutuhan klien; semua paket bisa dikustom lagi (harga akan menyesuaikan scope final). Untuk diskusi detail atau demo live, tinggal tentuin tanggal. 😉


