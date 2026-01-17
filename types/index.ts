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
  distance: number | null;
  bearing: number | null;
  headingDelta: number | null;
  isArrived: boolean;
}
