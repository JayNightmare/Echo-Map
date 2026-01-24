import { useState, useEffect, useRef } from "react";
import { Alert } from "react-native";
import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";
import { UserLocation } from "../types";

export const useEchoLocation = () => {
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

    const locationSubscriptionRef =
        useRef<Location.LocationSubscription | null>(null);
    const magnetometerSubscriptionRef = useRef<{ remove: () => void } | null>(
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

            magnetometerSubscriptionRef.current = Magnetometer.addListener(
                (data) => {
                    const { x, y } = data;
                    let heading = (Math.atan2(y, x) * 180) / Math.PI;
                    heading = (heading + 360) % 360;

                    setUserLocation((prev) => {
                        if (!prev) return null;
                        return { ...prev, heading };
                    });
                },
            );

            Magnetometer.setUpdateInterval(100);
        })();

        return () => {
            if (locationSubscriptionRef.current)
                locationSubscriptionRef.current.remove();
            if (magnetometerSubscriptionRef.current)
                magnetometerSubscriptionRef.current.remove();
        };
    }, []);

    return userLocation;
};
