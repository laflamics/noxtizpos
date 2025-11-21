# 🍎 Guide Build iOS/iPhone - Noxtiz POS

## ⚠️ PENTING: Build iOS Butuh Mac/Xcode!

Build untuk iOS/iPhone **HARUS** pakai **Xcode** yang cuma jalan di **macOS**. 

**TAPI**, kamu bisa build iOS **tanpa punya Mac** pakai:
- ✅ **GitHub Actions** (gratis untuk public repo) - **RECOMMENDED!**
- ✅ **Cloud Build Services** (Codemagic, Bitrise, dll)
- ✅ **PWA** (alternatif tanpa build native)

### Requirements (Jika Build di Mac Lokal):
- ✅ **Mac** (macOS 10.15 atau lebih baru)
- ✅ **Xcode** (install dari App Store, minimal versi 12.0)
- ✅ **Apple Developer Account** ($99/tahun) - untuk publish ke App Store
- ✅ **CocoaPods** (akan auto-install saat setup iOS)

---

## 🚀 Build iOS TANPA Mac (Recommended!)

### Opsi 1: GitHub Actions (GRATIS untuk Public Repo!)

**Cara paling mudah** - build iOS otomatis di cloud pakai GitHub Actions Mac runner.

#### Setup:

1. **Push code ke GitHub** (jika belum)
   ```bash
   git add .
   git commit -m "Add iOS build support"
   git push
   ```

2. **Buka GitHub Actions**
   - Go to: `https://github.com/USERNAME/REPO/actions`
   - Pilih workflow **"Build iOS"**
   - Klik **"Run workflow"** > **"Run workflow"**

3. **Tunggu build selesai**
   - Build akan jalan di Mac runner GitHub
   - Download artifacts dari Actions page

#### File Workflow:
Workflow sudah ada di `.github/workflows/build-ios.yml`

#### Keuntungan:
- ✅ **Gratis** untuk public repo
- ✅ Tidak perlu Mac
- ✅ Otomatis build setiap push
- ✅ Download IPA langsung dari GitHub

#### Kekurangan:
- ❌ Private repo butuh GitHub Pro ($4/bulan)
- ❌ Butuh Apple Developer Account untuk sign IPA

---

### Opsi 2: Cloud Build Services

