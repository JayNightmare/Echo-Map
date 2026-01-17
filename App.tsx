import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Alert, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';

import { AudioNode, UserLocation, NavigationState } from './types';
import { CompassOverlay } from './components/CompassOverlay';
import { AudioPlayer } from './components/AudioPlayer';
import {
  calculateDistance,
  calculateBearing,
  calculateBearingDelta,
  getHapticParams,
} from './utils/geolocation';
import audioNodesData from './data/audioNodes.json';

const ARRIVAL_THRESHOLD = 10; // meters
const HEADING_TOLERANCE = 15; // degrees

export default function App() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [navigationState, setNavigationState] = useState<NavigationState>({
    activeTarget: null,
    distance: null,
    bearing: null,
    headingDelta: null,
    isArrived: false,
  });
  const [audioNodes] = useState<AudioNode[]>(audioNodesData);
  const [sonarSound, setSonarSound] = useState<Audio.Sound | null>(null);
  const [isOnTrack, setIsOnTrack] = useState(false);

  const hapticIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const magnetometerSubscriptionRef = useRef<{ remove: () => void } | null>(null);

  // Initialize audio
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });
  }, []);

  // Request permissions and start tracking
  useEffect(() => {
    (async () => {
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use EchoMap.');
        return;
      }

      // Start location tracking
      locationSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5,
          timeInterval: 1000,
        },
        (location) => {
          setUserLocation((prev) => ({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            heading: prev?.heading ?? null,
          }));
        }
      );

      // Start magnetometer
      magnetometerSubscriptionRef.current = Magnetometer.addListener((data) => {
        const { x, y } = data;
        let heading = (Math.atan2(y, x) * 180) / Math.PI;
        heading = (heading + 360) % 360;
        
        setUserLocation((prev) => {
          if (!prev) return null;
          return { ...prev, heading };
        });
      });

      Magnetometer.setUpdateInterval(100);
    })();

    return () => {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
      }
      if (magnetometerSubscriptionRef.current) {
        magnetometerSubscriptionRef.current.remove();
      }
      if (hapticIntervalRef.current) {
        clearInterval(hapticIntervalRef.current);
      }
      if (sonarSound) {
        sonarSound.unloadAsync();
      }
    };
  }, []);

  // Update navigation state when location or target changes
  useEffect(() => {
    if (!userLocation || !navigationState.activeTarget) {
      setNavigationState((prev) => ({
        ...prev,
        distance: null,
        bearing: null,
        headingDelta: null,
        isArrived: false,
      }));
      return;
    }

    const target = navigationState.activeTarget;
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      target.latitude,
      target.longitude
    );

    const bearing = calculateBearing(
      userLocation.latitude,
      userLocation.longitude,
      target.latitude,
      target.longitude
    );

    const headingDelta =
      userLocation.heading !== null
        ? calculateBearingDelta(userLocation.heading, bearing)
        : null;

    const isArrived = distance < ARRIVAL_THRESHOLD;

    setNavigationState((prev) => ({
      ...prev,
      distance,
      bearing,
      headingDelta,
      isArrived,
    }));
  }, [userLocation, navigationState.activeTarget]);

  // Handle directional feedback (sonar sound)
  useEffect(() => {
    if (!navigationState.activeTarget || navigationState.isArrived) {
      setIsOnTrack(false);
      if (sonarSound) {
        sonarSound.stopAsync();
      }
      return;
    }

    const headingDelta = navigationState.headingDelta;
    if (headingDelta !== null && Math.abs(headingDelta) <= HEADING_TOLERANCE) {
      if (!isOnTrack) {
        setIsOnTrack(true);
        playSonarSound();
      }
    } else {
      if (isOnTrack) {
        setIsOnTrack(false);
        if (sonarSound) {
          sonarSound.stopAsync();
        }
      }
    }
  }, [navigationState.headingDelta, navigationState.isArrived, navigationState.activeTarget]);

  // Handle haptic feedback based on distance
  useEffect(() => {
    if (hapticIntervalRef.current) {
      clearInterval(hapticIntervalRef.current);
      hapticIntervalRef.current = null;
    }

    if (!navigationState.activeTarget || navigationState.isArrived || navigationState.distance === null) {
      return;
    }

    const { interval, intensity } = getHapticParams(navigationState.distance);

    const triggerHaptic = () => {
      if (intensity === 'light') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (intensity === 'medium') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    };

    triggerHaptic();
    hapticIntervalRef.current = setInterval(triggerHaptic, interval);

    return () => {
      if (hapticIntervalRef.current) {
        clearInterval(hapticIntervalRef.current);
      }
    };
  }, [navigationState.distance, navigationState.isArrived, navigationState.activeTarget]);

  const playSonarSound = async () => {
    try {
      if (sonarSound) {
        await sonarSound.replayAsync();
        await sonarSound.setIsLoopingAsync(true);
      } else {
        // For now, we'll just use haptics for feedback
        // In production, you would load an actual sonar sound file here
        // const { sound } = await Audio.Sound.createAsync(
        //   require('./assets/sonar.mp3'),
        //   { shouldPlay: true, isLooping: true }
        // );
        // setSonarSound(sound);
        console.log('Sonar sound would play here - using haptics for feedback');
      }
    } catch (error) {
      console.log('Sonar sound not available, using haptics only');
    }
  };

  const handleMarkerPress = (node: AudioNode) => {
    setNavigationState((prev) => ({
      ...prev,
      activeTarget: node,
      isArrived: false,
    }));
    Alert.alert('Target Set', `Navigating to ${node.title}`);
  };

  const handleClosePlayer = () => {
    setNavigationState({
      activeTarget: null,
      distance: null,
      bearing: null,
      headingDelta: null,
      isArrived: false,
    });
  };

  if (!userLocation) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation
        showsMyLocationButton
        followsUserLocation
      >
        {audioNodes.map((node) => (
          <Marker
            key={node.id}
            coordinate={{
              latitude: node.latitude,
              longitude: node.longitude,
            }}
            title={node.title}
            onPress={() => handleMarkerPress(node)}
          >
            <View style={styles.markerContainer}>
              <Text style={styles.markerIcon}>🎵</Text>
            </View>
          </Marker>
        ))}

        {navigationState.activeTarget && (
          <Polyline
            coordinates={[
              {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              },
              {
                latitude: navigationState.activeTarget.latitude,
                longitude: navigationState.activeTarget.longitude,
              },
            ]}
            strokeColor="#4CAF50"
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapView>

      {navigationState.activeTarget && !navigationState.isArrived && (
        <>
          <CompassOverlay
            bearing={navigationState.bearing}
            heading={userLocation.heading}
          />
          
          <View style={styles.statusBar}>
            <Text style={styles.statusText}>
              Target: {navigationState.activeTarget.title}
            </Text>
            <Text style={styles.distanceText}>
              {navigationState.distance !== null
                ? `${Math.round(navigationState.distance)}m away`
                : 'Calculating...'}
            </Text>
            {isOnTrack && (
              <Text style={styles.onTrackText}>✓ On Track</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setNavigationState((prev) => ({ ...prev, activeTarget: null }))}
          >
            <Text style={styles.cancelButtonText}>Cancel Navigation</Text>
          </TouchableOpacity>
        </>
      )}

      {navigationState.isArrived && navigationState.activeTarget && (
        <AudioPlayer node={navigationState.activeTarget} onClose={handleClosePlayer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  markerContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerIcon: {
    fontSize: 24,
  },
  statusBar: {
    position: 'absolute',
    top: 220,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 250,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  distanceText: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: 'bold',
  },
  onTrackText: {
    color: '#4CAF50',
    fontSize: 14,
    marginTop: 5,
  },
  cancelButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#f44336',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
