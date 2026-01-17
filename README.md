# Echo Map

A geospatial audio discovery mobile application built with React Native and Expo.

## 📱 About

EchoMap is a location-based experience where users navigate the real world to find hidden "Audio Nodes." The app uses a "hot/cold" navigation system with haptic feedback and directional audio cues to guide users to coordinates without needing to constantly look at the screen.

## ✨ Features

- **Google Maps Integration**: Full-screen map with custom audio node markers
- **Real-time Navigation**: Live tracking with compass and bearing calculations
- **Hot/Cold Feedback**: Dynamic haptic feedback that changes based on proximity
- **Directional Guidance**: Compass overlay showing direction to target
- **Audio Playback**: Stream audio content when you arrive at a node
- **TypeScript**: Fully typed for better developer experience

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo Go app (for testing on physical devices)
- **Google Maps API Key** (required for maps functionality)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/JayNightmare/Echo-Map.git
cd Echo-Map
```

2. Install dependencies:
```bash
npm install
```

3. Configure Google Maps API:
   - Get an API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Open `app.json` and replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual API key

### Running the App

Start the development server:
```bash
npm start
```

This will open Expo DevTools in your browser. From there, you can:

- **Run on iOS Simulator**: Press `i` (macOS only)
- **Run on Android Emulator**: Press `a` (requires Android Studio)
- **Run on Web**: Press `w`
- **Run on Physical Device**: Scan the QR code with the Expo Go app

**Note**: For the best experience, test on a physical device as the app requires GPS, magnetometer, and haptic feedback which may not work properly in simulators.

Alternatively, run specific platforms directly:

```bash
npm run ios        # Run on iOS simulator (macOS only)
npm run android    # Run on Android emulator
npm run web        # Run on web browser
```

## 📁 Project Structure

```
Echo-Map/
├── App.tsx                 # Main application component
├── index.js                # Entry point for Expo
├── app.json                # Expo configuration with permissions
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── components/
│   ├── CompassOverlay.tsx  # Compass UI component
│   └── AudioPlayer.tsx     # Audio playback interface
├── types/
│   └── index.ts            # TypeScript type definitions
├── utils/
│   └── geolocation.ts      # Distance and bearing calculations
├── data/
│   └── audioNodes.json     # Mock audio node locations
└── assets/                 # Images, icons, and static files
```

## 🎮 How to Use

1. **Grant Permissions**: On first launch, allow location access
2. **View the Map**: See your location and nearby audio nodes (🎵 markers)
3. **Select a Target**: Tap any audio node marker to set it as your active target
4. **Follow the Compass**: A compass overlay shows you which direction to walk
5. **Use Feedback Cues**:
   - **Haptic Vibrations**: Get stronger and more frequent as you get closer
   - **On-Track Indicator**: Shows when you're pointing in the right direction
6. **Arrive & Play**: When within 10 meters, the audio player unlocks automatically

## 🛠 Technologies

- **React Native**: Framework for building native apps
- **Expo**: Platform for universal native apps
- **TypeScript**: Type-safe development
- **react-native-maps**: Google Maps integration
- **expo-location**: GPS tracking
- **expo-sensors**: Magnetometer for compass
- **expo-haptics**: Vibration feedback
- **expo-av**: Audio playback

## 🎯 Technical Features

### Navigation Logic
- Real-time distance calculation using Haversine formula
- Bearing calculation between coordinates
- Heading delta for directional feedback

### Hot/Cold Feedback System
- **Distance-based haptics**: Intensity and frequency increase as you approach
  - Far (>100m): Heavy vibration every 5 seconds
  - Medium (50-100m): Medium vibration every 3 seconds
  - Close (<50m): Light vibration every 1-2 seconds
  - Very Close (<10m): Arrival state triggered
- **Directional audio**: Sonar ping plays when pointing within ±15° of target

### Acceptance Criteria
✅ Compiles and runs in Expo Go on physical devices
✅ Google Maps loads with user location
✅ Pointing phone at target triggers feedback
✅ Walking toward target changes vibration patterns
✅ Arriving at target enables audio playback

## 📝 Configuration

The app uses mock data in `data/audioNodes.json`. You can:
- Add more audio nodes with latitude, longitude, title, and audioUrl
- Change audio URLs to point to your own content
- Adjust arrival threshold and heading tolerance in `App.tsx`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Contact

For questions or support, please open an issue on GitHub.