#### Codemagic (Free tier tersedia):
1. Sign up di [codemagic.io](https://codemagic.io)
2. Connect GitHub repo
3. Setup iOS build config
4. Build otomatis atau manual

#### Bitrise (Free tier tersedia):
1. Sign up di [bitrise.io](https://bitrise.io)
2. Connect repo
3. Setup iOS workflow
4. Build

#### AppCircle (Free tier tersedia):
1. Sign up di [appcircle.io](https://appcircle.io)
2. Connect repo
3. Setup iOS build

---

### Opsi 3: PWA (Progressive Web App)

**Alternatif tanpa build native** - app bisa diinstall di iPhone via Safari.

#### Setup PWA:
1. Tambahkan `manifest.json` dan service worker
2. User buka di Safari iPhone
3. Klik "Add to Home Screen"
4. App muncul seperti native app

#### Keuntungan:
- ✅ Tidak perlu build
- ✅ Tidak perlu App Store review
- ✅ Update langsung tanpa App Store
- ✅ Bisa jalan di semua platform

#### Kekurangan:
- ❌ Tidak bisa akses semua native features
- ❌ Tidak ada di App Store
- ❌ User harus manual install

---

## 🖥️ Setup iOS di Mac Lokal (Jika Punya Mac)

### Step 1: Install Dependencies

Di Mac, buka terminal dan install dependencies:

```bash
npm install
```

Ini akan install `@capacitor/ios` yang sudah ada di `package.json`.

### Step 2: Build Web App

Build web app dulu sebelum sync ke iOS:

```bash
npm run build:electron
npm run build
```

Atau langsung:

```bash
npm run build:electron && vite build
```

### Step 3: Add iOS Platform

Jika folder `ios/` belum ada, tambahkan platform iOS:

```bash
npx cap add ios
```

> **Note:** Jika error "ios platform already exists", berarti sudah ada. Skip step ini.

### Step 4: Sync ke iOS

Sync file web app ke project iOS:

```bash
npx cap sync ios
```

Ini akan:
- Copy file dari `dist/` ke `ios/App/`
- Update native dependencies
- Install CocoaPods (jika belum)

### Step 5: Open di Xcode

Buka project di Xcode:

```bash
npx cap open ios
```

Atau manual:
```bash
open ios/App/App.xcworkspace
```

> **PENTING:** Buka `.xcworkspace`, bukan `.xcodeproj`!

---

## 📱 Build iOS App

### Opsi 1: Build via Xcode (Recommended)

1. Buka Xcode: `npx cap open ios`
2. Pilih device/simulator di toolbar atas
3. Klik **Product > Build** (⌘B) untuk build saja
4. Atau klik **Play button** (▶️) untuk build + run di simulator/device

### Opsi 2: Build via Command Line

#### Build untuk Simulator:
```bash
cd ios/App
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  build
```

#### Build untuk Device (Release):
```bash
cd ios/App
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -sdk iphoneos \
  -archivePath build/App.xcarchive \
  archive
```

### Opsi 3: Build IPA untuk Distribution

1. Di Xcode: **Product > Archive**
2. Setelah archive selesai, window **Organizer** akan muncul
3. Pilih archive yang baru dibuat
4. Klik **Distribute App**
5. Pilih metode distribution:
   - **App Store Connect** - untuk upload ke App Store
   - **Ad Hoc** - untuk testing di device tertentu
   - **Enterprise** - untuk enterprise distribution
   - **Development** - untuk development/testing

---

## 🔧 Script Build iOS

### Quick Build (Sync + Open Xcode):

```bash
npm run build:ios
npx cap open ios
```

### Manual Steps:

```bash
# 1. Build web app
npm run build:electron && vite build

# 2. Sync ke iOS
npx cap sync ios

# 3. Open Xcode
npx cap open ios
```

---

## 📦 Output Build iOS

Setelah build, file ada di:

- **Simulator:** `ios/App/build/Debug-iphonesimulator/App.app`
- **Device (Archive):** `ios/App/build/App.xcarchive`
- **IPA:** Setelah distribute dari Xcode Organizer

---

## 🎯 Setup Apple Developer Account

### Untuk Testing di Device:

1. Buka Xcode
2. Pilih project di sidebar
3. Tab **Signing & Capabilities**
4. Pilih **Team** (Apple ID kamu)
5. Xcode akan auto-generate provisioning profile

### Untuk App Store:

1. Daftar Apple Developer Program ($99/tahun)
2. Buat App ID di [developer.apple.com](https://developer.apple.com)
3. Setup certificates & provisioning profiles
4. Atau biarkan Xcode handle otomatis (recommended)

---

## 🐛 Troubleshooting

### Error: "CocoaPods not installed"

**Solusi:**
```bash
sudo gem install cocoapods
cd ios/App
pod install
```

### Error: "No such module 'Capacitor'"

**Solusi:**
```bash
cd ios/App
pod install
npx cap sync ios
```

### Error: "Signing for 'App' requires a development team"

**Solusi:**
1. Buka Xcode
2. Pilih project > Target "App"
3. Tab **Signing & Capabilities**
4. Pilih **Team** (Apple ID kamu)
5. Atau daftar Apple Developer Program

### Error: "Build failed" di Xcode

**Solusi:**
1. Clean build folder: **Product > Clean Build Folder** (⇧⌘K)
2. Delete Derived Data: `rm -rf ~/Library/Developer/Xcode/DerivedData`
3. Rebuild: `npx cap sync ios` lalu build lagi

### Error: "Capacitor sync error"

**Solusi:**
- Pastikan `dist/` folder ada (build web app dulu)
- Check `capacitor.config.ts` sudah benar
- Delete `ios/` folder dan `npx cap add ios` lagi (hanya jika benar-benar perlu)

### Error: "CocoaPods could not find compatible versions - required a higher minimum deployment target"

**Solusi:**
Update minimum iOS deployment target ke 13.0 atau lebih tinggi:

**Di Podfile (`ios/App/Podfile`):**
```ruby
platform :ios, '13.0'
```

**Di Xcode project:**
1. Buka `ios/App/App.xcodeproj` di Xcode
2. Pilih project > Target "App"
3. Tab **General** > **Deployment Info**
4. Set **iOS Deployment Target** ke **13.0** atau lebih tinggi

**Atau via command line:**
```bash
# Update Podfile
sed -i.bak "s/platform :ios, '[^']*'/platform :ios, '13.0'/" ios/App/Podfile

# Update Xcode project
sed -i.bak "s/IPHONEOS_DEPLOYMENT_TARGET = [^;]*/IPHONEOS_DEPLOYMENT_TARGET = 13.0/g" ios/App/App.xcodeproj/project.pbxproj

# Sync lagi
npx cap sync ios
```

**Note:** Capacitor 7+ membutuhkan minimum iOS 13.0.

---

## ✅ Checklist Build iOS

- [ ] Install Xcode dari App Store
- [ ] Install dependencies: `npm install`
- [ ] Build web app: `npm run build:electron && vite build`
- [ ] Add iOS platform: `npx cap add ios` (jika belum ada)
- [ ] Sync: `npx cap sync ios`
- [ ] Open Xcode: `npx cap open ios`
- [ ] Setup signing di Xcode (pilih Team)
- [ ] Build di Xcode atau via command line
- [ ] Test di simulator/device
- [ ] Archive untuk distribution (jika perlu)

---

## 📌 Notes

- **Build iOS butuh Xcode** - Xcode cuma jalan di macOS
- **TAPI bisa build tanpa Mac** - pakai GitHub Actions atau cloud build service
- **GitHub Actions** - gratis untuk public repo, pakai Mac runner otomatis
- **Cloud Build** - Codemagic, Bitrise, AppCircle (ada free tier)
- **PWA Alternative** - bisa install di iPhone tanpa build native
- **Apple Developer Account** - wajib untuk testing di device & App Store
- **Version:** Update version di `package.json` sebelum build
- **Signing:** iOS app harus di-sign untuk bisa jalan di device
- **Simulator:** Bisa test tanpa Apple Developer Account
- **Device Testing:** Butuh Apple Developer Account (free atau paid)

---

## 🚀 Quick Commands

### Build di Mac Lokal:
```bash
# Build web app
npm run build:electron && vite build

# Sync ke iOS
npx cap sync ios

# Open Xcode
npx cap open ios

# Check Capacitor setup
npx cap doctor

# Build iOS (sync + open)
npm run build:ios
npx cap open ios
```

### Build via GitHub Actions (Tanpa Mac):
```bash
# 1. Commit & push code
git add .
git commit -m "Update app"
git push

# 2. Buka GitHub Actions di browser
# https://github.com/USERNAME/REPO/actions

# 3. Klik "Run workflow" > "Run workflow"
# 4. Tunggu build selesai
# 5. Download artifacts (IPA file)
```

---

## 💡 Tips

1. **Pertama kali setup:** Install CocoaPods dulu: `sudo gem install cocoapods`
2. **Setelah update code:** Cukup `npx cap sync ios` (tidak perlu rebuild Xcode project)
3. **Test di simulator:** Gratis, tidak perlu Apple Developer Account
4. **Test di device:** Butuh Apple Developer Account (free Apple ID cukup untuk development)
5. **Publish ke App Store:** Butuh paid Apple Developer Account ($99/tahun)

