# 🔐 Keystore Information
**IMPORTANT: Keep this file secure and NEVER commit to Git!**

## Keystore Details
- **File**: `keystore/sampleapp-release.keystore`
- **Alias**: `sampleappKey`
- **Store Password**: `sampleapp123`
- **Key Password**: `sampleapp123`
- **Validity**: 10,000 days (~27 years)
- **Owner**: CN=Craiu Bogdan, OU=Student, O=Personal, C=RO

## 🚀 Build Instructions

### Build Release APK
```powershell
cd android
./gradlew assembleRelease
```
**Output**: `android/app/build/outputs/apk/release/app-release.apk`

### Build Release AAB (for Google Play)
```powershell
cd android
./gradlew bundleRelease
```
**Output**: `android/app/build/outputs/bundle/release/app-release.aab`

### Clean Build (if needed)
```powershell
cd android
./gradlew clean
./gradlew assembleRelease
```

## 📦 Find Your Build
After building:
- **APK**: `android\app\build\outputs\apk\release\app-release.apk`
- **AAB**: `android\app\build\outputs\bundle\release\app-release.aab`

## 🔒 Security Notes
1. **NEVER** commit the keystore file to Git (already in .gitignore)
2. **BACKUP** the keystore file securely - if you lose it, you can't update your app on Play Store
3. For production apps, use stronger passwords
4. Store credentials in a password manager

## 📱 Install APK on Device
```powershell
adb install android\app\build\outputs\apk\release\app-release.apk
```

## ✅ Current Status
- ✅ Keystore created
- ✅ Configured in gradle.properties
- ✅ Protected by .gitignore
- ✅ Ready to build release versions
