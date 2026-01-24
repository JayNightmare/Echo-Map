import { useState, useEffect, useCallback } from "react";
import { AudioNode, SavedRoute } from "../types";
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "../utils/storage";

export const useRouteHistory = () => {
    const [history, setHistory] = useState<SavedRoute[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadHistory = useCallback(async () => {
        setIsLoading(true);
        const saved = await getFromStorage<SavedRoute[]>(
            STORAGE_KEYS.ROUTE_HISTORY,
        );
        if (saved) {
            setHistory(saved);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const saveRoute = async (route: AudioNode[], name?: string) => {
        if (route.length === 0) return;

        const newRoute: SavedRoute = {
            id: Date.now().toString(),
            name:
                name ||
                `Route ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
            nodes: route,
            createdAt: Date.now(),
        };

        const updatedHistory = [newRoute, ...history];
        setHistory(updatedHistory);
        await saveToStorage(STORAGE_KEYS.ROUTE_HISTORY, updatedHistory);
    };

    const deleteRoute = async (id: string) => {
        const updatedHistory = history.filter((route) => route.id !== id);
        setHistory(updatedHistory);
        await saveToStorage(STORAGE_KEYS.ROUTE_HISTORY, updatedHistory);
    };

    return {
        history,
        isLoading,
        saveRoute,
        deleteRoute,
        refreshHistory: loadHistory,
    };
};
