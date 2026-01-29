# Deployment Guide

## Prerequisites

1. **Node.js** and dependencies installed (`npm install`).
2. **Xcode** (Mac only) with Command Line Tools.
3. **CocoaPods** (`sudo gem install cocoapods` if using Ruby system, or via Homebrew).
4. **EAS CLI** (for Android builds): `npm install -g eas-cli`.

---

## 🍎 iOS (Sideloading via Xcode)

_Note: Without a paid Apple Developer Program account, apps expire after 7 days and must be rebuilt/reinstalled._

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

- Open the workspace file in Xcode:
  open ios/EchoMap.xcworkspace

- In the left file navigator, select the root EchoMap project.
- Select the EchoMap target under "Targets".
- Go to the Signing & Capabilities tab.
- Check Automatically manage signing.
- Under Team, select Add an Account... and log in with your Apple ID.
- Select your (Personal Team).
     - Error Handling: If you see "Bundle Identifier is not available," change the Bundle Identifier to something unique (e.g., com.yourname.echomap).

### 4. Build to Device

- Connect your iPhone to the Mac via USB.
- Unlock the iPhone and select "Trust Computer" if prompted.
- In Xcode's top toolbar, change the build destination from a Simulator to your iPhone.
- Click the Play button (▶) or press Cmd + R.

### 5. Trust the Developer (On iPhone)

- The app will install but fail to launch immediately.
- On your phone, go to Settings > General > VPN & Device Management.
- Tap your email address under "Developer App".
- Tap Trust.

### (Optional - Free) 6. Share with others via AltStore

- On XCode, go to Product > Destination then choose Any iOS Device
- Then go Product > Archieve
- Once the build is complete, go to `<App Name>/<App Name>` in the XCode explorer
- Right click the application file and show in Finder
- Copy the `<App Name>`.app file and go back to the Document folder
- Create a new folder called `Payload` and paste the application inside
- Compress the folder into a .zip
- Rename from `Payload.zip` > `Payload.ipa`
- Open the `Notes` app on your Mac and create a new note called `<App Name>`
- Attach the `Payload.ipa` into the note
- Open your iPhone and open the note
     - if you don't see it, air drop it to yourself
- Save the `Payload.ipa` to File on your iPhone
- Open AltStore > My Apps > `+` and find your `Payload.ipa`
     - **Ensure you have setup AltStore and AltServer before contining this step**
     - https://altstore.io > AltServer Classic
