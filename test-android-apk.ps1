# Script Test APK Android - Noxtiz POS
# Test apakah APK bisa di-install atau engga

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST APK ANDROID - NOXTIZ POS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$apkPath = "android\app\build\outputs\apk\release\app-release-unsigned.apk"
$signedApkPath = "android\app\build\outputs\apk\release\app-release.apk"

# Test 1: Cek apakah APK unsigned ada
Write-Host "[TEST 1] Cek APK Unsigned..." -ForegroundColor Yellow
if (Test-Path $apkPath) {
    $apkSize = (Get-Item $apkPath).Length / 1MB
    Write-Host "  [OK] APK unsigned ditemukan: $apkPath" -ForegroundColor Green
    Write-Host "  [OK] Ukuran: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Green
    Write-Host "  [WARN] WARNING: APK ini UNSIGNED, tidak bisa di-install langsung!" -ForegroundColor Red
} else {
    Write-Host "  [FAIL] APK unsigned tidak ditemukan" -ForegroundColor Red
}

Write-Host ""

# Test 2: Cek apakah APK signed ada
Write-Host "[TEST 2] Cek APK Signed..." -ForegroundColor Yellow
if (Test-Path $signedApkPath) {
    $signedApkSize = (Get-Item $signedApkPath).Length / 1MB
    Write-Host "  [OK] APK signed ditemukan: $signedApkPath" -ForegroundColor Green
    Write-Host "  [OK] Ukuran: $([math]::Round($signedApkSize, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] APK signed tidak ditemukan" -ForegroundColor Red
    Write-Host "  -> Perlu build ulang dengan signing config" -ForegroundColor Yellow
}

Write-Host ""

# Test 3: Cek signing config di build.gradle
Write-Host "[TEST 3] Cek Signing Config..." -ForegroundColor Yellow
$buildGradle = Get-Content "android\app\build.gradle" -Raw
if ($buildGradle -match "signingConfigs") {
    Write-Host "  [OK] Signing config ditemukan di build.gradle" -ForegroundColor Green
    if ($buildGradle -match "signingConfig signingConfigs.release") {
        Write-Host "  [OK] Release build sudah dikonfigurasi untuk signing" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Release build belum dikonfigurasi untuk signing" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [FAIL] Signing config tidak ditemukan" -ForegroundColor Red
}

Write-Host ""

# Test 4: Cek Java/Gradle
Write-Host "[TEST 4] Cek Java & Gradle..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1 | Select-Object -First 1
    Write-Host "  [OK] Java ditemukan: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] Java tidak ditemukan" -ForegroundColor Red
    Write-Host "  -> Install Java JDK 11 atau 17" -ForegroundColor Yellow
    Write-Host "  -> Download: https://adoptium.net/" -ForegroundColor Yellow
}

try {
    $gradleVersion = & "android\gradlew.bat" --version 2>&1 | Select-Object -First 1
    Write-Host "  [OK] Gradle ditemukan: $gradleVersion" -ForegroundColor Green
} catch {
    Write-Host "  [WARN] Gradle tidak bisa dijalankan (mungkin perlu Java)" -ForegroundColor Yellow
}

Write-Host ""

# Test 5: Cek Keystore
Write-Host "[TEST 5] Cek Keystore..." -ForegroundColor Yellow
$debugKeystore = "$env:USERPROFILE\.android\debug.keystore"
if (Test-Path $debugKeystore) {
    Write-Host "  [OK] Debug keystore ditemukan: $debugKeystore" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Debug keystore TIDAK ditemukan: $debugKeystore" -ForegroundColor Red
    Write-Host "  -> Perlu generate keystore dulu!" -ForegroundColor Yellow
}

# Cek apakah ada release keystore di android/app/
$releaseKeystore = "android\app\release.keystore"
if (Test-Path $releaseKeystore) {
    Write-Host "  [OK] Release keystore ditemukan: $releaseKeystore" -ForegroundColor Green
} else {
    Write-Host "  [INFO] Release keystore tidak ada (menggunakan debug keystore)" -ForegroundColor Cyan
}

Write-Host ""

