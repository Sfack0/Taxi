import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Card from '../common/Card';

const services = [
  {
    key: 'airportTransfers',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  {
    key: 'scheduledTransfers',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: 'localTransport',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const ServicesSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-16 sm:py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container-custom px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {t('home.servicesTitle')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            {t('home.servicesSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <Card key={service.key} className="p-6 text-center hover:scale-[1.02] transition-transform">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-4">
                {service.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t(`home.services.${service.key}.title`)}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t(`home.services.${service.key}.description`)}
              </p>
            </Card>
          ))}

          {/* Tours — clickable CTA card */}
          <Link
            to="/tours"
            className="block rounded-xl bg-primary-600 hover:bg-primary-700 shadow-md hover:shadow-lg p-6 text-center transition-all hover:scale-[1.02]"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 text-white mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {t('home.services.tours.title')}
            </h3>
            <p className="text-sm text-white/80 mb-4">
              {t('home.services.tours.description')}
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-white">
              {t('tours.homeCta')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
