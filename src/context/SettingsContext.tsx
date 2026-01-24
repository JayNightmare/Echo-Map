import React, { createContext, useContext, useState, ReactNode } from "react";
import { useColorScheme } from "react-native";

interface SettingsContextType {
    // Appearance
    theme: "light" | "dark";
    toggleTheme: () => void;
    mapStyle: "light" | "dark";
    toggleMapStyle: () => void;

    // Haptics & Audio
    audioEnabled: boolean;
    toggleAudio: () => void;
    hapticsEnabled: boolean;
    toggleHaptics: () => void;

    // Data Management
    clearAllData: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
    undefined,
);

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
};

interface SettingsProviderProps {
    children: ReactNode;
    onClearData: () => void; // Callback provided by App.tsx to handle actual data clearing
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
    children,
    onClearData,
}) => {
    const systemColorScheme = useColorScheme();

    // Default to system theme or light
    const [theme, setTheme] = useState<"light" | "dark">(
        systemColorScheme === "dark" ? "dark" : "light",
    );
    const [mapStyle, setMapStyle] = useState<"light" | "dark">("light");

    const [audioEnabled, setAudioEnabled] = useState(true);
    const [hapticsEnabled, setHapticsEnabled] = useState(true);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    };

    const toggleMapStyle = () => {
        setMapStyle((prev) => (prev === "light" ? "dark" : "light"));
    };

    const toggleAudio = () => {
        setAudioEnabled((prev) => !prev);
    };

    const toggleHaptics = () => {
        setHapticsEnabled((prev) => !prev);
    };

    const clearAllData = () => {
        // Reset local settings if desired
        setTheme(systemColorScheme === "dark" ? "dark" : "light");
        setMapStyle("light");
        setAudioEnabled(true);
        setHapticsEnabled(true);

        // Notify parent to clear app data
        onClearData();
    };

    return (
        <SettingsContext.Provider
            value={{
                theme,
                toggleTheme,
                mapStyle,
                toggleMapStyle,
                audioEnabled,
                toggleAudio,
                hapticsEnabled,
                toggleHaptics,
                clearAllData,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};
