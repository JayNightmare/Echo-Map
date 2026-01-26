import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_KEYS = {
    ROUTE_HISTORY: "ECHO_MAP_ROUTE_HISTORY",
    SETTINGS: "ECHO_MAP_SETTINGS",
};

export const saveToStorage = async <T>(
    key: string,
    value: T,
): Promise<void> => {
    try {
        const jsonValue = JSON.stringify(value);
        await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
        console.error("Error saving data", e);
    }
};

export const getFromStorage = async <T>(key: string): Promise<T | null> => {
    try {
        const jsonValue = await AsyncStorage.getItem(key);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
        console.error("Error reading data", e);
        return null;
    }
};

export const removeFromStorage = async (key: string): Promise<void> => {
    try {
        await AsyncStorage.removeItem(key);
    } catch (e) {
        console.error("Error removing data", e);
    }
};
