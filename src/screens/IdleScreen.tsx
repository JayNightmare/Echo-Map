import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { IconButton, useTheme } from "react-native-paper";

interface IdleScreenProps {
    onStart: () => void;
    onOpenSettings?: () => void;
}

export const IdleScreen: React.FC<IdleScreenProps> = ({
    onStart,
    onOpenSettings,
}) => {
    const theme = useTheme();

    return (
        <View
            style={[
                styles.idleContainer,
                { backgroundColor: theme.colors.background },
            ]}
        >
            <StatusBar style={theme.dark ? "light" : "dark"} />

            {onOpenSettings && (
                <View style={styles.settingsButton}>
                    <IconButton
                        icon="cog"
                        size={30}
                        iconColor={theme.colors.onBackground}
                        onPress={onOpenSettings}
                    />
                </View>
            )}

            <Text style={[styles.title, { color: theme.colors.onBackground }]}>
                Echo Map
            </Text>
            <Text
                style={[
                    styles.subtitle,
                    { color: theme.colors.onSurfaceVariant },
                ]}
            >
                Plan your journey
            </Text>

            <TouchableOpacity style={styles.selectButton} onPress={onStart}>
                <Text style={styles.selectButtonText}>Select Destination</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    idleContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    settingsButton: {
        position: "absolute",
        top: 50,
        right: 20,
        zIndex: 10,
    },
    title: {
        fontSize: 40,
        fontWeight: "bold",
        marginBottom: 10,
    },
    subtitle: { fontSize: 18, marginBottom: 50 },
    selectButton: {
        backgroundColor: "#4CAF50",
        paddingHorizontal: 40,
        paddingVertical: 20,
        borderRadius: 30,
        elevation: 5,
    },
    selectButtonText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
});
