# Setup ONNX models for both debug and release builds
# Run this script from the project root directory

Write-Host "Setting up ONNX models for debug and release builds..." -ForegroundColor Cyan

# 1. Copy to android/app/src/main/assets/models (for debug builds)
$debugDir = "android\app\src\main\assets\models"
if (-not (Test-Path $debugDir)) {
    New-Item -ItemType Directory -Force -Path $debugDir | Out-Null
    Write-Host "Created debug assets directory: $debugDir" -ForegroundColor Green
}

# 2. Copy to asset pack (for release builds)
$releaseDir = "android\asset-packs\models\src\main\assets"
if (-not (Test-Path $releaseDir)) {
    New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null
    Write-Host "Created asset pack directory: $releaseDir" -ForegroundColor Green
}

# Copy model files to both locations
$modelFiles = Get-ChildItem -Path "assets\models" -Filter "*.onnx"

if ($modelFiles.Count -eq 0) {
    Write-Host "ERROR: No ONNX files found in assets\models!" -ForegroundColor Red
    exit 1
}

foreach ($file in $modelFiles) {
    # Copy to debug location
    $debugPath = Join-Path $debugDir $file.Name
    Copy-Item -Path $file.FullName -Destination $debugPath -Force
    $sizeMB = [math]::Round($file.Length/1MB, 2)
    Write-Host "Debug: $($file.Name) ($sizeMB MB)" -ForegroundColor Green
    
    # Copy to release location (asset pack)
    $releasePath = Join-Path $releaseDir $file.Name
    Copy-Item -Path $file.FullName -Destination $releasePath -Force
    Write-Host "Release: $($file.Name) -> asset pack" -ForegroundColor Green
}

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`nModel locations:" -ForegroundColor Cyan
Write-Host "  Source:  assets\models\ (keep these)" -ForegroundColor White
Write-Host "  Debug:   $debugDir (for dev builds)" -ForegroundColor White
Write-Host "  Release: $releaseDir (for Play Store)" -ForegroundColor White
Write-Host "`nYou can now:" -ForegroundColor Cyan
Write-Host "  • Run debug builds normally: npx react-native run-android" -ForegroundColor White
Write-Host "  • Build release: cd android && .\gradlew bundleRelease" -ForegroundColor White
