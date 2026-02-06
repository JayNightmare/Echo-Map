import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect,
} from "react";
import { useColorScheme } from "react-native";
import {
    getFromStorage,
    saveToStorage,
    removeFromStorage,
    STORAGE_KEYS,
} from "../utils/storage";

interface SettingsContextType {
    // Appearance
    theme: "light" | "dark";
    toggleTheme: () => void;
    mapStyle: "light" | "dark";
    toggleMapStyle: () => void;
    setAppTheme: (mode: "light" | "dark") => void;

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

    // Settings State
    const [useSystemTheme, setUseSystemTheme] = useState(true);
    const [theme, setTheme] = useState<"light" | "dark">(
        systemColorScheme === "dark" ? "dark" : "light",
    );
    const [mapStyle, setMapStyle] = useState<"light" | "dark">(
        systemColorScheme === "dark" ? "dark" : "light",
    );

    const [audioEnabled, setAudioEnabled] = useState(true);
    const [hapticsEnabled, setHapticsEnabled] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load Settings
    useEffect(() => {
        const loadSettings = async () => {
            const saved = await getFromStorage<any>(STORAGE_KEYS.SETTINGS);
            if (saved) {
                setUseSystemTheme(saved.useSystemTheme ?? false);
                setTheme(saved.theme);
                setMapStyle(saved.mapStyle);
                setAudioEnabled(saved.audioEnabled ?? true);
                setHapticsEnabled(saved.hapticsEnabled ?? true);
            }
            setIsLoaded(true);
        };
        loadSettings();
    }, []);

    // Sync with System (if allowed)
    useEffect(() => {
        if (isLoaded && useSystemTheme) {
            const mode = systemColorScheme === "dark" ? "dark" : "light";
            setTheme(mode);
            setMapStyle(mode);
        }
    }, [systemColorScheme, useSystemTheme, isLoaded]);

    // Persistence Helper
    const saveSettings = async (updates: any) => {
        const newState = {
            useSystemTheme: updates.useSystemTheme ?? useSystemTheme,
            theme: updates.theme ?? theme,
            mapStyle: updates.mapStyle ?? mapStyle,
            audioEnabled: updates.audioEnabled ?? audioEnabled,
            hapticsEnabled: updates.hapticsEnabled ?? hapticsEnabled,
        };
        await saveToStorage(STORAGE_KEYS.SETTINGS, newState);
    };

    const toggleTheme = () => {
        setTheme((prev) => {
            const next = prev === "light" ? "dark" : "light";
            setUseSystemTheme(false);
            saveSettings({ theme: next, useSystemTheme: false });
            return next;
        });
    };

    const toggleMapStyle = () => {
        setMapStyle((prev) => {
            const next = prev === "light" ? "dark" : "light";
            setUseSystemTheme(false);
            saveSettings({ mapStyle: next, useSystemTheme: false });
            return next;
        });
    };

    const setAppTheme = (mode: "light" | "dark") => {
        setTheme(mode);
        setMapStyle(mode);
        setUseSystemTheme(false);
        saveSettings({
            theme: mode,
            mapStyle: mode,
            useSystemTheme: false,
        });
    };

    const toggleAudio = () => {
        setAudioEnabled((prev) => {
            const next = !prev;
            saveSettings({ audioEnabled: next });
            return next;
        });
    };

    const toggleHaptics = () => {
        setHapticsEnabled((prev) => {
            const next = !prev;
            saveSettings({ hapticsEnabled: next });
            return next;
        });
    };

    const clearAllData = () => {
        // Reset local settings to system default
        const mode = systemColorScheme === "dark" ? "dark" : "light";
        setUseSystemTheme(true);
        setTheme(mode);
        setMapStyle(mode);
        setAudioEnabled(true);
        setHapticsEnabled(true);

        removeFromStorage(STORAGE_KEYS.SETTINGS);

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
                setAppTheme,
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
