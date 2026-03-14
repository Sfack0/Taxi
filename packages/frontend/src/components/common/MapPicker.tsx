import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useTranslation } from 'react-i18next';

interface MapPickerResult {
  address: string;
  lat: number;
  lng: number;
}

interface MapPickerProps {
  onSelect: (result: MapPickerResult) => void;
  onClose: () => void;
}

const CRETE_CENTER = { lat: 35.24, lng: 24.9 };

const CRETE_BOUNDS = {
  south: 34.9,
  west: 23.5,
  north: 35.65,
  east: 26.3,
};

const mapContainerStyle = { width: '100%', height: '100%' };

const MapPicker = ({ onSelect, onClose }: MapPickerProps) => {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);


  const getGeocoder = useCallback(() => {
    if (!geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder();
    }
    return geocoderRef.current;
  }, []);

  const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    const latLng = e.latLng;
    if (!latLng) return;

    const lat = latLng.lat();
    const lng = latLng.lng();
    setSelected({ lat, lng });
    setAddress('');
    setLoading(true);

    try {
      const geocoder = getGeocoder();
      const lang = i18n.language?.split('-')[0] || 'el';
      const response = await geocoder.geocode({ location: { lat, lng }, language: lang });
      // Skip results that start with a Plus Code (e.g. "4P4M+79 Timpaki")
      const plusCodeRegex = /^[23456789CFGHJMPQRVWX]{4,}\+/i;
      const best = response.results?.find(
        (r) => !plusCodeRegex.test(r.formatted_address)
      ) || response.results?.[0];
      if (best) {
        setAddress(best.formatted_address);
      } else {
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setLoading(false);
    }
  }, [getGeocoder, i18n.language]);

  const handleConfirm = useCallback(() => {
    if (!selected) return;
    onSelect({
      address: address || `${selected.lat.toFixed(5)}, ${selected.lng.toFixed(5)}`,
      lat: selected.lat,
      lng: selected.lng,
    });
  }, [selected, address, onSelect]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full h-full sm:w-[90vw] sm:max-w-2xl sm:h-[80vh] sm:max-h-[600px] sm:rounded-2xl overflow-hidden bg-white dark:bg-gray-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="p-1 -ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {t('booking.pickFromMap', 'Pick from map')}
          </h3>
          <div className="w-5" />
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={CRETE_CENTER}
            zoom={9}
            onClick={handleMapClick}
            options={{
              restriction: {
                latLngBounds: CRETE_BOUNDS,
                strictBounds: false,
              },
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              zoomControl: true,
              gestureHandling: 'greedy',
            }}
          >
            {selected && <Marker position={selected} />}
          </GoogleMap>

          {/* Hint overlay when no selection */}
          {!selected && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-4 py-2 rounded-full pointer-events-none">
              {t('booking.tapToSelect', 'Tap on the map to select a location')}
            </div>
          )}
        </div>

        {/* Bottom bar with address + confirm */}
        {selected && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <p className="text-sm text-gray-700 dark:text-gray-200 truncate">
                    {loading ? t('common.loading') : address}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="flex-shrink-0 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPicker;
