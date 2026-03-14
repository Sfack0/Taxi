import { useTranslation } from 'react-i18next';
import { Tour } from '../../data/tours';

interface TourCardProps {
  tour: Tour;
  onBook: (tour: Tour) => void;
}

const categoryColors: Record<string, string> = {
  beach: 'bg-cyan-500',
  culture: 'bg-amber-500',
  adventure: 'bg-emerald-500',
  nature: 'bg-green-500',
};

const TourCard = ({ tour, onBook }: TourCardProps) => {
  const { t } = useTranslation();

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={tour.image}
          alt={t(`tours.items.${tour.id}.name`)}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Category badge */}
        <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold text-white ${categoryColors[tour.category]}`}>
          {t(`tours.categories.${tour.category}`)}
        </span>

        {/* Popular badge */}
        {tour.popular && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500 text-white">
            {t('tours.popular')}
          </span>
        )}

        {/* Duration overlay */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-sm font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {tour.durationHours}h
        </div>

        {/* Price overlay */}
        <div className="absolute bottom-3 right-3 text-white text-lg font-bold">
          {t('tours.fromPrice', { price: tour.startingPrice })}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
          {t(`tours.items.${tour.id}.name`)}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {t(`tours.items.${tour.id}.description`)}
        </p>

        {/* Stops preview */}
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          {tour.stops.slice(0, 3).map((stop, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300">
              <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {t(`tours.stops.${stop.locationKey}`)}
            </span>
          ))}
          {tour.stops.length > 3 && (
            <span className="text-xs text-gray-500">+{tour.stops.length - 3}</span>
          )}
        </div>

        {/* Book button */}
        <button
          onClick={() => onBook(tour)}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors"
        >
          {t('tours.bookTour')}
        </button>
      </div>
    </div>
  );
};

export default TourCard;
