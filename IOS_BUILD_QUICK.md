# ⚡ Quick Guide: Build iOS TANPA Mac

## 🎯 Cara Paling Mudah: GitHub Actions

### Step 1: Push ke GitHub
```bash
git add .
git commit -m "Add iOS build"
git push
```

### Step 2: Buka GitHub Actions
1. Go to: `https://github.com/USERNAME/REPO/actions`
2. Pilih workflow **"Build iOS"**
3. Klik **"Run workflow"** > **"Run workflow"**

### Step 3: Download IPA
1. Tunggu build selesai (~5-10 menit)
2. Klik pada run yang selesai
3. Scroll ke bawah, klik **"ios-build"** artifact
4. Download file IPA

---

## 🚀 Alternatif: Cloud Build Services

### Codemagic (Recommended)
1. Sign up: https://codemagic.io
2. Connect GitHub repo
3. Setup iOS build config
4. Build otomatis atau manual

### Bitrise
1. Sign up: https://bitrise.io
2. Connect repo
3. Setup iOS workflow
4. Build

---

## 📱 Alternatif: PWA (Tanpa Build)

**Cara termudah** - tidak perlu build sama sekali!

1. Build web app: `npm run build`
2. Deploy ke server
3. User buka di Safari iPhone
4. Klik "Add to Home Screen"
5. App muncul seperti native app

**Keuntungan:**
- ✅ Tidak perlu build
- ✅ Tidak perlu App Store
- ✅ Update langsung
- ✅ Bisa di semua platform

---

## ⚠️ Catatan Penting

- **Build iOS native** memang butuh Mac/Xcode
- **TAPI** bisa pakai GitHub Actions (gratis untuk public repo)
- **Atau** pakai cloud build service
- **Atau** pakai PWA (tidak perlu build native)

---

## 🔧 Troubleshooting

### Error: "ios platform has not been added yet"
**Solusi:**
```bash
# Add iOS platform dulu
npx cap add ios

# Lalu sync
npx cap sync ios
```

### GitHub Actions gagal build
- Check apakah repo public (private butuh GitHub Pro)
- Check Apple Developer Account sudah setup
- Check signing certificates

---

## 📚 Dokumentasi Lengkap

Lihat `IOS_BUILD_GUIDE.md` untuk dokumentasi lengkap.

