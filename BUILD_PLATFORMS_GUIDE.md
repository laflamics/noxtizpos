# 📱 Guide Build untuk Semua Platform - Noxtiz POS

> **⚠️ DEPRECATED:** Untuk build Desktop + Android, gunakan `BUILD_DESKTOP_ANDROID_GUIDE.md` sebagai referensi utama.

## 🎯 Platform yang Didukung

### ✅ Desktop
- **Windows** (PC) - `.exe` installer + portable
- **macOS** (Mac) - `.dmg` + `.zip`
- **Linux** - `.AppImage`, `.deb`, `.rpm`

### ⚠️ Mobile (Coming Soon)
- **Android** - `.apk` (perlu setup tambahan)
- **iOS** - `.ipa` (perlu Apple Developer Account)

---

## 🖥️ BUILD UNTUK WINDOWS (PC)

### Command:
```bash
npm run build:win
```

### Output:
- `dist/Noxtiz POS Setup 1.0.0.exe` - Installer
- `dist/Noxtiz POS 1.0.0.exe` - Portable version
- `dist/latest.yml` - Update metadata

### Upload ke Server:
```
noxtiz.com/updates/
  ├── latest.yml
  ├── Noxtiz POS Setup 1.0.0.exe
  └── Noxtiz POS 1.0.0.exe (portable)
```

---

## 🍎 BUILD UNTUK macOS (Mac)

### Command:
```bash
npm run build:mac
```

### Requirements:
- Harus build di Mac (atau use CI/CD)
- Code signing (opsional tapi recommended)

### Output:
- `dist/Noxtiz POS-1.0.0.dmg` - Disk image
- `dist/Noxtiz POS-1.0.0-mac.zip` - Zip archive

### Upload ke Server:
```
noxtiz.com/updates/
  ├── latest-mac.yml
  ├── Noxtiz POS-1.0.0.dmg
  └── Noxtiz POS-1.0.0-mac.zip
```

---

## 🐧 BUILD UNTUK LINUX

### Command:
```bash
npm run build:linux
```

### Output:
- `dist/Noxtiz POS-1.0.0.AppImage` - AppImage (universal)
- `dist/Noxtiz POS_1.0.0_amd64.deb` - Debian/Ubuntu
- `dist/Noxtiz POS-1.0.0.x86_64.rpm` - RedHat/Fedora

### Upload ke Server:
```
noxtiz.com/updates/
  ├── latest-linux.yml
  ├── Noxtiz POS-1.0.0.AppImage
  ├── Noxtiz POS_1.0.0_amd64.deb
  └── Noxtiz POS-1.0.0.x86_64.rpm
```

---

## 📱 BUILD UNTUK ANDROID (Tablet & HP)

### ⚠️ Catatan Penting:
Electron tidak langsung support Android. Ada beberapa opsi:

### Opsi 1: Capacitor (Recommended)
```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android

# Build web app dulu
npm run build:electron && vite build

# Add Android platform
npx cap add android

# Sync files
npx cap sync android

# Build APK
cd android
./gradlew assembleRelease
```

### Opsi 2: PWA (Progressive Web App)
- Build sebagai PWA
- Installable di Android via browser
- Tidak perlu build APK

### Opsi 3: React Native (Separate Project)
- Buat project React Native terpisah
- Share business logic dengan web app

---

## 🍎 BUILD UNTUK iOS (iPad & iPhone)

### Requirements:
- Mac dengan Xcode
- Apple Developer Account ($99/tahun)
- Code signing certificates

### Opsi 1: Capacitor
```bash
npm install @capacitor/ios

npx cap add ios
npx cap sync ios

# Open in Xcode
npx cap open ios
```

### Opsi 2: PWA
- Build sebagai PWA
- Installable via Safari "Add to Home Screen"

---

## 🚀 BUILD SEMUA PLATFORM SEKALIGUS

### Command:
```bash
npm run build:all
```

Ini akan build untuk:
- Windows
- macOS  
- Linux

**Note:** Build semua platform butuh waktu lama dan mungkin perlu setup environment untuk masing-masing OS.

---

## 📦 Struktur Folder di Server

```
noxtiz.com/updates/
  ├── windows/
  │   ├── latest.yml
  │   ├── Noxtiz POS Setup 1.0.0.exe
  │   └── Noxtiz POS 1.0.0.exe
  ├── mac/
  │   ├── latest-mac.yml
  │   ├── Noxtiz POS-1.0.0.dmg
  │   └── Noxtiz POS-1.0.0-mac.zip
  ├── linux/
  │   ├── latest-linux.yml
  │   ├── Noxtiz POS-1.0.0.AppImage
  │   ├── Noxtiz POS_1.0.0_amd64.deb
  │   └── Noxtiz POS-1.0.0.x86_64.rpm
  └── android/ (jika ada)
      └── app-release.apk
```

---

## 🔧 Fix Path Issue (CSS/JS Not Found)

### Problem:
Setelah install, aplikasi kosong dengan error `ERR_FILE_NOT_FOUND` untuk CSS/JS files.

### Solution:
1. ✅ Sudah fix di `vite.config.ts` - set `base: './'` untuk relative paths
2. ✅ Sudah fix di `electron/main.ts` - improved path resolution
3. ✅ Rebuild aplikasi:
   ```bash
   npm run build:win
   ```

### Test:
1. Install aplikasi yang baru di-build
2. Check console (DevTools) untuk error
3. Pastikan semua assets load dengan benar

---

## 📝 Checklist Build

### Windows:
- [ ] Build berhasil
- [ ] Installer bisa diinstall
- [ ] Aplikasi jalan dengan benar
- [ ] CSS/JS load dengan benar
- [ ] Auto-update berfungsi

### macOS:
- [ ] Build di Mac
- [ ] DMG bisa dibuka
- [ ] App bisa diinstall
- [ ] Gatekeeper tidak block

### Linux:
- [ ] AppImage executable
- [ ] DEB bisa diinstall
- [ ] RPM bisa diinstall

---

## 🐛 Troubleshooting

### Problem: CSS/JS files not found
**Fix:** 
- Pastikan `base: './'` di `vite.config.ts`
- Rebuild aplikasi
- Check path di `electron/main.ts`

### Problem: Build gagal untuk platform tertentu
**Fix:**
- Install dependencies untuk platform tersebut
- Check system requirements
- Use CI/CD untuk build cross-platform

### Problem: Auto-update tidak work
**Fix:**
- Pastikan `latest.yml` accessible
- Check URL di `package.json` build config
- Verify file permissions di server

---

## 💡 Tips

1. **Version Control:** Update version di `package.json` sebelum build
2. **Testing:** Test di clean system sebelum release
3. **Signing:** Code sign untuk production (recommended)
4. **Backup:** Simpan semua versi installer untuk rollback
5. **Documentation:** Update changelog setiap release

---

**Happy Building! 🚀**

