import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, DirectionsRenderer, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from '../common/GoogleMapsProvider';

interface RouteMapProps {
  pickupCoords: { lat: number; lng: number };
  dropoffCoords: { lat: number; lng: number };
}

const containerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '12px',
};

const RouteMap = ({ pickupCoords, dropoffCoords }: RouteMapProps) => {
  const { isLoaded } = useGoogleMaps();
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  const fetchRoute = useCallback(() => {
    if (!isLoaded) return;
    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin: pickupCoords,
        destination: dropoffCoords,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        }
      }
    );
  }, [isLoaded, pickupCoords.lat, pickupCoords.lng, dropoffCoords.lat, dropoffCoords.lng]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  if (!isLoaded) return null;

  const center = {
    lat: (pickupCoords.lat + dropoffCoords.lat) / 2,
    lng: (pickupCoords.lng + dropoffCoords.lng) / 2,
  };

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={10}
      mapTypeId="satellite"
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeId: 'satellite',
        gestureHandling: 'greedy',
      }}
    >
      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: '#3b82f6',
              strokeWeight: 5,
              strokeOpacity: 0.8,
            },
          }}
        />
      )}
      <Marker
        position={pickupCoords}
        label={{ text: '1', color: '#fff', fontWeight: 'bold', fontSize: '14px' }}
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 16,
          fillColor: '#22c55e',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        }}
      />
      <Marker
        position={dropoffCoords}
        label={{ text: '2', color: '#fff', fontWeight: 'bold', fontSize: '14px' }}
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 16,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        }}
      />
    </GoogleMap>
  );
};

export default RouteMap;
