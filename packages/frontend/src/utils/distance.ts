import { LOCATIONS_DATA } from '../data/locations';

const ROAD_FACTOR = 1.35;

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate road distance between two locations by their Greek name.
 * Returns distance in km rounded to nearest integer, or null if either location is not found.
 */
export function estimateRoadDistance(pickupGreek: string, dropoffGreek: string): number | null {
  const pickup = LOCATIONS_DATA.find((l) => l.greek === pickupGreek);
  const dropoff = LOCATIONS_DATA.find((l) => l.greek === dropoffGreek);
  if (!pickup || !dropoff) return null;
  if (pickup.key === dropoff.key) return 0;
  const straight = haversineDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
  return Math.round(straight * ROAD_FACTOR);
}

/**
 * Estimate road distance from raw coordinates.
 * Returns distance in km rounded to nearest integer, or null if coordinates are invalid.
 */
export function estimateRoadDistanceFromCoords(
  lat1: number, lng1: number, lat2: number, lng2: number
): number | null {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null;
  if (lat1 === lat2 && lng1 === lng2) return 0;
  const straight = haversineDistance(lat1, lng1, lat2, lng2);
  return Math.round(straight * ROAD_FACTOR);
}
