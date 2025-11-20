# Quotation Noxtiz POS  
## Untuk: Mas Jeje / Warung Athena, Bali

---  

## 1. Paket Singkat (Harga Tetap)

| Paket | Harga | Maintenance |
|-------|-------|------------|
| Lifetime | Rp 13.000.000 sekali bayar | Gratis 3 tahun, lanjut Rp1.000.000/tahun |
| 3 Tahun | Rp 8.000.000 per 3 tahun | Gratis selama periode |
| Tahunan | Rp 5.000.000 per tahun | Gratis selama periode |

> Fokus kita bukan di angka, tapi di value dan spek di bawah. Paket tinggal disesuaikan sama ritme bisnis Mas Jeje.

---

## 2. Spek Teknis & Value Detail

### 2.1 Arsitektur & Infrastruktur
- **Offline-first engine**: data utama (produk, kategori, order, meja) jalan murni di IndexedDB/localStorage, aman kalau internet mati seharian.
- **Hybrid Cloud switch**: toggle 1 klik ke Upstash Redis / Supabase kalau butuh sinkron multi device.
- **Data Seed Tool**: CLI + UI buat populate produk/kategori/user dalam hitungan detik saat rollout outlet baru.
- **Activity Log terstruktur**: semua void/order/stock movement ditulis ke storage (siap kalau mau tarik ke BI).
- **Security**: PIN untuk void item & clear cart, support multi user role (kasir, supervisor, owner).

### 2.2 Modul Operasional POS
- **Kasir**: multi payment (cash, kartu, debit, QRIS, e-wallet), custom reference code, auto tax include/exclude/hide.
- **Cart per Meja**: tiap meja punya cart tersendiri, auto simpan ke localStorage, bisa switch meja tanpa hilang pesanan.
- **Status Meja**: Available / Occupied / Reserved / Cleaning dengan kontrol langsung dari POS.
- **Inventory Live**: reduce stock otomatis waktu checkout, catat movement masuk/keluar (terhubung ke modul gudang).
- **Order Lifecycle**: completed, on hold, void, reprint, share invoice (PDF/WhatsApp/email).

### 2.3 Android & Hardware
- **APK siap install**: sudah signed, include permission BLE, bluetooth classic, file provider, storage.
- **Printer Layer**:
  - Prioritas Bluetooth Low Energy (contoh: printer portable 58mm/80mm).
  - Fallback ke Bluetooth Classic Intent (printer kasir konvensional).
  - Opsi share file `.txt/.pdf` ke aplikasi printer pihak ketiga.
  - Auto detect device, urutan fallback: BLE → Classic → Share text → Share PDF.
- **Scanner & Peripheral**: support keyboard wedge barcode scanner, NFC/QR scanner via kamera device.

### 2.4 UI/UX & Interaksi
- **Layout Desktop & Tablet**: grid 3 kolom (meja, katalog, keranjang) dengan responsive breakpoints.
- **Motion & Feedback**: framer-motion untuk hover, tap, modal; user bisa kerasa beda kelas dibanding POS template.
- **Dark Neon Theme**: warna konsisten (accent hijau/toska), typography Inter variable, gradient heading.
- **Accessibility**: font scaling, tombol gede di device touch, kontras tinggi buat kondisi resto remang.

### 2.5 Integrasi & Ekosistem
- **Redis / REST Hooks**: siap dihubungin ke dashboard pusat kalau nanti mau multi outlet.
- **Export PDF & CSV**: invoice, laporan order, stock movement (bisa di-email langsung atau disimpan).
- **Webhook placeholder**: struktur siap buat trigger ke WA bot, akunting, atau ERP kalau dibutuhkan.
- **Electron Build Ready**: tinggal build untuk kasir desktop (Windows/Mac/Linux) kalau butuh.

### 2.6 Quality Assurance & Deployment
- **StorageTest Page**: UI internal buat test CRUD storage + stress test (mastiin data aman sebelum go-live).
- **CLI Regression (`npm run test:storage`)**: otomatis ngecek skenario stok/order sebelum update versi.
- **Versioned Release**: setiap patch dicatat (CHANGELOG) supaya gampang rollback kalau ada kendala.
- **Auto Backup Lokal**: snapshot cart per meja + settings ke localStorage/IndexedDB, bisa restore manual.

### 2.7 Operasional & Support
- **Maintenance Plan**:
  - Monitoring bug critical (printer, checkout, sync).
  - Patch minor & security update.
  - Remote support via WhatsApp/Zoom.
- **Onboarding Paket**:
  - Dokumentasi + video singkat.
  - Template SOP untuk kasir.
  - Checklist implementasi (hardware, koneksi, printer).
- **Training Opsional**: onsite/remote untuk kasir & supervisor.

---

## 3. Value vs POS Lain (Lebih Detail)

| Fitur / Value | Noxtiz POS | Majoo | Moka | Pawoon | Olsera | Qasir |
|---------------|-----------|-------|------|--------|--------|-------|
| Offline 100% (tanpa backend vendor) | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ |
| Switch ke cloud kapan aja | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Multi printer (BLE + Classic + Share) | ✅ | ⚠️ (hardware sendiri) | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| APK mandiri siap deploy | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ |
| Seed & Tools developer | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Automation QA bawaan | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Model harga lifetime | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Custom branding full | ✅ | ⚠️ add-on | ⚠️ | ⚠️ | ⚠️ | ⚠️ |

**Artinya:** Warung Athena dapat spek yang biasa cuma ada di POS enterprise (offline engine + BLE printer + QA + hybrid), tapi tanpa harus bayar subscription berat.

---

## 4. Deliverable per Paket

| Deliverable | Lifetime | 3 Tahun | Tahunan |
|-------------|----------|---------|---------|
| Core POS + modul meja + inventory | ✅ | ✅ | ✅ |
| APK Android + printer stack | ✅ | ✅ | ✅ |
| Hybrid cloud switch & Redis setup | ✅ | ✅ | ✅ |
| Dokumentasi + video onboarding | ✅ | ✅ | ✅ |
| Update fitur besar | ✅ (lifetime) | ✅ (selama kontrak) | ✅ (selama kontrak) |
| Maintenance onsite (opsional) | Add-on | Add-on | Add-on |

> Kalau ada request khusus (loyalty, kitchen display, payment gateway, integrasi ERP), kita siap breakdown scope tambahan.

---

## 5. Rekomendasi untuk Mas Jeje

1. **Fokus spek & stability jangka panjang** → ambil **Lifetime** biar nggak pusing renewal, maintenance ringan 1jt/tahun setelah 3 tahun.
2. **Mau uji jalan 3 tahun sambil scale** → **Paket 3 Tahun** cocok, value spek tetap sama.
3. **Butuh super fleksibel/tahunan** → **Paket Tahunan** (tetap full spek).

---

## 6. Next Step
- Align fitur tambahan khusus Warung Athena.
- Demo Online + uji printer di lokasi (bisa remote(masih bisa di lakukan dengan baik) atau onsite Bali(transport dan tempat tinggal tidak include)).
- Finalisasi kontrak + jadwal implementasi (±1 minggu ready live).

---

**Dokumen khusus untuk Mas Jeje / Warung Athena, Bali**  
**Terbit: 2025**
