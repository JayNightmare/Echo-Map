/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Calculate the bearing from one coordinate to another
 * @param lat1 - Latitude of starting point
 * @param lon1 - Longitude of starting point
 * @param lat2 - Latitude of destination point
 * @param lon2 - Longitude of destination point
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number {
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x =
        Math.cos(φ1) * Math.sin(φ2) -
        Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);

    return ((θ * 180) / Math.PI + 360) % 360;
}

/**
 * Calculate the difference between two bearings, accounting for wrap-around
 * @param bearing1 - First bearing in degrees
 * @param bearing2 - Second bearing in degrees
 * @returns Difference in degrees (-180 to 180)
 */
export function calculateBearingDelta(
    bearing1: number,
    bearing2: number,
): number {
    let delta = bearing2 - bearing1;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    return delta;
}

/**
 * Determine haptic feedback parameters based on distance
 * @param distance - Distance to target in meters
 * @returns Object with interval (ms) and intensity
 */
export function getHapticParams(distance: number): {
    interval: number;
    intensity: "light" | "medium" | "heavy";
} {
    if (distance > 500) {
        return { interval: 5000, intensity: "light" };
    } else if (distance > 150) {
        return { interval: 2000, intensity: "medium" };
    } else if (distance > 80) {
        return { interval: 1000, intensity: "medium" };
    } else {
        // 80m or less
        return { interval: 500, intensity: "heavy" };
    }
}
