import React, { useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
    interpolateColor,
} from "react-native-reanimated";

interface NavigationOrbProps {
    distance: number; // meters
}

export const NavigationOrb: React.FC<NavigationOrbProps> = ({ distance }) => {
    // Shared values for animation
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.3);

    // Determine pulse speed and color based on distance
    // < 10m: VERY HOT (Fast, Red)
    // 10-50m: WARM (Medium, Orange/Yellow)
    // > 50m: COLD (Slow, Blue)

    const getPulseConfig = (d: number) => {
        if (d < 10) return { duration: 500, color: "#FF3B30" }; // Red
        if (d < 50) return { duration: 1000, color: "#FFCC00" }; // Yellow
        return { duration: 2000, color: "#007AFF" }; // Blue
    };

    const { duration, color } = getPulseConfig(distance);

    useEffect(() => {
        // Reset and restart animation when configuration changes
        scale.value = 1;
        opacity.value = 0.5;

        scale.value = withRepeat(
            withTiming(2.5, { duration, easing: Easing.out(Easing.ease) }),
            -1,
            false,
        );

        opacity.value = withRepeat(
            withSequence(
                withTiming(0, { duration, easing: Easing.out(Easing.ease) }),
                withTiming(0.5, { duration: 0 }), // Reset opacity
            ),
            -1,
            false,
        );
    }, [distance]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            opacity: opacity.value,
            backgroundColor: color, // Direct color assignment for simplicity or use interpolateColor if needed
        };
    });

    const centerCircleStyle = {
        backgroundColor: color,
    };

    return (
        <View style={styles.container}>
            {/* Pulsing Ring */}
            <Animated.View style={[styles.pulseRing, animatedStyle]} />

            {/* Center Anchor */}
            <View style={[styles.centerCircle, centerCircleStyle]}>
                <Text style={styles.distanceText}>{Math.round(distance)}m</Text>
            </View>

            <Text style={styles.statusText}>
                {distance < 10 ? "You're close!" : "Keep walking..."}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
    },
    pulseRing: {
        width: 100,
        height: 100,
        borderRadius: 50,
        position: "absolute",
    },
    centerCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    distanceText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    statusText: {
        marginTop: 150,
        color: "#fff",
        fontSize: 24,
        fontWeight: "300",
        letterSpacing: 2,
        textTransform: "uppercase",
    },
});
