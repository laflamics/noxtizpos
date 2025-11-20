# Panduan Penggunaan Noxtiz Culinary Lab POS

Panduan lengkap untuk menggunakan sistem POS Noxtiz Culinary Lab.

## 📋 Daftar Isi

1. [Login & Setup Awal](#login--setup-awal)
2. [Dashboard](#dashboard)
3. [POS (Point of Sale)](#pos-point-of-sale)
4. [Produk](#produk)
5. [Inventory](#inventory)
6. [Pesanan](#pesanan)
7. [Meja](#meja)
8. [Users](#users)
9. [Settings](#settings)
10. [License](#license)
11. [Laporan](#laporan)

---

## 🔐 Login & Setup Awal

### Login

1. Buka aplikasi Noxtiz POS
2. Masukkan **email** Anda (bukan username)
3. Masukkan **password** jika diperlukan
4. Klik tombol **Masuk**

**Catatan**: Email harus unique untuk setiap user. Jika lupa password, hubungi admin.

### Setup Storage (Pertama Kali)

1. Pilih tipe storage:
   - **Local Storage**: Data disimpan lokal (tidak perlu internet)
   - **Server Online**: Data disimpan di cloud (perlu koneksi internet)
2. Jika pilih Server Online, masukkan:
   - Redis URL
   - Redis Token
3. Klik **Simpan**

---

## 📊 Dashboard

Dashboard menampilkan overview penjualan dan statistik:

- **Total Penjualan Hari Ini**: Total pendapatan hari ini
- **Total Pesanan**: Jumlah pesanan hari ini
- **Produk Stok Menipis**: Daftar produk yang stoknya kurang dari 10
- **Grafik Penjualan**: Grafik penjualan per hari
- **Top Produk**: Produk terlaris

---

## 🛒 POS (Point of Sale)

### Membuat Transaksi Baru

1. Pilih **meja** (jika menggunakan meja)
2. Klik produk yang ingin ditambahkan ke cart
3. Atur **quantity** jika perlu
4. Klik **Checkout** untuk proses pembayaran

### Checkout

1. Pilih **metode pembayaran**:
   - Cash
   - Transfer
   - QRIS
   - Kartu
2. Masukkan **jumlah bayar** (untuk Cash)
3. Klik **Bayar**
4. Receipt akan otomatis ter-print atau tersimpan

### Fitur POS

- **Search Produk**: Ketik nama produk di search bar
- **Filter Kategori**: Klik kategori untuk filter produk
- **Edit Quantity**: Klik produk di cart untuk edit quantity
- **Hapus Item**: Klik tombol X di cart untuk hapus item
- **Void Order**: Hapus pesanan (perlu PIN khusus)

---

## 📦 Produk

### Menambah Produk Baru

1. Klik tombol **Tambah Produk**
2. Isi form:
   - **Nama Produk**: Nama produk
   - **Harga**: Harga jual
   - **Kategori**: Pilih atau buat kategori baru
   - **Stok**: Jumlah stok awal
   - **Barcode**: (Opsional) Kode barcode
   - **Gambar**: Upload gambar produk
3. Klik **Simpan**

### Edit Produk

1. Klik produk yang ingin di-edit
2. Ubah data yang diperlukan
3. Klik **Simpan**

### Hapus Produk

1. Klik produk yang ingin di-hapus
2. Klik tombol **Hapus**
3. Konfirmasi penghapusan

### Kategori

- **Tambah Kategori**: Klik tombol **Tambah Kategori**
- **Edit Kategori**: Klik kategori untuk edit
- **Hapus Kategori**: Klik tombol hapus di kategori

---

## 📊 Inventory

### Stock Movement

1. Pilih **produk** yang ingin di-update stok
2. Pilih **tipe movement**:
   - **In**: Stok masuk (tambah)
   - **Out**: Stok keluar (kurang)
   - **Adjustment**: Penyesuaian stok
3. Masukkan **quantity**
4. Masukkan **keterangan** (opsional)
5. Klik **Simpan**

### Inventory Report

- Lihat **riwayat stock movement**
- Filter berdasarkan **periode**
- Export laporan (jika tersedia)

---

## 📋 Pesanan

### Melihat Pesanan

1. Klik menu **Pesanan**
2. Lihat daftar pesanan:
   - **Status**: Pending, Paid, Cancelled
   - **Tanggal**: Tanggal pesanan
   - **Total**: Total pembayaran
3. Klik pesanan untuk detail

### Filter Pesanan

- Filter berdasarkan **tanggal**
- Filter berdasarkan **status**
- Search berdasarkan **nomor pesanan**

---

## 🪑 Meja

### Mengelola Meja

1. Klik menu **Meja**
2. **Tambah Meja**: Klik tombol **Tambah Meja**
3. **Edit Meja**: Klik meja untuk edit
4. **Hapus Meja**: Klik tombol hapus

### Status Meja

- **Available**: Meja tersedia
- **Occupied**: Meja sedang digunakan
- **Reserved**: Meja di-reserve

---

## 👥 Users

**Hanya Admin yang bisa akses menu ini**

### Menambah User Baru

1. Klik tombol **Tambah User**
2. Isi form:
   - **Email**: Email user (harus unique)
   - **Username**: Username untuk login
   - **Password**: Password (opsional)
   - **Role**: Admin, Manager, atau Cashier
   - **Phone**: Nomor telepon (opsional)
3. Klik **Simpan**

### Edit User

1. Klik user yang ingin di-edit
2. Ubah data yang diperlukan
3. Klik **Simpan**

### Hapus User

1. Klik user yang ingin di-hapus
2. Klik tombol **Hapus**
3. Konfirmasi penghapusan

---

## ⚙️ Settings

### General Settings

- **Nama Perusahaan**: Nama outlet/restaurant
- **Currency**: Mata uang (default: IDR)
- **Tax Rate**: Pajak (default: 10%)

### Storage Settings

- **Storage Type**: Pilih Local atau Server Online
- **Redis URL**: (Jika Server Online)
- **Redis Token**: (Jika Server Online)

### Receipt Settings

- **Header**: Teks header untuk receipt
- **Footer**: Teks footer untuk receipt
- **Logo**: Upload logo untuk receipt

---

## 🔐 License

### Trial 7 Hari

Saat pertama kali registrasi atau login, Anda akan mendapatkan **trial 7 hari** secara otomatis. Selama masa trial, semua fitur POS dapat digunakan dengan lengkap.

**Catatan**: Trial aktif baik saat online maupun offline.

### Melihat Status License

1. Klik menu **Settings**
2. Scroll ke bagian **License**
3. Lihat informasi:
   - **Status**: Trial, Active, Expired, atau Revoked
   - **Type**: Trial, Weekly, Monthly, Yearly, atau Lifetime
   - **Expires At**: Tanggal kadaluarsa license
   - **Countdown**: Sisa waktu license (ditampilkan di header setiap halaman)

### Aktivasi License

Setelah trial habis, Anda perlu mengaktivasi license untuk melanjutkan penggunaan:

1. Klik menu **Settings**
2. Scroll ke bagian **License**
3. Masukkan **kode license** yang diberikan
4. Klik tombol **Aktifkan Lisensi**
5. Tunggu proses aktivasi selesai

**Catatan**: 
- Kode license akan dikirim setelah pembayaran
- Pastikan koneksi internet saat aktivasi
- License terikat ke perangkat yang digunakan

### Tipe License

- **Trial**: 7 hari gratis (otomatis aktif)
- **Weekly**: 1 minggu
- **Monthly**: 1 bulan
- **Yearly**: 1 tahun
- **Lifetime**: Selamanya (ditandai dengan badge bintang kuning ⭐)

### License Expired

Jika license sudah habis:

1. Popup license akan muncul otomatis
2. Popup **tidak bisa ditutup** sampai license diaktivasi
3. Masukkan kode license baru di popup
4. Klik **Aktifkan Lisensi**

### Membeli License

Untuk membeli license:

1. Hubungi **081311549824 (Panji)** via WhatsApp
2. Transfer ke **BCA a/n Panji: 0821112345**
3. Kirim bukti transfer via WhatsApp
4. Tunggu kode license dikirim

### Troubleshooting License

**License tidak terdeteksi:**
- Pastikan koneksi internet untuk sync
- Cek status license di Settings
- Restart aplikasi

**Trial tidak aktif:**
- Pastikan sudah registrasi/login pertama kali
- Cek koneksi internet (untuk sync ke server)
- Hubungi admin jika masalah berlanjut

**License expired padahal masih lama:**
- Cek tanggal sistem komputer/device
- Pastikan tanggal sudah benar
- Hubungi admin untuk verifikasi

---

## 📈 Laporan

### Closing Report

1. Klik menu **Laporan**
2. Pilih **periode** (hari, minggu, bulan)
3. Lihat laporan:
   - Total penjualan
   - Jumlah transaksi
   - Produk terlaris
   - Rincian per kategori

### Activity Logs

- Lihat **riwayat aktivitas** user
- Filter berdasarkan **user** atau **kategori**
- Lihat **detail aktivitas**

---

## ❓ Troubleshooting

### Tidak Bisa Login

- Pastikan email dan password benar
- Pastikan user masih aktif
- Hubungi admin jika masalah berlanjut

### Produk Tidak Muncul di POS

- Cek stok produk (harus > 0)
- Cek apakah produk masih aktif
- Refresh halaman POS

### License Expired

Lihat section [License](#-license) untuk panduan lengkap aktivasi license.

### Data Tidak Tersimpan

- Cek koneksi internet (jika pakai Server Online)
- Cek storage settings
- Hubungi admin jika masalah berlanjut

---

## 📞 Kontak Support

Jika ada pertanyaan atau masalah, hubungi:

- **Email**: support@noxtiz.com
- **WhatsApp**: 081311549824 (Panji)

---

**Noxtiz Culinary Lab POS** - Panduan Penggunaan v1.0

