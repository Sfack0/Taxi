import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { TRANSFER_ROUTES } from '../data/transferRoutes';
import Footer from '../components/home/Footer';
import LanguageSelector from '../components/common/LanguageSelector';
import ThemeToggle from '../components/common/ThemeToggle';
import Button from '../components/common/Button';

const TransfersIndex = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Group routes by origin
  const grouped = TRANSFER_ROUTES.reduce<Record<string, typeof TRANSFER_ROUTES>>((acc, route) => {
    const fromName = t(`locations.${route.fromKey}`);
    if (!acc[fromName]) acc[fromName] = [];
    acc[fromName].push(route);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Helmet>
        <title>{t('transfers.indexTitle')}</title>
        <meta name="description" content={t('transfers.indexDescription')} />
        <meta property="og:title" content={t('transfers.indexTitle')} />
        <meta property="og:description" content={t('transfers.indexDescription')} />
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
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-800 dark:to-gray-900 text-white py-12 sm:py-16">
        <div className="container-custom text-center">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            {t('transfers.indexHeading')}
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
            {t('transfers.indexSubheading')}
          </p>
        </div>
      </section>

      {/* Routes Grid */}
      <section className="py-12 sm:py-16">
        <div className="container-custom">
          {Object.entries(grouped).map(([origin, routes]) => (
            <div key={origin} className="mb-10 sm:mb-12">
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-3">
                <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {origin}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {routes.map((route) => {
                  const toName = t(`locations.${route.toKey}`);
                  return (
                    <Link
                      key={route.slug}
                      to={`/transfers/${route.slug}`}
                      className="group block p-4 sm:p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-card-hover hover:border-primary-300 dark:hover:border-primary-600 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {toName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {route.estimatedKm} km &middot; ~{route.estimatedMinutes} min
                          </p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TransfersIndex;
