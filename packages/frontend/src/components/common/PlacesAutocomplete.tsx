import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useGoogleMaps } from './GoogleMapsProvider';
import MapPicker from './MapPicker';
import { geocodeByPlaceId, geocodeByAddress } from '../../utils/geocode';

interface PlacesAutocompleteResult {
  address: string;
  lat: number;
  lng: number;
}

interface PlacesAutocompleteProps {
  value: string;
  onChange: (result: PlacesAutocompleteResult) => void;
  placeholder: string;
}

// Crete bounding box for biasing results
const CRETE_BOUNDS = {
  south: 34.9,
  west: 23.5,
  north: 35.65,
  east: 26.3,
};

// Minimal types for the new Places API (not yet in @types/google.maps)
/* eslint-disable @typescript-eslint/no-explicit-any */
type PlacePrediction = any;
type GoogleSuggestion = { placePrediction: PlacePrediction };
/* eslint-enable @typescript-eslint/no-explicit-any */

const PlacesAutocomplete = ({ value, onChange, placeholder }: PlacesAutocompleteProps) => {
  const { t, i18n } = useTranslation();
  const { isLoaded } = useGoogleMaps();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [googleSuggestions, setGoogleSuggestions] = useState<GoogleSuggestion[]>([]);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionTokenRef = useRef<any>(null);

  const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  // Initialize session token when API loads
  useEffect(() => {
    if (isLoaded && !sessionTokenRef.current) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }
  }, [isLoaded]);

  const close = useCallback(() => {
    setIsOpen(false);
    setSearch('');
    setGoogleSuggestions([]);
  }, []);

  // Close on click outside (desktop)
  useEffect(() => {
    if (!isOpen || isMobile) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isMobile, close]);

  // Lock body scroll on mobile bottom sheet
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen, isMobile]);

  // Handle Android back button for bottom sheet
  useEffect(() => {
    if (!isOpen || !isMobile) return;
    const closedByBack = { current: false };
    history.pushState(null, '');

    const handlePopState = () => {
      closedByBack.current = true;
      close();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (!closedByBack.current) {
        history.back();
      }
    };
  }, [isOpen, isMobile, close]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        if (isMobile && mobileSearchInputRef.current) {
          mobileSearchInputRef.current.focus();
        } else if (!isMobile && searchInputRef.current) {
          searchInputRef.current.focus();
        }
      });
    }
  }, [isOpen, isMobile]);

  // Fetch Google Places suggestions using the NEW API (AutocompleteSuggestion)
  useEffect(() => {
    if (!search || search.length < 2 || !isLoaded) {
      setGoogleSuggestions([]);
      return;
    }

    // Check if new API is available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AutocompleteSuggestion = (google.maps.places as any).AutocompleteSuggestion;
    if (!AutocompleteSuggestion) {
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const lang = i18n.language?.split('-')[0] || 'el';
        const creteBounds = new google.maps.LatLngBounds(
          { lat: CRETE_BOUNDS.south, lng: CRETE_BOUNDS.west },
          { lat: CRETE_BOUNDS.north, lng: CRETE_BOUNDS.east },
        );
        const request: Record<string, unknown> = {
          input: search,
          sessionToken: sessionTokenRef.current,
          locationRestriction: creteBounds,
          language: lang,
        };

        const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        if (!cancelled && suggestions) {
          setGoogleSuggestions(suggestions.filter((s: GoogleSuggestion) => s.placePrediction));
        }
      } catch {
        if (!cancelled) setGoogleSuggestions([]);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, isLoaded, i18n.language]);

  // Handle selecting a Google suggestion using the NEW API (Place.fetchFields).
  // If Places doesn't return a location, recover coordinates via the Geocoder
  // (by placeId, then address) so we never store [0,0] and lose the price.
  const handleSelectGoogle = async (suggestion: GoogleSuggestion) => {
    const prediction = suggestion.placePrediction;
    const placeId: string | undefined = prediction?.placeId;
    const text = prediction?.text?.toString() || '';
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ['location', 'formattedAddress'] });

      // Reset session token after fetching details (ends the session)
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();

      const location = place.location;
      const displayAddress = text || place.formattedAddress || '';
      if (location) {
        onChange({ address: displayAddress, lat: location.lat(), lng: location.lng() });
      } else {
        const recovered = (await geocodeByPlaceId(placeId)) ?? (await geocodeByAddress(displayAddress));
        onChange({ address: displayAddress, lat: recovered?.lat ?? 0, lng: recovered?.lng ?? 0 });
      }
    } catch {
      const recovered = (await geocodeByPlaceId(placeId)) ?? (await geocodeByAddress(text));
      onChange({ address: text, lat: recovered?.lat ?? 0, lng: recovered?.lng ?? 0 });
    }
    close();
  };

  // Get display text from a suggestion
  const getSuggestionMainText = (suggestion: GoogleSuggestion): string => {
    return suggestion.placePrediction?.mainText?.toString() || '';
  };

  const getSuggestionSecondaryText = (suggestion: GoogleSuggestion): string => {
    return suggestion.placePrediction?.secondaryText?.toString() || '';
  };

  const getSuggestionId = (suggestion: GoogleSuggestion): string => {
    return suggestion.placePrediction?.placeId || suggestion.placePrediction?.text?.toString() || '';
  };

  // Shared search input markup
  const searchInput = (ref: React.RefObject<HTMLInputElement | null>, className?: string) => (
    <div className={`relative ${className || ''}`}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        ref={ref}
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={`${t('common.search')}...`}
        className="w-full pl-9 pr-3 py-2.5 text-base border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  // Shared results list
  const resultsList = () => {
    const hasGoogle = googleSuggestions.length > 0;

    return (
      <>
        {/* Pick from map button */}
        {isLoaded && (
          <button
            type="button"
            onClick={() => setShowMapPicker(true)}
            className="w-full text-left px-4 py-3 sm:px-3 sm:py-2.5 text-sm font-medium border-b border-gray-100 dark:border-gray-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:bg-blue-100 dark:active:bg-blue-900/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>{t('booking.pickFromMap', 'Pick from map')}</span>
            </div>
          </button>
        )}

        {!search && (
          <div className="px-4 py-6 text-sm text-gray-400 dark:text-gray-500 text-center">
            {t('booking.searchHint', 'Type to search for a location...')}
          </div>
        )}

        {search && !hasGoogle && search.length >= 2 && (
          <div className="px-4 py-6 text-sm text-gray-400 dark:text-gray-500 text-center">
            {t('booking.noResults')}
          </div>
        )}

        {search && search.length < 2 && (
          <div className="px-4 py-6 text-sm text-gray-400 dark:text-gray-500 text-center">
            {t('booking.searchHint', 'Type to search for a location...')}
          </div>
        )}

        {hasGoogle && googleSuggestions.map((suggestion) => (
          <button
            key={getSuggestionId(suggestion)}
            type="button"
            onClick={() => handleSelectGoogle(suggestion)}
            className="w-full text-left px-4 py-3 sm:px-3 sm:py-2.5 text-sm font-medium border-b border-gray-50 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="min-w-0">
                <div className="truncate">{getSuggestionMainText(suggestion)}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{getSuggestionSecondaryText(suggestion)}</div>
              </div>
            </div>
          </button>
        ))}
      </>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-2.5 sm:py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-left text-sm sm:text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
      >
        <span className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </span>
        <span className={`block truncate ${value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
          {value ? value : placeholder}
        </span>
        <span className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300 pointer-events-none">
          <svg className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Map Picker modal */}
      {showMapPicker && (
        <MapPicker
          onSelect={(result) => {
            onChange(result);
            setShowMapPicker(false);
            close();
          }}
          onClose={() => setShowMapPicker(false)}
        />
      )}

      {/* Dropdown panel */}
      {isOpen && (
        <>
          {/* Mobile: full-screen bottom sheet */}
          <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={close} />

            {/* Sheet */}
            <div className="relative bg-white dark:bg-gray-800 rounded-t-2xl max-h-[75vh] flex flex-col animate-slide-up">
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              </div>

              {/* Title */}
              <p className="text-center text-sm font-semibold text-gray-700 dark:text-gray-200 pb-2">
                {placeholder}
              </p>

              {/* Search */}
              <div className="px-4 pb-3">
                {searchInput(mobileSearchInputRef)}
              </div>

              {/* Scrollable results */}
              <div className="flex-1 overflow-y-auto overscroll-contain border-t border-gray-100 dark:border-gray-700">
                {resultsList()}
              </div>
            </div>
          </div>

          {/* Desktop: absolute dropdown */}
          <div className="hidden sm:block absolute z-50 bottom-full mb-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-gray-100 dark:border-gray-700">
              {searchInput(searchInputRef)}
            </div>

            {/* Results */}
            <div className="max-h-52 overflow-y-auto">
              {resultsList()}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PlacesAutocomplete;
