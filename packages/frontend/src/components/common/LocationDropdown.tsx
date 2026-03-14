import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface LocationOption {
  greek: string;
  key: string;
}

interface LocationDropdownProps {
  value: string;
  onChange: (value: string) => void;
  locations: LocationOption[];
  placeholder: string;
  customLocationValue: string;
  isCustom: boolean;
  customText: string;
  onCustomChange: (value: string) => void;
  onResetToList: () => void;
}

const LocationDropdown = ({
  value,
  onChange,
  locations,
  placeholder,
  customLocationValue,
  isCustom,
  customText,
  onCustomChange,
  onResetToList,
}: LocationDropdownProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  const close = useCallback(() => {
    setIsOpen(false);
    setSearch('');
  }, []);

  // Close on click outside (desktop only)
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

  // Lock body scroll when mobile bottom sheet is open
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

  // Focus search input when dropdown opens (desktop only)
  useEffect(() => {
    if (isOpen && searchInputRef.current && !isMobile) {
      searchInputRef.current.focus();
    }
  }, [isOpen, isMobile]);

  // Get display name for current value
  const getDisplayName = (greekValue: string) => {
    const loc = locations.find((l) => l.greek === greekValue);
    return loc ? t(`locations.${loc.key}`) : greekValue;
  };

  // Filter locations by search term
  const filteredLocations = locations.filter((loc) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const translatedName = t(`locations.${loc.key}`).toLowerCase();
    const greekName = loc.greek.toLowerCase();
    return translatedName.includes(searchLower) || greekName.includes(searchLower);
  });

  if (isCustom) {
    return (
      <div className="space-y-2">
        <div className="relative">
          <span className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </span>
          <input
            type="text"
            value={customText}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder={t('booking.customLocationPlaceholder')}
            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-blue-300 dark:border-blue-600 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-gray-900 dark:text-gray-100 text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
        </div>
        <button
          type="button"
          onClick={onResetToList}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          {t('booking.backToList')}
        </button>
      </div>
    );
  }

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
        <span className={value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}>
          {value ? getDisplayName(value) : placeholder}
        </span>
        <span className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300 pointer-events-none">
          <svg className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Dropdown panel — bottom sheet on mobile, absolute dropdown on desktop */}
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
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`${t('common.search')}...`}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto overscroll-contain border-t border-gray-100 dark:border-gray-700" style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)' }}>
                {filteredLocations.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-gray-400 dark:text-gray-500 text-center">
                    {t('booking.noResults')}
                  </div>
                ) : (
                  filteredLocations.map((loc) => (
                    <button
                      key={loc.greek}
                      type="button"
                      onClick={() => { onChange(loc.greek); close(); }}
                      className={`w-full text-left px-4 py-3.5 text-sm font-medium border-b border-gray-50 dark:border-gray-700/50 transition-colors ${
                        value === loc.greek
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-200 active:bg-gray-100 dark:active:bg-gray-700'
                      }`}
                    >
                      {t(`locations.${loc.key}`)}
                    </button>
                  ))
                )}
              </div>

              {/* Other location */}
              <div className="border-t border-gray-200 dark:border-gray-600 safe-area-bottom">
                <button
                  type="button"
                  onClick={() => { onChange(customLocationValue); close(); }}
                  className="w-full text-left px-4 py-3.5 text-sm font-medium text-blue-600 dark:text-blue-400 active:bg-blue-50 dark:active:bg-blue-900/20"
                >
                  ✏️ {t('booking.otherLocation')}
                </button>
              </div>
            </div>
          </div>

          {/* Desktop: absolute dropdown */}
          <div className="hidden sm:block absolute z-50 bottom-full mb-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-gray-100 dark:border-gray-700">
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`${t('common.search')}...`}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Location list */}
            <div className="max-h-52 overflow-y-auto">
              {filteredLocations.length === 0 ? (
                <div className="px-3 py-4 text-sm text-gray-400 dark:text-gray-500 text-center">
                  {t('booking.noResults')}
                </div>
              ) : (
                filteredLocations.map((loc) => (
                  <button
                    key={loc.greek}
                    type="button"
                    onClick={() => { onChange(loc.greek); close(); }}
                    className={`w-full text-left px-3 py-2.5 text-sm font-medium transition-colors ${
                      value === loc.greek
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {t(`locations.${loc.key}`)}
                  </button>
                ))
              )}
            </div>

            {/* Other location option */}
            <div className="border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => { onChange(customLocationValue); close(); }}
                className="w-full text-left px-3 py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                ✏️ {t('booking.otherLocation')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LocationDropdown;
