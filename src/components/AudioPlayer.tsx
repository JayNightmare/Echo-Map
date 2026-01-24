import React, { useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { useAudioPlayer } from "expo-audio";
import { AudioNode } from "../types";
import { useSettings } from "../context/SettingsContext";

interface AudioPlayerProps {
    node: AudioNode;
    onClose: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ node, onClose }) => {
    const player = useAudioPlayer(node.audioUrl);
    const { audioEnabled } = useSettings();

    const isPlaying = player.playing;
    // Checking loading status availability in expo-audio. Assuming 'ready' or similar might strictly be needed,
    // but for basic migration sticking to player.playing state for UI.
    // If 'loading' state is not directly exposed as a boolean, we might rely on the hook's return.
    // Based on standard new expo APIs, let's assume specific status properties.
    // Actually, let's check if we can just toggle with play/pause.

    useEffect(() => {
        // Auto-play when component mounts if audio is enabled
        if (audioEnabled) {
            player.play();
        }
    }, [player, audioEnabled]);

    const togglePlayback = () => {
        if (isPlaying) {
            player.pause();
        } else {
            player.play();
        }
    };

    const stopAudio = () => {
        player.pause();
        player.seekTo(0);
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>🎵 {node.title}</Text>
                <Text style={styles.subtitle}>You've arrived!</Text>

                <View style={styles.controls}>
                    <TouchableOpacity
                        style={styles.playButton}
                        onPress={togglePlayback}
                    >
                        <Text style={styles.buttonText}>
                            {isPlaying ? "⏸ Pause" : "▶ Play"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.stopButton}
                        onPress={stopAudio}
                    >
                        <Text style={styles.buttonText}>⏹ Reset</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                        player.pause();
                        onClose();
                    }}
                >
                    <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        zIndex: 100,
    },
    content: {
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: "#4CAF50",
        marginBottom: 20,
    },
    controls: {
        flexDirection: "row",
        marginBottom: 20,
    },
    playButton: {
        backgroundColor: "#4CAF50",
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 10,
        marginRight: 10,
    },
    stopButton: {
        backgroundColor: "#f44336",
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 10,
    },
    buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    closeButton: {
        backgroundColor: "#666",
        paddingHorizontal: 40,
        paddingVertical: 12,
        borderRadius: 10,
    },
    closeButtonText: {
        color: "#fff",
        fontSize: 16,
    },
});
