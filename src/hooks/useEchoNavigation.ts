import { useState, useEffect, useRef } from "react";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { AudioNode, NavigationState, UserLocation } from "../types";
import {
    calculateDistance,
    calculateBearing,
    calculateBearingDelta,
    getHapticParams,
} from "../utils/geolocation";

import { useSettings } from "../context/SettingsContext"; // Added import

const ARRIVAL_THRESHOLD = 10; // meters
const HEADING_TOLERANCE = 15; // degrees

interface UseEchoNavigationProps {
    userLocation: UserLocation | null;
    isStarted: boolean;
}

export const useEchoNavigation = ({
    userLocation,
    isStarted,
}: UseEchoNavigationProps) => {
    const [state, setState] = useState<NavigationState>({
        activeTarget: null,
        activeRoute: [],
        currentTargetIndex: 0,
        distance: null,
        bearing: null,
        headingDelta: null,
        isArrived: false,
    });

    const [isOnTrack, setIsOnTrack] = useState(false);
    const hapticIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Update navigation metrics
    useEffect(() => {
        if (!userLocation || !state.activeTarget) {
            setState((prev) => ({
                ...prev,
                distance: null,
                bearing: null,
                headingDelta: null,
                isArrived: false,
            }));
            return;
        }

        const target = state.activeTarget;
        const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            target.latitude,
            target.longitude,
        );

        const bearing = calculateBearing(
            userLocation.latitude,
            userLocation.longitude,
            target.latitude,
            target.longitude,
        );

        const headingDelta =
            userLocation.heading !== null
                ? calculateBearingDelta(userLocation.heading, bearing)
                : null;

        const isArrived = distance < ARRIVAL_THRESHOLD;

        setState((prev) => ({
            ...prev,
            distance,
            bearing,
            headingDelta,
            isArrived,
        }));
    }, [userLocation, state.activeTarget]);

    // Haptics & Feedback
    const { hapticsEnabled } = useSettings();

    useEffect(() => {
        if (!state.activeTarget || state.isArrived || !isStarted) {
            setIsOnTrack(false);
            return;
        }

        const headingDelta = state.headingDelta;
        if (
            headingDelta !== null &&
            Math.abs(headingDelta) <= HEADING_TOLERANCE
        ) {
            if (!isOnTrack) {
                setIsOnTrack(true);
                if (hapticsEnabled) {
                    Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Success,
                    );
                }
            }
        } else {
            if (isOnTrack) {
                setIsOnTrack(false);
            }
        }
    }, [
        state.headingDelta,
        state.isArrived,
        state.activeTarget,
        isStarted,
        hapticsEnabled,
    ]);

    useEffect(() => {
        if (hapticIntervalRef.current) {
            clearInterval(hapticIntervalRef.current);
            hapticIntervalRef.current = null;
        }

        if (
            !state.activeTarget ||
            state.isArrived ||
            state.distance === null ||
            !isStarted ||
            !hapticsEnabled
        ) {
            return;
        }

        const { interval, intensity } = getHapticParams(state.distance);

        const triggerHaptic = () => {
            if (!hapticsEnabled) return;
            if (intensity === "light")
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            else if (intensity === "medium")
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        };

        triggerHaptic();
        hapticIntervalRef.current = setInterval(triggerHaptic, interval);

        return () => {
            if (hapticIntervalRef.current)
                clearInterval(hapticIntervalRef.current);
        };
    }, [
        state.distance,
        state.isArrived,
        state.activeTarget,
        isStarted,
        hapticsEnabled,
    ]);

    // Actions

    const addToRoute = (node: AudioNode) => {
        setState((prev) => ({
            ...prev,
            activeRoute: [...prev.activeRoute, node],
        }));
        Alert.alert("Added to Route", `${node.title} added.`);
    };

    const startRoute = () => {
        if (state.activeRoute.length === 0) {
            Alert.alert(
                "No Targets",
                "Please add at least one location to the route.",
            );
            return false;
        }

        setState((prev) => ({
            ...prev,
            activeTarget: prev.activeRoute[0],
            currentTargetIndex: 0,
            isArrived: false,
        }));
        return true;
    };

    const proceedToNextTarget = () => {
        const nextIndex = state.currentTargetIndex + 1;
        if (nextIndex < state.activeRoute.length) {
            setState((prev) => ({
                ...prev,
                activeTarget: prev.activeRoute[nextIndex],
                currentTargetIndex: nextIndex,
                isArrived: false,
                distance: null,
            }));
            return true;
        } else {
            Alert.alert("Route Complete", "You have visited all locations!");
            clearNavigation();
            return false;
        }
    };

    const clearNavigation = () => {
        setState({
            activeTarget: null,
            activeRoute: [],
            currentTargetIndex: 0,
            distance: null,
            bearing: null,
            headingDelta: null,
            isArrived: false,
        });
    };

    const setRoute = (route: AudioNode[]) => {
        setState((prev) => ({
            ...prev,
            activeRoute: route,
            activeTarget: null,
            currentTargetIndex: 0,
            distance: null,
            bearing: null,
            headingDelta: null,
            isArrived: false,
        }));
    };

    const updateRoute = (route: AudioNode[]) => {
        setState((prev) => ({
            ...prev,
            activeRoute: route,
        }));
    };

    const updateNode = (index: number, node: Partial<AudioNode>) => {
        setState((prev) => {
            const newRoute = [...prev.activeRoute];
            if (newRoute[index]) {
                newRoute[index] = { ...newRoute[index], ...node };
            }
            return {
                ...prev,
                activeRoute: newRoute,
            };
        });
    };

    return {
        state,
        isOnTrack,
        addToRoute,
        startRoute,
        proceedToNextTarget,
        clearNavigation,
        setRoute,
        updateRoute,
        updateNode,
    };
};
