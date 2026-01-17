import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CompassProps {
  bearing: number | null;
  heading: number | null;
}

export const CompassOverlay: React.FC<CompassProps> = ({ bearing, heading }) => {
  if (bearing === null || heading === null) {
    return null;
  }

  // Calculate the relative direction (where to point)
  let relativeBearing = bearing - heading;
  if (relativeBearing < 0) relativeBearing += 360;
  if (relativeBearing > 360) relativeBearing -= 360;

  // Convert to a simple direction
  const getDirection = (angle: number): string => {
    if (angle >= 337.5 || angle < 22.5) return '↑';
    if (angle >= 22.5 && angle < 67.5) return '↗';
    if (angle >= 67.5 && angle < 112.5) return '→';
    if (angle >= 112.5 && angle < 157.5) return '↘';
    if (angle >= 157.5 && angle < 202.5) return '↓';
    if (angle >= 202.5 && angle < 247.5) return '↙';
    if (angle >= 247.5 && angle < 292.5) return '←';
    return '↖';
  };

  return (
    <View style={styles.container}>
      <View style={styles.compassCircle}>
        <Text style={styles.arrow}>{getDirection(relativeBearing)}</Text>
        <Text style={styles.degrees}>{Math.round(relativeBearing)}°</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    zIndex: 10,
  },
  compassCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  arrow: {
    fontSize: 50,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  degrees: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
  },
});
