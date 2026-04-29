// Heraklion (HER) and Chania (CHQ) airport coordinates
const AIRPORTS = [
  { lng: 25.1809, lat: 35.3397 }, // HER — Ηράκλειο
  { lng: 24.1497, lat: 35.5317 }, // CHQ — Χανιά
];

// Heraklion and Chania port coordinates
const PORTS = [
  { lng: 25.1530, lat: 35.3480 }, // Ηράκλειο λιμάνι (passenger terminal)
  { lng: 24.0700, lat: 35.4890 }, // Σούδα (λιμάνι Χανίων)
];

const AIRPORT_RADIUS = 0.03; // ~3 km
const PORT_RADIUS = 0.008;  // ~800 m

const isNearPoints = (coords: unknown, points: { lng: number; lat: number }[], radius: number): boolean => {
  // Handle GeoJSON format: coordinates.coordinates = [lng, lat]
  if (coords && typeof coords === 'object' && 'coordinates' in (coords as Record<string, unknown>)) {
    const arr = (coords as { coordinates: number[] }).coordinates;
    if (Array.isArray(arr) && arr.length >= 2) {
      const [lng, lat] = arr;
      return points.some(
        p => Math.abs(lng - p.lng) < radius && Math.abs(lat - p.lat) < radius
      );
    }
  }
  // Handle { lat, lng } format
  if (coords && typeof coords === 'object' && 'lat' in (coords as Record<string, unknown>)) {
    const { lat, lng } = coords as { lat: number; lng: number };
    if (typeof lat === 'number' && typeof lng === 'number') {
      return points.some(
        p => Math.abs(lng - p.lng) < radius && Math.abs(lat - p.lat) < radius
      );
    }
  }
  return false;
};

const isPortByText = (address: string): boolean => {
  const lower = address.toLowerCase();
  return lower.includes('λιμάνι') || lower.includes('λιμένα') || lower.includes('λιμάνι')
    || lower.includes('σούδα') || lower.includes('souda');
};

/** Only airports — used for flight info fields */
export const isAirportAddress = (address: string, coordinates?: unknown): boolean => {
  const lower = address.toLowerCase();
  // Explicit airport keywords win over anything else (e.g. "Soudas" in airport road name)
  if (lower.includes('αεροδρόμι') || lower.includes('airport')
    || lower.includes('(her)') || lower.includes('(chq)')) {
    return true;
  }
  // If text clearly says port (and NOT airport), it's not an airport
  if (isPortByText(address)) return false;
  // Coordinate check: only if not near a port (ports can be close to airports)
  if (coordinates) {
    if (isNearPoints(coordinates, PORTS, PORT_RADIUS)) return false;
    if (isNearPoints(coordinates, AIRPORTS, AIRPORT_RADIUS)) return true;
  }
  return false;
};

/** Airports + ports — used for red indicator in calendar/admin */
export const isTransportHub = (address: string, coordinates?: unknown): boolean => {
  if (isAirportAddress(address, coordinates)) return true;
  const lower = address.toLowerCase();
  if (lower.includes('λιμάνι') || lower.includes('λιμένα') || lower.includes('port')
    || lower.includes('σούδα') || lower.includes('souda')) {
    return true;
  }
  if (coordinates && isNearPoints(coordinates, PORTS, PORT_RADIUS)) return true;
  return false;
};
