import React from "react";
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import {
    Text,
    List,
    Switch,
    Divider,
    Button,
    useTheme,
    IconButton,
} from "react-native-paper";
import { useSettings } from "../context/SettingsContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useHaptics } from "../hooks/useHaptics";

interface SettingsScreenProps {
    onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
    const {
        theme,
        toggleTheme,
        mapStyle,
        toggleMapStyle,
        audioEnabled,
        toggleAudio,
        hapticsEnabled,
        toggleHaptics,
        clearAllData,
    } = useSettings();
    const { selection, notificationSuccess } = useHaptics();

    const paperTheme = useTheme();

    const handleClearData = () => {
        Alert.alert(
            "Clear All Data",
            "Are you sure you want to reset all app data? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: () => {
                        clearAllData();
                        notificationSuccess();
                        Alert.alert("Success", "All data has been cleared.");
                    },
                },
            ],
        );
    };

    return (
        <SafeAreaView
            style={[
                styles.container,
                { backgroundColor: paperTheme.colors.background },
            ]}
        >
            <StatusBar style={theme === "dark" ? "light" : "dark"} />
            <View style={styles.header}>
                <IconButton
                    icon="arrow-left"
                    size={24}
                    onPress={() => {
                        selection();
                        onClose();
                    }}
                />
                <Text variant="headlineSmall" style={styles.title}>
                    Settings
                </Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <List.Section>
                    <List.Subheader>Appearance</List.Subheader>
                    <Divider />
                    <List.Item
                        title="Dark Mode"
                        description="Switch to Dark Mode"
                        left={(props) => <List.Icon {...props} icon="map" />}
                        right={() => (
                            <Switch
                                value={mapStyle === "dark" && theme === "dark"}
                                onValueChange={() => {
                                    selection();
                                    toggleMapStyle();
                                    toggleTheme();
                                }}
                            />
                        )}
                    />
                </List.Section>

                <List.Section>
                    <List.Subheader>Haptics & Audio</List.Subheader>
                    <List.Item
                        title="Audio"
                        description="Enable sound effects"
                        left={(props) => (
                            <List.Icon {...props} icon="volume-high" />
                        )}
                        right={() => (
                            <Switch
                                value={audioEnabled}
                                onValueChange={() => {
                                    selection();
                                    toggleAudio();
                                }}
                            />
                        )}
                    />
                    <Divider />
                    <List.Item
                        title="Vibration"
                        description="Enable haptic feedback"
                        left={(props) => (
                            <List.Icon {...props} icon="vibrate" />
                        )}
                        right={() => (
                            <Switch
                                value={hapticsEnabled}
                                onValueChange={() => {
                                    selection();
                                    toggleHaptics();
                                }}
                            />
                        )}
                    />
                </List.Section>

                <List.Section>
                    <List.Subheader>Data Management</List.Subheader>
                    <View style={styles.buttonContainer}>
                        <Button
                            mode="contained-tonal"
                            buttonColor={paperTheme.colors.errorContainer}
                            textColor={paperTheme.colors.error}
                            onPress={handleClearData}
                            icon="delete"
                        >
                            Clear All Data
                        </Button>
                    </View>
                </List.Section>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingBottom: 8,
    },
    title: {
        fontWeight: "bold",
    },
    content: {
        paddingBottom: 40,
    },
    buttonContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
});
