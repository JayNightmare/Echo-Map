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
    routeIndex: number;
    routeTotal: number;
    onCancel: () => void;
}

export const NavigationScreen: React.FC<NavigationScreenProps> = ({
    target,
    distance,
    routeIndex,
    routeTotal,
    onCancel,
}) => {
    const { impactMedium } = useHaptics();
    const theme = useTheme();

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: theme.colors.background },
            ]}
        >
            <StatusBar style={theme.dark ? "light" : "dark"} />
            <NavigationOrb distance={distance} />

            <View style={styles.routeInfo}>
                <Text
                    style={[
                        styles.routeText,
                        { color: theme.colors.onSurfaceVariant },
                    ]}
                >
                    Target {routeIndex + 1} of {routeTotal}:
                </Text>
                <Text
                    style={[
                        styles.targetTitle,
                        { color: theme.colors.onBackground },
                    ]}
                >
                    {target.title}
                </Text>
            </View>

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
                    Cancel
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    routeInfo: {
        position: "absolute",
        top: 60,
        left: 20,
        right: 20,
        alignItems: "center",
    },
    routeText: { fontSize: 14 },
    targetTitle: {
        fontSize: 24,
        fontWeight: "bold",
        marginTop: 5,
    },
    cancelButton: {
        position: "absolute",
        bottom: 30,
        alignSelf: "center",
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 10,
    },
    cancelButtonText: { fontSize: 16, fontWeight: "bold" },
});
