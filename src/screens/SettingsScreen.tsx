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
                <IconButton icon="arrow-left" size={24} onPress={onClose} />
                <Text variant="headlineSmall" style={styles.title}>
                    Settings
                </Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <List.Section>
                    <List.Subheader>Appearance</List.Subheader>
                    <List.Item
                        title="Dark Mode"
                        description="Switch app theme"
                        left={(props) => (
                            <List.Icon {...props} icon="theme-light-dark" />
                        )}
                        right={() => (
                            <Switch
                                value={theme === "dark"}
                                onValueChange={toggleTheme}
                            />
                        )}
                    />
                    <Divider />
                    <List.Item
                        title="Dark Map"
                        description="Switch map style"
                        left={(props) => <List.Icon {...props} icon="map" />}
                        right={() => (
                            <Switch
                                value={mapStyle === "dark"}
                                onValueChange={toggleMapStyle}
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
                                onValueChange={toggleAudio}
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
                                onValueChange={toggleHaptics}
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
