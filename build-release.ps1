# Build Release APK and AAB
Write-Host "🏗️ Building release versions..." -ForegroundColor Cyan

# Clean previous builds
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
cd android
./gradlew clean

# Build APK
Write-Host "📦 Building APK..." -ForegroundColor Green
./gradlew assembleRelease

# Build AAB
Write-Host "📦 Building AAB (Bundle)..." -ForegroundColor Green
./gradlew bundleRelease

cd ..

Write-Host ""
Write-Host "✅ Build Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Files created:" -ForegroundColor Cyan
Write-Host "  APK: android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor White
Write-Host "  AAB: android\app\build\outputs\bundle\release\app-release.aab" -ForegroundColor White
Write-Host ""
Write-Host "📱 To install APK on device:" -ForegroundColor Yellow
Write-Host "  adb install android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor White
