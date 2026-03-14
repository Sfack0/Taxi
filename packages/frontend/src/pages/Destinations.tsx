import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Region, Category, DESTINATIONS } from '../data/destinations';
import DestinationCard from '../components/destinations/DestinationCard';
import ContactSection from '../components/home/ContactSection';
import Footer from '../components/home/Footer';
import LanguageSelector from '../components/common/LanguageSelector';
import ThemeToggle from '../components/common/ThemeToggle';
import Button from '../components/common/Button';

function FilterDropdown<T>({ value, onChange, options }: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
          value !== undefined
            ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'
        }`}
      >
        {selected.label}
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-30 min-w-[140px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                opt.value === value
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const Destinations = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedRegion, setSelectedRegion] = useState<Region | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);

  const destinations = DESTINATIONS.filter((d) => {
    if (selectedRegion && d.region !== selectedRegion) return false;
    if (selectedCategory && d.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Helmet>
        <title>{t('destinations.pageTitle')}</title>
        <meta name="description" content={t('destinations.subheading')} />
        <link rel="canonical" href="https://crete-taxivan.gr/destinations" />
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-sm">
        <div className="container-custom py-3 sm:py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')}>
            <img src="/cts-logo.png" alt="Comfort Transfer Services" className="h-14 sm:h-16 md:h-20" />
          </button>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <LanguageSelector />
            <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => navigate('/')}>
              {t('common.home')}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container-custom px-4 text-center">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl text-white font-bold mb-4 drop-shadow-lg">
            {t('destinations.heading')}
          </h1>
          <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto">
            {t('destinations.subheading')}
          </p>
        </div>
      </section>

      {/* Filters */}
      <div className="container-custom px-4 pt-6 pb-2">
        <div className="flex items-center justify-center gap-2">
          <FilterDropdown
            value={selectedRegion}
            onChange={setSelectedRegion}
            options={[
              { value: undefined, label: t('destinations.allRegions') },
              ...(['heraklion', 'rethymno', 'chania', 'lasithi'] as Region[]).map((r) => ({
                value: r, label: t(`destinations.${r}`),
              })),
            ]}
          />
          <FilterDropdown
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={[
              { value: undefined, label: t('destinations.allCategories') },
              ...(['beach', 'historical'] as Category[]).map((c) => ({
                value: c, label: t(`destinations.${c}`),
              })),
            ]}
          />
        </div>
      </div>

      {/* Destinations Grid */}
      <section className="pb-16 sm:pb-20">
        <div className="container-custom px-4">
          {destinations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {destinations.map((dest) => (
                <DestinationCard key={dest.id} destination={dest} variant="full" />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {t('destinations.noResults')}
              </p>
            </div>
          )}
        </div>
      </section>

      <ContactSection />
      <Footer />
    </div>
  );
};

export default Destinations;
