import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "react-native-paper";
import { AudioNode } from "../types";
import { NavigationOrb } from "../components/NavigationOrb";
import { useHaptics } from "../hooks/useHaptics";

interface NavigationScreenProps {
    target: AudioNode;
    distance: number;
    headingDelta: number | null;
    isApproaching: boolean;
    routeIndex: number;
    routeTotal: number;
    onCancel: () => void;
    onArrived: () => void;
}

export const NavigationScreen: React.FC<NavigationScreenProps> = ({
    target,
    distance,
    headingDelta,
    isApproaching,
    routeIndex,
    routeTotal,
    onCancel,
    onArrived,
}) => {
    const { impactMedium, notificationSuccess: success } = useHaptics();
    const theme = useTheme();

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: theme.colors.background },
            ]}
        >
            <StatusBar style={theme.dark ? "light" : "dark"} />
            <NavigationOrb distance={distance} headingDelta={headingDelta} />

            <View style={styles.routeHeader}>
                <Text
                    style={[
                        styles.routeText,
                        { color: theme.colors.onSurfaceVariant },
                    ]}
                >
                    Target {routeIndex + 1} of {routeTotal}
                </Text>
                <Text
                    style={[
                        styles.targetTitle,
                        { color: theme.colors.onBackground },
                    ]}
                    numberOfLines={2}
                >
                    {target.title}
                </Text>
            </View>

            {isApproaching && (
                <TouchableOpacity
                    style={[
                        styles.arrivedButton,
                        { backgroundColor: theme.colors.primary },
                    ]}
                    onPress={() => {
                        success();
                        onArrived();
                    }}
                >
                    <Text
                        style={[
                            styles.arrivedButtonText,
                            { color: theme.colors.onPrimary },
                        ]}
                    >
                        Arrived Yet?
                    </Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                style={[
                    styles.cancelButton,
                    { backgroundColor: theme.colors.elevation.level3 },
                ]}
                onPress={() => {
                    impactMedium();
                    onCancel();
                }}
            >
                <Text
                    style={[
                        styles.cancelButtonText,
                        { color: theme.colors.onSurface },
                    ]}
                >
                    Cancel Trip
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    routeHeader: {
        position: "absolute",
        top: 60,
        left: 20,
        right: 20,
        alignItems: "center",
    },
    routeText: {
        fontSize: 14,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    targetTitle: {
        fontSize: 28,
        fontWeight: "bold",
        marginTop: 5,
        textAlign: "center",
    },
    arrivedButton: {
        position: "absolute",
        bottom: 100,
        alignSelf: "center",
        paddingHorizontal: 40,
        paddingVertical: 18,
        borderRadius: 30,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    arrivedButtonText: { fontSize: 18, fontWeight: "bold" },
    cancelButton: {
        position: "absolute",
        bottom: 30,
        alignSelf: "center",
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 10,
    },
    cancelButtonText: { fontSize: 16, fontWeight: "500" },
});
