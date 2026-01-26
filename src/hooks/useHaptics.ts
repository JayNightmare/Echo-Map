import * as Haptics from "expo-haptics";
import { useSettings } from "../context/SettingsContext";

export const useHaptics = () => {
    const { hapticsEnabled } = useSettings();

    const selection = () => {
        if (hapticsEnabled) {
            Haptics.selectionAsync();
        }
    };

    const impactLight = () => {
        if (hapticsEnabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const impactMedium = () => {
        if (hapticsEnabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    };

    const impactHeavy = () => {
        if (hapticsEnabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
    };

    const notificationSuccess = () => {
        if (hapticsEnabled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const notificationError = () => {
        if (hapticsEnabled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    return {
        selection,
        impactLight,
        impactMedium,
        impactHeavy,
        notificationSuccess,
        notificationError,
    };
};
