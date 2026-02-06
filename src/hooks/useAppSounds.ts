import { useAudioPlayer } from "expo-audio";

export const useAppSounds = () => {
    const milestonePlayer = useAudioPlayer(
        require("../assets/sounds/milestone.mp3"),
    );
    const startPlayer = useAudioPlayer(require("../assets/sounds/start.mp3"));
    const arrivedPlayer = useAudioPlayer(
        require("../assets/sounds/arrived.mp3"),
    );
    const cancelledPlayer = useAudioPlayer(
        require("../assets/sounds/cancel.mp3"),
    );

    return {
        milestonePlayer,
        startPlayer,
        arrivedPlayer,
        cancelledPlayer,
    };
};
