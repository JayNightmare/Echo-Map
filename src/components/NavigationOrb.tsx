import React, { useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
} from "react-native-reanimated";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "react-native-paper";

interface NavigationOrbProps {
    distance: number; // meters
    headingDelta: number | null;
}

export const NavigationOrb: React.FC<NavigationOrbProps> = ({
    distance,
    headingDelta,
}) => {
    const theme = useTheme();
    // Shared values for animation
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.3);
    const rotation = useSharedValue(0);

    // Determine pulse speed and color based on distance
    // < 10m: VERY HOT (Fast, Red)
    // 10-50m: WARM (Medium, Orange/Yellow)
    // > 50m: COLD (Slow, Blue)

    const getPulseConfig = (d: number) => {
        if (d < 10) return { duration: 500, color: theme.colors.error }; // Red-ish from theme or custom
        if (d < 80) return { duration: 1000, color: theme.colors.tertiary }; // Yellow-ish
        return { duration: 2000, color: theme.colors.primary }; // Blue-ish
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
    }, [distance, color, duration]);

    useEffect(() => {
        if (headingDelta !== null) {
            rotation.value = withTiming(headingDelta, { duration: 300 });
        }
    }, [headingDelta]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            opacity: opacity.value,
            backgroundColor: color,
        };
    });

    const arrowAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${rotation.value}deg` }],
        };
    });

    const centerCircleStyle = {
        backgroundColor: color,
        borderColor: theme.colors.background,
        borderWidth: 2,
    };

    const formatDistance = (d: number) => {
        if (d >= 900) {
            return `${(d / 1000).toFixed(1)} km`;
        }
        return `${Math.round(d)} m`;
    };

    return (
        <View style={styles.container}>
            <Text
                style={[
                    styles.distanceText,
                    { color: theme.colors.onBackground },
                ]}
            >
                {formatDistance(distance)}
            </Text>

            <View style={styles.orbContainer}>
                {/* Pulsing Ring */}
                <Animated.View style={[styles.pulseRing, animatedStyle]} />

                {/* Center Anchor */}
                <View style={[styles.centerCircle, centerCircleStyle]}>
                    {headingDelta !== null && (
                        <Animated.View style={arrowAnimatedStyle}>
                            <MaterialCommunityIcons
                                name="arrow-up"
                                size={32}
                                color={theme.colors.background} // Contrast with the circle color
                            />
                        </Animated.View>
                    )}
                </View>
            </View>

            <Text style={[styles.statusText, { color: theme.colors.outline }]}>
                {distance < 10 ? "You're close!" : "Keep moving..."}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    distanceText: {
        fontSize: 48,
        fontWeight: "bold",
        marginBottom: 40,
        fontVariant: ["tabular-nums"],
    },
    orbContainer: {
        width: 100,
        height: 100,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 40,
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
    statusText: {
        fontSize: 18,
        fontWeight: "500",
        letterSpacing: 1,
        textTransform: "uppercase",
    },
});
