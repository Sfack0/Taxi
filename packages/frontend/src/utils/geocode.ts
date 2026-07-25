// Recover coordinates via the Google Geocoder. Used as a fallback when the
// Places API doesn't return a location for a selected place (a transient
// failure, or a place type without geometry), so a booking is never stored
// with empty [0,0] coordinates — which would silently drop the price.

interface LatLng {
  lat: number;
  lng: number;
}

const runGeocode = (request: google.maps.GeocoderRequest): Promise<LatLng | null> =>
  new Promise((resolve) => {
    if (typeof google === 'undefined' || !google.maps?.Geocoder) {
      resolve(null);
      return;
    }
    try {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(request, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location;
          resolve({ lat: loc.lat(), lng: loc.lng() });
        } else {
          resolve(null);
        }
      });
    } catch {
      resolve(null);
    }
  });

/** Precise recovery: a placeId uniquely identifies the selected place. */
export const geocodeByPlaceId = (placeId?: string): Promise<LatLng | null> =>
  placeId ? runGeocode({ placeId }) : Promise.resolve(null);

/** Fallback recovery from the free-text address. */
export const geocodeByAddress = (address?: string): Promise<LatLng | null> =>
  address ? runGeocode({ address }) : Promise.resolve(null);
