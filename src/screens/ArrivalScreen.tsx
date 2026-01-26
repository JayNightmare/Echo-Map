import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "react-native-paper";
import { AudioNode } from "../types";
import { AudioPlayer } from "../components/AudioPlayer";
import { useHaptics } from "../hooks/useHaptics";

interface ArrivalScreenProps {
    target: AudioNode;
    onNext: () => void;
    onEnd: () => void;
}

export const ArrivalScreen: React.FC<ArrivalScreenProps> = ({
    target,
    onNext,
    onEnd,
}) => {
    const { selection, impactMedium } = useHaptics();
    const theme = useTheme();

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: theme.colors.background },
            ]}
        >
            <StatusBar style={theme.dark ? "light" : "dark"} />
            <View
                style={[
                    styles.arrivedContainer,
                    { backgroundColor: theme.colors.background },
                ]}
            >
                <Text style={styles.arrivedText}>You have arrived!</Text>
                <Text
                    style={[
                        styles.arrivedSubText,
                        { color: theme.colors.onBackground },
                    ]}
                >
                    at {target.title}
                </Text>

                {target.audioUrl ? (
                    <AudioPlayer node={target} onClose={onNext} />
                ) : (
                    <TouchableOpacity
                        style={styles.nextButton}
                        onPress={() => {
                            selection();
                            onNext();
                        }}
                    >
                        <Text style={styles.nextButtonText}>
                            Proceed to Next Target
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.stopButton}
                    onPress={() => {
                        impactMedium();
                        onEnd();
                    }}
                >
                    <Text style={styles.stopButtonText}>End Route</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    arrivedContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    arrivedText: {
        color: "#4CAF50",
        fontSize: 32,
        fontWeight: "bold",
        marginBottom: 10,
    },
    arrivedSubText: { fontSize: 20, marginBottom: 40 },
    nextButton: {
        backgroundColor: "#4CAF50",
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 10,
        marginBottom: 20,
    },
    nextButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
    stopButton: { padding: 15 },
    stopButtonText: { color: "#f44336", fontSize: 16 },
});
