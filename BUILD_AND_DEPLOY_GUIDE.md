# 🚀 Guide Build & Deploy Noxtiz POS

## 📋 Prerequisites
- Node.js terinstall
- Akses ke server noxtiz.com
- FTP/SSH access ke folder `/updates/` di server

---

## 🔨 STEP 1: Build Aplikasi

### ⚠️ IMPORTANT: Fix Path Issue
Sebelum build, pastikan sudah fix path issue:
- ✅ `vite.config.ts` sudah set `base: './'` (relative paths)
- ✅ `electron/main.ts` sudah ada fallback path resolution
- ✅ Rebuild Electron: `npm run build:electron`

### 1.1 Build untuk Windows (PC)
```bash
npm run build:win
```

### 1.2 Build untuk Mac
```bash
npm run build:mac
```

### 1.3 Build untuk Linux
```bash
npm run build:linux
```

### 1.4 Build untuk Android (Tablet & HP)
**Note:** Electron tidak langsung support Android. Lihat `BUILD_PLATFORMS_GUIDE.md` untuk opsi (Capacitor/PWA).

### 1.5 Build untuk iOS (iPad & iPhone)
**Note:** Perlu Mac + Xcode. Lihat `BUILD_PLATFORMS_GUIDE.md`.

### 1.6 Build Semua Platform
```bash
npm run build:all
```

### 1.7 File yang dihasilkan
Setelah build selesai, file akan ada di folder `dist/`:
- **Windows:** `Noxtiz POS Setup 1.0.0.exe` (installer) + `Noxtiz POS 1.0.0.exe` (portable)
- **Mac:** `Noxtiz POS-1.0.0.dmg` + `Noxtiz POS-1.0.0-mac.zip`
- **Linux:** `Noxtiz POS-1.0.0.AppImage` + `.deb` + `.rpm`
- **Metadata:** `latest.yml` (untuk auto-update)

---

## 📦 STEP 2: Upload ke Server

### 2.1 Struktur Folder di Server
Di server `noxtiz.com`, buat struktur folder seperti ini:
```
/updates/
  ├── latest.yml
  ├── Noxtiz POS Setup 1.0.0.exe
  └── (file-file lainnya dari dist/)
```

### 2.2 Upload File
Upload semua file dari folder `dist/` ke:
```
https://noxtiz.com/updates/
```

**Cara Upload:**
1. **Via FTP:**
   - Connect ke server noxtiz.com
   - Navigate ke folder `/updates/` atau `/public_html/updates/`
   - Upload semua file dari `dist/`

2. **Via SSH/SCP:**
   ```bash
   scp -r dist/* user@noxtiz.com:/path/to/updates/
   ```

3. **Via cPanel File Manager:**
   - Login ke cPanel
   - Buka File Manager
   - Navigate ke folder `updates/`
   - Upload semua file

---

## ⚙️ STEP 3: Konfigurasi Server

### 3.1 Set Permission File
Pastikan file bisa diakses public:
```bash
chmod 644 latest.yml
chmod 755 "Noxtiz POS Setup 1.0.0.exe"
```

### 3.2 Set MIME Type (Opsional)
Jika server tidak serve `.yml` dengan benar, tambahkan di `.htaccess`:
```apache
<IfModule mod_mime.c>
  AddType application/x-yaml .yml
  AddType application/octet-stream .exe
</IfModule>
```

### 3.3 CORS Headers (Jika perlu)
Tambahkan di `.htaccess` untuk allow download:
```apache
<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
  Header set Access-Control-Allow-Methods "GET, OPTIONS"
</IfModule>
```

---

## 🔄 STEP 4: Update Version (Untuk Update Selanjutnya)

### 4.1 Update Version di package.json
```json
{
  "version": "1.0.1"  // Update version number
}
```

### 4.2 Rebuild
```bash
npm run build:win
```

### 4.3 Upload File Baru
- Upload `latest.yml` yang baru
- Upload installer baru (misal: `Noxtiz POS Setup 1.0.1.exe`)

**PENTING:** Jangan hapus installer versi lama, biarkan semua versi ada di server untuk rollback jika perlu.

---

## 📝 STEP 5: Testing Auto-Update

### 5.1 Install Versi Lama
Install aplikasi versi 1.0.0 di komputer test

### 5.2 Test Update
1. Buka aplikasi
2. Buka Settings
3. Klik "Cek Update Sekarang"
4. Aplikasi harus detect update baru
5. Download dan install update

### 5.3 Check Logs
Cek console Electron untuk melihat log update:
- Update available
- Download progress
- Update downloaded

---

## 🐛 Troubleshooting

### Problem: Aplikasi kosong setelah install (ERR_FILE_NOT_FOUND)
**Solusi:**
1. Pastikan `vite.config.ts` sudah set `base: './'`
2. Rebuild Electron: `npm run build:electron`
3. Rebuild aplikasi: `npm run build:win`
4. Test install di clean system
5. Check console (DevTools) untuk error detail

**Fix yang sudah dilakukan:**
- ✅ `vite.config.ts` - set `base: './'` untuk relative paths
- ✅ `electron/main.ts` - improved path resolution dengan fallback
- ✅ Asset paths menggunakan relative paths

### Problem: Update tidak terdeteksi
**Solusi:**
- Pastikan `latest.yml` bisa diakses via browser: `https://noxtiz.com/updates/latest.yml`
- Check format `latest.yml` sudah benar
- Pastikan version di `latest.yml` lebih tinggi dari versi aplikasi

### Problem: Download gagal
**Solusi:**
- Check permission file `.exe` (harus readable)
- Check CORS headers
- Pastikan file size tidak terlalu besar (consider CDN jika >100MB)

### Problem: Install gagal setelah download
**Solusi:**
- Check signature installer (jika ada)
- Pastikan user punya permission untuk install
- Check antivirus tidak block installer

---

## 📂 Struktur File di Server

```
noxtiz.com/
  └── updates/
      ├── latest.yml
      ├── Noxtiz POS Setup 1.0.0.exe
      ├── Noxtiz POS Setup 1.0.1.exe
      └── (versi-versi lainnya)
```

---

## 🔐 Security Tips

1. **HTTPS:** Pastikan server menggunakan HTTPS untuk update URL
2. **Signature:** Consider code signing untuk installer (opsional)
3. **Version Control:** Simpan semua versi installer untuk rollback
4. **Backup:** Backup `latest.yml` sebelum update

---

## 📞 Checklist Sebelum Deploy

- [ ] Version sudah di-update di `package.json`
- [ ] Build berhasil tanpa error
- [ ] File di `dist/` lengkap
- [ ] `latest.yml` bisa diakses via browser
- [ ] Installer bisa di-download
- [ ] Test update di aplikasi versi lama
- [ ] Backup versi sebelumnya

---

## 🎯 Quick Commands

```bash
# Build untuk Windows
npm run build:win

# Build semua platform
npm run build

# Check file di dist
ls -la dist/

# Test latest.yml
curl https://noxtiz.com/updates/latest.yml
```

---

## 📌 Notes

- **Version Format:** Gunakan semantic versioning (1.0.0, 1.0.1, 1.1.0, dll)
- **File Naming:** Electron-builder akan generate nama file otomatis
- **Update Frequency:** Auto-check setiap 1 jam, atau manual via Settings
- **Rollback:** Simpan semua versi installer untuk rollback jika perlu

---

**Selamat Deploy! 🚀**

