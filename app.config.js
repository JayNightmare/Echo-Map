export default {
	expo: {
		name: "Echo Map",
		slug: "echo-map",
		version: "1.0.0",
		orientation: "portrait",
		icon: "./assets/icon.png",
		userInterfaceStyle: "light",
		splash: {
			image: "./assets/splash-icon.png",
			resizeMode: "contain",
			backgroundColor: "#ffffff",
		},
		ios: {
			supportsTablet: true,
			infoPlist: {
				NSLocationWhenInUseUsageDescription:
					"EchoMap needs your location to guide you to audio nodes and show your position on the map.",
				NSLocationAlwaysAndWhenInUseUsageDescription:
					"EchoMap needs your location to guide you to audio nodes even when the app is in the background.",
			},
			config: {
				googleMapsApiKey:
					process.env
						.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
					"YOUR_GOOGLE_MAPS_API_KEY_HERE",
			},
		},
		android: {
			adaptiveIcon: {
				foregroundImage: "./assets/adaptive-icon.png",
				backgroundColor: "#ffffff",
			},
			edgeToEdgeEnabled: true,
			permissions: [
				"ACCESS_FINE_LOCATION",
				"ACCESS_COARSE_LOCATION",
				"VIBRATE",
			],
			config: {
				googleMaps: {
					apiKey: process.env
						.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
				},
			},
		},
		web: {
			favicon: "./assets/favicon.png",
		},
		plugins: [
			[
				"expo-location",
				{
					locationAlwaysAndWhenInUsePermission:
						"Allow EchoMap to use your location to guide you to audio nodes.",
				},
			],
			"expo-audio",
			"expo-video",
			"expo-font",
			"expo-asset",
		],
	},
};
