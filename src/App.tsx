import React, { useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useEchoLocation } from "./hooks/useEchoLocation";
import { useEchoNavigation } from "./hooks/useEchoNavigation";
import { IdleScreen } from "./screens/IdleScreen";
import { MapSelectionScreen } from "./screens/MapSelectionScreen";
import { NavigationScreen } from "./screens/NavigationScreen";
import { ArrivalScreen } from "./screens/ArrivalScreen";

import audioNodesData from "./data/audioNodes.json";

import { SettingsProvider, useSettings } from "./context/SettingsContext";
import { SettingsScreen } from "./screens/SettingsScreen";
import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

function AppContent() {
    const userLocation = useEchoLocation();
    const { theme } = useSettings();

    // UI State
    const [isSelectingLocation, setIsSelectingLocation] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isStarted, setIsStarted] = useState(false);

    const {
        state: navState,
        addToRoute,
        startRoute,
        proceedToNextTarget,
        clearNavigation: hookClearNavigation,
    } = useEchoNavigation({
        userLocation,
        isStarted,
    });

    const handleStartNavigation = () => {
        const success = startRoute();
        if (success) {
            setIsStarted(true);
            setIsSelectingLocation(false);
        }
    };

    const handleClearNavigation = () => {
        hookClearNavigation();
        setIsStarted(false);
        setIsSelectingLocation(false);
    };

    // Render Logic
    const renderContent = () => {
        if (isSettingsOpen) {
            return <SettingsScreen onClose={() => setIsSettingsOpen(false)} />;
        }

        if (!userLocation) {
            return (
                <View style={styles.loading}>
                    <Text style={styles.loadingText}>
                        Loading your location...
                    </Text>
                </View>
            );
        }

        if (isSelectingLocation) {
            return (
                <MapSelectionScreen
                    userLocation={userLocation}
                    audioNodes={audioNodesData}
                    activeRoute={navState.activeRoute}
                    onAddToRoute={addToRoute}
                    onStartNavigation={handleStartNavigation}
                    onCancel={handleClearNavigation}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                />
            );
        }

        if (isStarted) {
            if (navState.isArrived && navState.activeTarget) {
                return (
                    <ArrivalScreen
                        target={navState.activeTarget}
                        onNext={proceedToNextTarget}
                        onEnd={handleClearNavigation}
                    />
                );
            }

            if (navState.activeTarget && navState.distance !== null) {
                return (
                    <NavigationScreen
                        target={navState.activeTarget}
                        distance={navState.distance}
                        routeIndex={navState.currentTargetIndex}
                        routeTotal={navState.activeRoute.length}
                        onCancel={handleClearNavigation}
                    />
                );
            }
        }

        return (
            <IdleScreen
                onStart={() => setIsSelectingLocation(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
            />
        );
    };

    const paperTheme = theme === "dark" ? MD3DarkTheme : MD3LightTheme;

    return (
        <PaperProvider theme={paperTheme}>
            <SafeAreaProvider>
                <View
                    style={[
                        styles.container,
                        { backgroundColor: paperTheme.colors.background },
                    ]}
                >
                    {renderContent()}
                </View>
            </SafeAreaProvider>
        </PaperProvider>
    );
}

export default function App() {
    // Lift state up or use a ref if needed, but for now we rely on the context to trigger the clear
    // However, the context needs to call a function here to clear *navigation* state.
    // Since useEchoNavigation is inside AppContent, we need a way to reach it.
    // For simplicity in this refactor step, we can pass a dummy or implement a ref approach later.
    // But wait! SettingsProvider needs onClearData prop.
    // We should move the state holding component inside the provider.

    // Actually, let's keep it simple. We can make a wrapper component that holds the provider.

    return <AppWrapper />;
}

function AppWrapper() {
    // We need a ref or state to trigger navigation clearing from the Context
    const [clearTrigger, setClearTrigger] = useState(0);

    const handleClearData = () => {
        setClearTrigger((prev) => prev + 1);
    };

    return (
        <SettingsProvider onClearData={handleClearData}>
            <AppContentWithClearTrigger clearTrigger={clearTrigger} />
        </SettingsProvider>
    );
}

function AppContentWithClearTrigger({
    clearTrigger,
}: {
    clearTrigger: number;
}) {
    const userLocation = useEchoLocation();
    const { theme } = useSettings();

    // UI State
    const [isSelectingLocation, setIsSelectingLocation] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isStarted, setIsStarted] = useState(false);

    const {
        state: navState,
        addToRoute,
        startRoute,
        proceedToNextTarget,
        clearNavigation: hookClearNavigation,
    } = useEchoNavigation({
        userLocation,
        isStarted,
    });

    // React to the clear trigger
    React.useEffect(() => {
        if (clearTrigger > 0) {
            hookClearNavigation();
            setIsStarted(false);
            setIsSelectingLocation(false);
            // also close settings if open? optional.
            setIsSettingsOpen(false);
        }
    }, [clearTrigger]);

    const handleStartNavigation = () => {
        const success = startRoute();
        if (success) {
            setIsStarted(true);
            setIsSelectingLocation(false);
        }
    };

    const handleClearNavigation = () => {
        hookClearNavigation();
        setIsStarted(false);
        setIsSelectingLocation(false);
    };

    // Render Logic
    const renderContent = () => {
        if (isSettingsOpen) {
            return <SettingsScreen onClose={() => setIsSettingsOpen(false)} />;
        }

        if (!userLocation) {
            return (
                <View style={styles.loading}>
                    <Text style={styles.loadingText}>
                        Loading your location...
                    </Text>
                </View>
            );
        }

        if (isSelectingLocation) {
            return (
                <MapSelectionScreen
                    userLocation={userLocation}
                    audioNodes={audioNodesData}
                    activeRoute={navState.activeRoute}
                    onAddToRoute={addToRoute}
                    onStartNavigation={handleStartNavigation}
                    onCancel={handleClearNavigation}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                />
            );
        }

        if (isStarted) {
            if (navState.isArrived && navState.activeTarget) {
                return (
                    <ArrivalScreen
                        target={navState.activeTarget}
                        onNext={proceedToNextTarget}
                        onEnd={handleClearNavigation}
                    />
                );
            }

            if (navState.activeTarget && navState.distance !== null) {
                return (
                    <NavigationScreen
                        target={navState.activeTarget}
                        distance={navState.distance}
                        routeIndex={navState.currentTargetIndex}
                        routeTotal={navState.activeRoute.length}
                        onCancel={handleClearNavigation}
                    />
                );
            }
        }

        return (
            <IdleScreen
                onStart={() => setIsSelectingLocation(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
            />
        );
    };

    const paperTheme = theme === "dark" ? MD3DarkTheme : MD3LightTheme;

    return (
        <PaperProvider theme={paperTheme}>
            <SafeAreaProvider>
                <View
                    style={[
                        styles.container,
                        { backgroundColor: paperTheme.colors.background },
                    ]}
                >
                    <StatusBar style={theme === "dark" ? "light" : "dark"} />
                    {renderContent()}
                </View>
            </SafeAreaProvider>
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    loading: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
    },
    loadingText: { color: "#fff", fontSize: 18 },
});
