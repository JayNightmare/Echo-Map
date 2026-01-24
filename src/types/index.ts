export interface AudioNode {
    id: string;
    title: string;
    latitude: number;
    longitude: number;
    audioUrl: string;
}

export interface UserLocation {
    latitude: number;
    longitude: number;
    heading: number | null;
}

export interface NavigationState {
    activeTarget: AudioNode | null;
    activeRoute: AudioNode[]; // List of targets in order
    currentTargetIndex: number; // Current index in the route
    distance: number | null;
    bearing: number | null;
    headingDelta: number | null;
    isArrived: boolean;
}

export interface MapSelectionScreenProps {
    userLocation: UserLocation;
    audioNodes: AudioNode[];
    activeRoute: AudioNode[];
    onAddToRoute: (node: AudioNode) => void;
    onStartNavigation: () => void;
    onCancel: () => void;
    onOpenSettings: () => void;
}
