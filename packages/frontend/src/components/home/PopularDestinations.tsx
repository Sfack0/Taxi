import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPopularDestinations } from '../../data/destinations';
import DestinationCard from '../destinations/DestinationCard';

const PopularDestinations = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const popular = getPopularDestinations();

  return (
    <section className="py-16 sm:py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container-custom px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {t('destinations.popularTitle')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            {t('destinations.popularSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
          {popular.map((dest) => (
            <DestinationCard key={dest.id} destination={dest} variant="compact" />
          ))}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => { navigate('/destinations'); window.scrollTo(0, 0); }}
            className="px-8 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors"
          >
            {t('destinations.viewAll')}
          </button>
        </div>
      </div>
    </section>
  );
};

export default PopularDestinations;
