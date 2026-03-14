import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { TOURS, Tour, TourCategory, TOUR_CATEGORIES } from '../data/tours';
import TourCard from '../components/tours/TourCard';
import DIYTourBuilder from '../components/tours/DIYTourBuilder';
import TourBookingModal from '../components/tours/TourBookingModal';
import ThemeToggle from '../components/common/ThemeToggle';
import LanguageSelector from '../components/common/LanguageSelector';
import Button from '../components/common/Button';

type TabType = 'popular' | 'diy';

const ToursPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('popular');
  const [selectedCategory, setSelectedCategory] = useState<TourCategory | 'all'>('all');
  const [bookingTour, setBookingTour] = useState<Tour | undefined>();
  const [bookingCustomStops, setBookingCustomStops] = useState<string[] | undefined>();
  const [showBookingModal, setShowBookingModal] = useState(false);

  const filteredTours = selectedCategory === 'all'
    ? TOURS
    : TOURS.filter((tour) => tour.category === selectedCategory);

  const handleBookTour = (tour: Tour) => {
    setBookingTour(tour);
    setBookingCustomStops(undefined);
    setShowBookingModal(true);
  };

  const handleBookDIY = (stops: string[]) => {
    setBookingTour(undefined);
    setBookingCustomStops(stops);
    setShowBookingModal(true);
  };

  const closeModal = () => {
    setShowBookingModal(false);
    setBookingTour(undefined);
    setBookingCustomStops(undefined);
  };

  return (
    <>
      <Helmet>
        <title>{t('tours.metaTitle')}</title>
        <meta name="description" content={t('tours.metaDescription')} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-sm">
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
        <section className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 py-16 sm:py-24">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-white blur-3xl" />
          </div>
          <div className="container-custom px-4 relative">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 font-display">
                {t('tours.heroTitle')}
              </h1>
              <p className="text-lg sm:text-xl text-white/90 mb-8">
                {t('tours.heroSubtitle')}
              </p>

              {/* Tab switcher */}
              <div className="inline-flex bg-white/20 backdrop-blur-sm rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('popular')}
                  className={`px-5 sm:px-8 py-2.5 rounded-lg text-sm sm:text-base font-semibold transition-all ${
                    activeTab === 'popular'
                      ? 'bg-white text-amber-600 shadow-md'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {t('tours.tabs.popular')}
                </button>
                <button
                  onClick={() => setActiveTab('diy')}
                  className={`px-5 sm:px-8 py-2.5 rounded-lg text-sm sm:text-base font-semibold transition-all ${
                    activeTab === 'diy'
                      ? 'bg-white text-amber-600 shadow-md'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {t('tours.tabs.diy')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-10 sm:py-16">
          <div className="container-custom px-4">

            {activeTab === 'popular' && (
              <>
                {/* Category filters */}
                <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-amber-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {t('tours.categories.all')}
                  </button>
                  {TOUR_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === cat
                          ? 'bg-amber-500 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      {t(`tours.categories.${cat}`)}
                    </button>
                  ))}
                </div>

                {/* Tours grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredTours.map((tour) => (
                    <TourCard key={tour.id} tour={tour} onBook={handleBookTour} />
                  ))}
                </div>

                {filteredTours.length === 0 && (
                  <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                    {t('tours.noTours')}
                  </div>
                )}
              </>
            )}

            {activeTab === 'diy' && (
              <DIYTourBuilder onBook={handleBookDIY} />
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="container-custom px-4 text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Crete TaxiVan · <Link to="/" className="hover:text-amber-500">crete-taxivan.gr</Link>
          </div>
        </footer>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <TourBookingModal
          tour={bookingTour}
          customStops={bookingCustomStops}
          onClose={closeModal}
        />
      )}
    </>
  );
};

export default ToursPage;
