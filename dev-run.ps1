# Development build script with automatic cleanup
Write-Host "🧹 Cleaning and rebuilding React Native app..." -ForegroundColor Cyan

# Clear device storage if needed
Write-Host "📱 Trimming device cache..." -ForegroundColor Yellow
adb shell pm trim-caches 2G

# Uninstall old app version
Write-Host "🗑️ Uninstalling old app..." -ForegroundColor Yellow
adb uninstall com.sampleapp 2>$null

# Clean gradle build
Write-Host "🧼 Cleaning Gradle build..." -ForegroundColor Yellow
cd android
./gradlew clean
cd ..

# Run with fresh cache
Write-Host "🚀 Building and installing app..." -ForegroundColor Green
npx react-native run-android --reset-cache

Write-Host "✅ Done!" -ForegroundColor Green
