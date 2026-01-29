import "dotenv/config";
import { GOOGLE_MAPS_API_KEY } from "./src/config/config";

export default {
	expo: {
		name: "Echo Map",
		slug: "echo-map",
		version: "0.1.0",
		orientation: "portrait",
		icon: "./src/assets/icon.png",
		userInterfaceStyle: "light",
		splash: {
			image: "./src/assets/splash-icon.png",
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
				GOOGLE_MAPS_API_KEY:
					process.env
						.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
			},
			config: {
				googleMapsApiKey:
					process.env
						.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
					"YOUR_GOOGLE_MAPS_API_KEY_HERE",
			},
			bundleIdentifier: "com.jaynightmare.echomap",
		},
		android: {
			adaptiveIcon: {
				foregroundImage:
					"./src/assets/adaptive-icon.png",
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
			package: "com.jaynightmare.echomap",
		},
		web: {
			favicon: "./src/assets/favicon.png",
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
		],
		extra: {
			googleMapsApiKey:
				process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
			eas: {
				projectId: "c74d9f9e-e1f5-4554-89c4-2197e4f790f2",
			},
		},
	},
};
