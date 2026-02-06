import { useState, useEffect, useRef } from "react";
import { Alert } from "react-native";
import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";
import { UserLocation } from "../types";

export const useEchoLocation = () => {
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

    const locationSubscriptionRef =
        useRef<Location.LocationSubscription | null>(null);
    const headingSubscriptionRef = useRef<Location.LocationSubscription | null>(
        null,
    );

    useEffect(() => {
        (async () => {
            const { status: locationStatus } =
                await Location.requestForegroundPermissionsAsync();
            if (locationStatus !== "granted") {
                Alert.alert(
                    "Permission Denied",
                    "Location permission is required to use EchoMap.",
                );
                return;
            }

            locationSubscriptionRef.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    distanceInterval: 5,
                    timeInterval: 1000,
                },
                (location) => {
                    setUserLocation((prev) => ({
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        heading: prev?.heading ?? null,
                    }));
                },
            );

            headingSubscriptionRef.current = await Location.watchHeadingAsync(
                (newHeading) => {
                    setUserLocation((prev) => {
                        if (!prev) return null;
                        // use trueHeading if available, otherwise magHeading
                        const heading =
                            newHeading.trueHeading >= 0
                                ? newHeading.trueHeading
                                : newHeading.magHeading;
                        return { ...prev, heading };
                    });
                },
            );
        })();

        return () => {
            if (locationSubscriptionRef.current)
                locationSubscriptionRef.current.remove();
            if (headingSubscriptionRef.current)
                headingSubscriptionRef.current.remove();
        };
    }, []);

    return userLocation;
};