# Test 6: Verify APK Signature (jika APK signed ada)
if (Test-Path $signedApkPath) {
    Write-Host "[TEST 6] Verify APK Signature..." -ForegroundColor Yellow
    $androidHome = $env:ANDROID_HOME
    
    # Coba ambil dari local.properties kalau ANDROID_HOME tidak ada
    if (-not $androidHome) {
        $localProps = "android\local.properties"
        if (Test-Path $localProps) {
            $sdkLine = Get-Content $localProps | Select-String "sdk.dir="
            if ($sdkLine) {
                $androidHome = $sdkLine.ToString() -replace "sdk.dir=", "" -replace "\\\\", "\" -replace "C\\:", "C:"
            }
        }
    }
    
    if ($androidHome -and (Test-Path "$androidHome\build-tools")) {
        # Cari apksigner di build-tools
        $buildToolsDirs = Get-ChildItem "$androidHome\build-tools" -Directory | Sort-Object Name -Descending
        $apksignerFound = $false
        foreach ($dir in $buildToolsDirs) {
            $apksigner = "$dir\apksigner.bat"
            if (Test-Path $apksigner) {
                try {
                    $verifyResult = & $apksigner verify "$signedApkPath" 2>&1 | Out-String
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "  [OK] APK signature VALID" -ForegroundColor Green
                        $apksignerFound = $true
                        break
                    } else {
                        Write-Host "  [FAIL] APK signature INVALID atau corrupted" -ForegroundColor Red
                        Write-Host "  -> Error: $($verifyResult -replace "`r`n", " ")" -ForegroundColor Yellow
                        $apksignerFound = $true
                        break
                    }
                } catch {
                    Write-Host "  [WARN] Tidak bisa verify signature: $_" -ForegroundColor Yellow
                    $apksignerFound = $true
                    break
                }
            }
        }
        if (-not $apksignerFound) {
            Write-Host "  [WARN] apksigner tidak ditemukan di Android SDK" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  [WARN] Android SDK tidak ditemukan, tidak bisa verify signature" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Test 7: Cek Android SDK
Write-Host "[TEST 7] Cek Android SDK..." -ForegroundColor Yellow
$androidHome = $env:ANDROID_HOME
$localProperties = "android\local.properties"

# Cek local.properties dulu
if (Test-Path $localProperties) {
    $sdkLine = Get-Content $localProperties | Select-String "sdk.dir="
    if ($sdkLine) {
        $sdkDir = $sdkLine.ToString() -replace "sdk.dir=", "" -replace "\\\\", "\" -replace "C\\:", "C:"
        if ($sdkDir) {
            Write-Host "  [OK] local.properties ditemukan: sdk.dir=$sdkDir" -ForegroundColor Green
            if (Test-Path $sdkDir) {
                Write-Host "  [OK] Android SDK ditemukan di: $sdkDir" -ForegroundColor Green
                if (Test-Path "$sdkDir\platform-tools\adb.exe") {
                    Write-Host "  [OK] ADB ditemukan" -ForegroundColor Green
                } else {
                    Write-Host "  [WARN] ADB tidak ditemukan" -ForegroundColor Yellow
                }
            } else {
                Write-Host "  [FAIL] Path di local.properties tidak valid: $sdkDir" -ForegroundColor Red
            }
        }
    }
} else {
    Write-Host "  [WARN] local.properties tidak ditemukan" -ForegroundColor Yellow
}

# Cek ANDROID_HOME juga (opsional, tapi bagus kalau ada)
if ($androidHome) {
    Write-Host "  [OK] ANDROID_HOME juga di-set: $androidHome" -ForegroundColor Green
} else {
    Write-Host "  [INFO] ANDROID_HOME tidak di-set (tidak masalah jika local.properties ada)" -ForegroundColor Cyan
}

Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$issues = @()

if (-not (Test-Path $signedApkPath)) {
    $issues += "APK signed belum ada - perlu build ulang"
}

if (-not (Test-Path $debugKeystore)) {
    $issues += "Debug keystore tidak ditemukan - perlu generate keystore"
}

if (-not ($buildGradle -match "signingConfigs")) {
    $issues += "Signing config belum di-setup"
}

try {
    java -version 2>&1 | Out-Null
} catch {
    $issues += "Java belum terinstall atau tidak di PATH"
}

if ($issues.Count -eq 0) {
    Write-Host "  [OK] Semua test passed!" -ForegroundColor Green
    Write-Host "  -> APK siap untuk di-test install" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Masalah ditemukan:" -ForegroundColor Yellow
    foreach ($issue in $issues) {
        Write-Host "    - $issue" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "  -> Lihat instruksi di bawah untuk fix" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INSTRUKSI BUILD APK SIGNED" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Setup Java (jika belum):" -ForegroundColor Yellow
Write-Host "   - Download JDK 17: https://adoptium.net/" -ForegroundColor White
Write-Host "   - Set JAVA_HOME: `$env:JAVA_HOME = 'C:\Program Files\Java\jdk-17'" -ForegroundColor White
Write-Host ""
Write-Host "2. Generate Debug Keystore (jika belum ada):" -ForegroundColor Yellow
Write-Host "   keytool -genkey -v -keystore `$env:USERPROFILE\.android\debug.keystore" -ForegroundColor White
Write-Host "   -storepass android -alias androiddebugkey -keypass android" -ForegroundColor White
Write-Host "   -keyalg RSA -keysize 2048 -validity 10000" -ForegroundColor White
Write-Host "   -dname `"CN=Android Debug,O=Android,C=US`"" -ForegroundColor White
Write-Host ""
Write-Host "3. Build APK Signed:" -ForegroundColor Yellow
Write-Host "   npm run build:android" -ForegroundColor White
Write-Host "   ATAU" -ForegroundColor White
Write-Host "   cd android" -ForegroundColor White
Write-Host "   .\gradlew.bat assembleRelease" -ForegroundColor White
Write-Host ""
Write-Host "4. APK signed akan ada di:" -ForegroundColor Yellow
Write-Host "   android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor White
Write-Host ""
Write-Host "5. Test Install:" -ForegroundColor Yellow
Write-Host "   - Copy APK ke HP Android" -ForegroundColor White
Write-Host "   - Buka file manager" -ForegroundColor White
Write-Host "   - Klik APK untuk install" -ForegroundColor White
Write-Host "   - Jika error, pastikan Install from unknown sources enabled" -ForegroundColor White
Write-Host ""

