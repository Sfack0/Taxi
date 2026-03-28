import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { TRANSFER_ROUTES } from '../data/transferRoutes';
import { calculatePrice } from '../utils/pricing';
import Footer from '../components/home/Footer';
import LanguageSelector from '../components/common/LanguageSelector';
import ThemeToggle from '../components/common/ThemeToggle';
import Button from '../components/common/Button';
import Logo from '../components/common/Logo';

const ORIGIN_ICONS: Record<string, React.ReactNode> = {
  heraklionAirport: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  ),
  heraklionPort: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 17h1l2-4h12l2 4h1M5 17l-2 4h18l-2-4M12 3v6m-3-3l3 3 3-3" />
    </svg>
  ),
  chaniaAirport: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  ),
  chaniaPort: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 17h1l2-4h12l2 4h1M5 17l-2 4h18l-2-4M12 3v6m-3-3l3 3 3-3" />
    </svg>
  ),
};

const getOriginIcon = (fromKey: string) => {
  return ORIGIN_ICONS[fromKey] || (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
};

const TransfersIndex = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Group routes by origin, keeping the fromKey for icons
  const grouped = TRANSFER_ROUTES.reduce<Record<string, { fromKey: string; routes: typeof TRANSFER_ROUTES }>>((acc, route) => {
    const fromName = t(`locations.${route.fromKey}`);
    if (!acc[fromName]) acc[fromName] = { fromKey: route.fromKey, routes: [] };
    acc[fromName].routes.push(route);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
            <Logo className="h-14 sm:h-16 md:h-20" />
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

      {/* Hero + Booking Form */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 dark:from-gray-800 dark:via-gray-900 dark:to-black text-white py-10 sm:py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border border-white/20 rounded-full" />
          <div className="absolute bottom-10 right-10 w-48 h-48 border border-white/20 rounded-full" />
        </div>
        <div className="container-custom relative z-10 text-center">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
            {t('transfers.indexHeading')}
          </h1>
          <p className="text-base sm:text-lg text-white/70 mb-8">
            {t('transfers.indexSubheading')}
          </p>

          <Button
            size="lg"
            className="text-lg px-10 py-4"
            onClick={() => navigate('/book')}
          >
            {t('transfers.bookCustom')}
          </Button>

          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm text-white/60 mt-6">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              {t('transfers.fixedPrices')}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              {t('transfers.freeCancellation')}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              24/7
            </span>
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="py-12 sm:py-16">
        <div className="container-custom max-w-5xl">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">
            {t('transfers.popularTransfers')}
          </h2>
          {Object.entries(grouped).map(([origin, { fromKey, routes }]) => (
            <div key={origin} className="mb-12 sm:mb-16">
              {/* Origin Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400">
                  {getOriginIcon(fromKey)}
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {origin}
                </h2>
              </div>

              {/* Route Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {routes.map((route) => {
                  const toName = t(`locations.${route.toKey}`);
                  const price = calculatePrice(route.estimatedKm, 1);
                  return (
                    <Link
                      key={route.slug}
                      to={`/transfers/${route.slug}`}
                      className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-lg transition-all duration-200 overflow-hidden"
                    >
                      <div className="p-5 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors text-base truncate">
                            {toName}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <span>~{route.estimatedKm} km</span>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <span>~{route.estimatedMinutes} min</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          {price && (
                            <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                              {price}&euro;
                            </span>
                          )}
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all mt-1 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 bg-white dark:bg-gray-800">
        <div className="container-custom text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {t('transfers.customRoute')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-xl mx-auto">
            {t('transfers.customRouteDescription')}
          </p>
          <Button size="lg" onClick={() => navigate('/')}>
            {t('transfers.bookCustom')}
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TransfersIndex;
