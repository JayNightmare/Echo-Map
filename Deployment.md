# Deployment Guide

## Prerequisites
1.  **Node.js** and dependencies installed (`npm install`).
2.  **Xcode** (Mac only) with Command Line Tools.
3.  **CocoaPods** (`sudo gem install cocoapods` if using Ruby system, or via Homebrew).
4.  **EAS CLI** (for Android builds): `npm install -g eas-cli`.

---

## 🍎 iOS (Sideloading via Xcode)
*Note: Without a paid Apple Developer Program account, apps expire after 7 days and must be rebuilt/reinstalled.*

### 1. Prepare the Native Project
If the `ios/` folder does not exist (Expo project), generate it:
```bash
npx expo prebuild
```

### 2. Install Pods
```bash
cd ios
pod install
cd ..
```

### 3. Configure Signing (Personal Team)
 * Open the workspace file in Xcode:
   open ios/EchoMap.xcworkspace

 * In the left file navigator, select the root EchoMap project.
 * Select the EchoMap target under "Targets".
 * Go to the Signing & Capabilities tab.
 * Check Automatically manage signing.
 * Under Team, select Add an Account... and log in with your Apple ID.
 * Select your (Personal Team).
   * Error Handling: If you see "Bundle Identifier is not available," change the Bundle Identifier to something unique (e.g., com.yourname.echomap).

### 4. Build to Device
 * Connect your iPhone to the Mac via USB.
 * Unlock the iPhone and select "Trust Computer" if prompted.
 * In Xcode's top toolbar, change the build destination from a Simulator to your iPhone.
 * Click the Play button (▶) or press Cmd + R.

### 5. Trust the Developer (On iPhone)
 * The app will install but fail to launch immediately.
 * On your phone, go to Settings > General > VPN & Device Management.
 * Tap your email address under "Developer App".
 * Tap Trust.
🤖 Android (APK Generation)
You can use EAS to build a standalone APK without a paid Google Play account.

### Option A: EAS (Cloud Build - Recommended)
 * Configure EAS:
   If you haven't initialized EAS yet:
   eas build:configure

   Select android when prompted.
 * Update eas.json:
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
```

 * Run the Build:
```bash
eas build -p android --profile preview
```
EAS will provide a download link for the .apk file once finished.

### Option B: Local Build (Advanced)
If you prefer not to use the cloud:
 * Ensure you have Android Studio and the Java JDK (v17 recommended) installed.
 * Generate native folders (if missing):
   npx expo prebuild

 * Build the Release APK:
```bash
   cd android
./gradlew assembleRelease
```

 * Locate the APK:
```bash
   android/app/build/outputs/apk/release/app-release.apk
```
