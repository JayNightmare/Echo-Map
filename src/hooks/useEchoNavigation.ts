import { useState, useEffect, useRef } from "react";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { useAudioPlayer } from "expo-audio";
import { AudioNode, NavigationState, UserLocation } from "../types";
import {
    calculateDistance,
    calculateBearing,
    calculateBearingDelta,
    getHapticParams,
} from "../utils/geolocation";
import { useAppSounds } from "./useAppSounds";

import { useSettings } from "../context/SettingsContext";

const ARRIVAL_THRESHOLD = 80; // meters
const HEADING_TOLERANCE = 15; // degrees
const AUTO_ARRIVAL_TIME = 3 * 60 * 1000; // 3 minutes in milliseconds

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
        isApproaching: false,
    });

    const [isOnTrack, setIsOnTrack] = useState(false);
    const hapticIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const approachTimerRef = useRef<NodeJS.Timeout | null>(null);
    const prevDistanceRef = useRef<number | null>(null);

    // Update navigation metrics
    const { hapticsEnabled, audioEnabled } = useSettings();
    const { milestonePlayer, startPlayer, arrivedPlayer, cancelledPlayer } =
        useAppSounds();

    useEffect(() => {
        if (!userLocation || !state.activeTarget) {
            setState((prev) => ({
                ...prev,
                distance: null,
                bearing: null,
                headingDelta: null,
                isArrived: false,
                isApproaching: false,
            }));
            // Clear timer if we stop navigating
            if (approachTimerRef.current) {
                clearTimeout(approachTimerRef.current);
                approachTimerRef.current = null;
            }
            prevDistanceRef.current = null;
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

        const isApproaching = distance < ARRIVAL_THRESHOLD;

        // If we are approaching, start the timer if not already started
        if (isApproaching && !approachTimerRef.current && !state.isArrived) {
            approachTimerRef.current = setTimeout(() => {
                markAsArrived();
            }, AUTO_ARRIVAL_TIME);
        } else if (!isApproaching && approachTimerRef.current) {
            // If we leave the radius, clear the timer
            clearTimeout(approachTimerRef.current);
            approachTimerRef.current = null;
        }

        // Audio Triggers for Milestones
        if (audioEnabled && prevDistanceRef.current !== null && isOnTrack) {
            const prevDist = prevDistanceRef.current;
            const currDist = distance;

            // Milestones: 500, 150, 80
            const milestones = [500, 150, 80];

            for (const milestone of milestones) {
                // Check if we just crossed the milestone (was above, now below or equal)
                if (prevDist > milestone && currDist <= milestone) {
                    milestonePlayer.play();
                    break; // Play only one sound per update if multiple crossed (unlikely but safe)
                }
            }
        }

        prevDistanceRef.current = distance;

        setState((prev) => ({
            ...prev,
            distance,
            bearing,
            headingDelta,
            isApproaching,
            isArrived: prev.isArrived,
        }));
    }, [
        userLocation,
        state.activeTarget,
        audioEnabled,
        isOnTrack,
        milestonePlayer,
    ]);

    // Haptics & Feedback

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

        startPlayer.seekTo(0);
        startPlayer.play();

        setState((prev) => ({
            ...prev,
            activeTarget: prev.activeRoute[0],
            currentTargetIndex: 0,
            isArrived: false,
            isApproaching: false,
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
                isApproaching: false,
                distance: null,
            }));

            // Clear timer for next target
            if (approachTimerRef.current) {
                clearTimeout(approachTimerRef.current);
                approachTimerRef.current = null;
            }

            return true;
        } else {
            Alert.alert("Route Complete", "You have visited all locations!");
            arrivedPlayer.seekTo(0);
            arrivedPlayer.play();
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
            isApproaching: false,
        });
        if (approachTimerRef.current) {
            clearTimeout(approachTimerRef.current);
            approachTimerRef.current = null;
        }
    };

    const cancelNavigation = () => {
        cancelledPlayer.seekTo(0);
        cancelledPlayer.play();
        clearNavigation();
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
            isApproaching: false,
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

    const markAsArrived = () => {
        setState((prev) => ({
            ...prev,
            isArrived: true,
        }));
        arrivedPlayer.seekTo(0);
        arrivedPlayer.play();
        if (approachTimerRef.current) {
            clearTimeout(approachTimerRef.current);
            approachTimerRef.current = null;
        }
    };

    return {
        state,
        isOnTrack,
        addToRoute,
        startRoute,
        proceedToNextTarget,
        clearNavigation,
        cancelNavigation,
        setRoute,
        updateRoute,
        updateNode,
        markAsArrived,
    };
};
