import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
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
    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <NavigationOrb distance={distance} />

            <View style={styles.routeInfo}>
                <Text style={styles.routeText}>
                    Target {routeIndex + 1} of {routeTotal}:
                </Text>
                <Text style={styles.targetTitle}>{target.title}</Text>
            </View>

            <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                    impactMedium();
                    onCancel();
                }}
            >
                <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    routeInfo: {
        position: "absolute",
        top: 60,
        left: 20,
        right: 20,
        alignItems: "center",
    },
    routeText: { color: "#aaa", fontSize: 14 },
    targetTitle: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "bold",
        marginTop: 5,
    },
    cancelButton: {
        position: "absolute",
        bottom: 30,
        alignSelf: "center",
        backgroundColor: "#333",
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 10,
    },
    cancelButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
