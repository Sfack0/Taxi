import { useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { getRouteBySlug } from '../data/transferRoutes';
import { LOCATIONS_DATA } from '../data/locations';
import { calculatePrice } from '../utils/pricing';

import TransferHero from '../components/transfers/TransferHero';
import TransferRouteInfo from '../components/transfers/TransferRouteInfo';

import DestinationDescription from '../components/transfers/DestinationDescription';
import ContactSection from '../components/home/ContactSection';
import Footer from '../components/home/Footer';
import LanguageSelector from '../components/common/LanguageSelector';
import ThemeToggle from '../components/common/ThemeToggle';
import Button from '../components/common/Button';
import Logo from '../components/common/Logo';

const TransferRoute = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  const route = slug ? getRouteBySlug(slug) : undefined;
  if (!route) return <Navigate to="/transfers" replace />;

  const fromLocation = LOCATIONS_DATA.find((l) => l.key === route.fromKey);
  const toLocation = LOCATIONS_DATA.find((l) => l.key === route.toKey);

  const fromName = t(`locations.${route.fromKey}`);
  const toName = t(`locations.${route.toKey}`);

  const bookingParams = new URLSearchParams({
    from: fromName,
    to: toName,
    ...(fromLocation && { fromLat: String(fromLocation.lat), fromLng: String(fromLocation.lng) }),
    ...(toLocation && { toLat: String(toLocation.lat), toLng: String(toLocation.lng) }),
    distance: String(route.estimatedKm),
  });
  const bookingUrl = `/book?${bookingParams.toString()}`;

  const pageTitle = t('transfers.metaTitle', { from: fromName, to: toName });
  const distanceKm = route.estimatedKm;
  const price = calculatePrice(distanceKm, 1);
  const priceVan = calculatePrice(distanceKm, 5);

  const pageDescription = t('transfers.metaDescription', {
    from: fromName,
    to: toName,
    minutes: route.estimatedMinutes,
    km: route.estimatedKm,
    price,
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: pageTitle,
    description: pageDescription,
    brand: { '@type': 'Brand', name: 'Comfort Transfer Services' },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5.0',
      reviewCount: '2',
      bestRating: '5',
    },
    review: {
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      author: { '@type': 'Person', name: 'Customer' },
      reviewBody: 'Excellent transfer service. Punctual, clean van, friendly driver.',
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EUR',
      lowPrice: price,
      highPrice: priceVan,
      offerCount: '2',
      availability: 'https://schema.org/InStock',
    },
    provider: {
      '@type': 'LocalBusiness',
      name: 'Comfort Transfer Services',
      telephone: '+306949811410',
      email: 'cts.crete@gmail.com',
      areaServed: 'Crete, Greece',
    },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`https://crete-taxivan.gr/transfers/${route.slug}`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-sm">
        <div className="container-custom py-3 sm:py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')}>
            <Logo className="h-10 sm:h-12 md:h-16" />
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

      <TransferHero fromName={fromName} toName={toName} bookingUrl={bookingUrl} />
      <TransferRouteInfo
        fromName={fromName}
        toName={toName}
        estimatedMinutes={route.estimatedMinutes}
        estimatedKm={distanceKm}
      />
      <DestinationDescription toKey={route.toKey} />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default TransferRoute;
