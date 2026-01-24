import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AudioNode } from "../types";
import { AudioPlayer } from "../components/AudioPlayer";

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
    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.arrivedContainer}>
                <Text style={styles.arrivedText}>You have arrived!</Text>
                <Text style={styles.arrivedSubText}>at {target.title}</Text>

                {target.audioUrl ? (
                    <AudioPlayer node={target} onClose={onNext} />
                ) : (
                    <TouchableOpacity
                        style={styles.nextButton}
                        onPress={onNext}
                    >
                        <Text style={styles.nextButtonText}>
                            Proceed to Next Target
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.stopButton} onPress={onEnd}>
                    <Text style={styles.stopButtonText}>End Route</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    arrivedContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
        padding: 20,
    },
    arrivedText: {
        color: "#4CAF50",
        fontSize: 32,
        fontWeight: "bold",
        marginBottom: 10,
    },
    arrivedSubText: { color: "#fff", fontSize: 20, marginBottom: 40 },
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
