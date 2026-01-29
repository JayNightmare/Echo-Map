# Deployment Guide

## Prerequisites

1. **Node.js** and dependencies installed (`npm install`).
2. **Xcode** (Mac only) with Command Line Tools.
3. **CocoaPods** (`sudo gem install cocoapods` if using Ruby system, or via Homebrew).
4. **EAS CLI** (for Android builds): `npm install -g eas-cli`.

---

## 🤖 Android (APK Generation)

You can use EAS to build a standalone APK without a paid Google Play account.

### Option A: EAS (Cloud Build - Recommended)

- Configure EAS:
  If you haven't initialized EAS yet:
  eas build:configure

     Select android when prompted.

- Update eas.json:
  Ensure your eas.json has a preview profile set to build an APK (not an AAB):

```json
{
   {
      "build": {
         "preview": {
            "android": {
               "buildType": "apk"
            }
         }
      }
   }
}
```

- Run the Build:

```bash
eas build -p android --profile preview
```

EAS will provide a download link for the .apk file once finished.

### Option B: Local Build (Advanced)

If you prefer not to use the cloud:

- Ensure you have Android Studio and the Java JDK (v17 recommended) installed.
- Generate native folders (if missing):
  npx expo prebuild

- Build the Release APK:

```bash
   cd android
./gradlew assembleRelease
```

- Locate the APK:

```bash
   android/app/build/outputs/apk/release/app-release.apk
```
