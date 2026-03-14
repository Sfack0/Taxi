import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Destination, getDestinationImage } from '../../data/destinations';


interface DestinationCardProps {
  destination: Destination;
  variant?: 'full' | 'compact';
}

const DestinationDetail = ({
  destination,
  onClose,
}: {
  destination: Destination;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Handle Android back button
  useEffect(() => {
    const closedByBack = { current: false };
    history.pushState(null, '');

    const handlePopState = () => {
      closedByBack.current = true;
      onClose();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (!closedByBack.current) {
        history.back();
      }
    };
  }, [onClose]);

  const name = t(`destinations.${destination.id}.name`);
  const description = t(`destinations.${destination.id}.description`);
  const image = getDestinationImage(destination);
  const categoryLabel = t(`destinations.${destination.category}`);
  const regionLabel = t(`destinations.${destination.region}`);

  const handleBook = () => {
    const params = new URLSearchParams();
    params.set('to', name);
    params.set('toLat', String(destination.lat));
    params.set('toLng', String(destination.lng));
    navigate(`/book?${params.toString()}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-y-auto">
      {/* Close button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Hero image */}
      <div className="relative w-full h-[50vh] sm:h-[60vh]">
        <img src={image} alt={name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/90 text-white">
              {categoryLabel}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/20 text-white backdrop-blur-sm">
              {regionLabel}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
            {name}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 sm:px-10 py-8 sm:py-12">
        <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed mb-10">
          {description}
        </p>

        <button
          onClick={handleBook}
          className="w-full sm:w-auto px-10 py-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-lg font-semibold transition-colors shadow-lg"
        >
          {t('destinations.bookTransfer')}
        </button>
      </div>
    </div>
  );
};

const DestinationCard = ({ destination, variant = 'full' }: DestinationCardProps) => {
  const { t } = useTranslation();
  const [showDetail, setShowDetail] = useState(false);

  const name = t(`destinations.${destination.id}.name`);
  const description = t(`destinations.${destination.id}.description`);
  const image = getDestinationImage(destination);
  const categoryLabel = t(`destinations.${destination.category}`);

  if (variant === 'compact') {
    return (
      <>
        <div
          className="group relative rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
          onClick={() => setShowDetail(true)}
        >
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-amber-300 mb-1">
              {categoryLabel}
            </span>
            <h3 className="text-white font-bold text-sm sm:text-base leading-tight">{name}</h3>
          </div>
        </div>
        {showDetail && (
          <DestinationDetail destination={destination} onClose={() => setShowDetail(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <div
        className="rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800 cursor-pointer"
        onClick={() => setShowDetail(true)}
      >
        <div className="aspect-[16/10] overflow-hidden relative">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-white/90 dark:bg-gray-900/90 text-amber-600 dark:text-amber-400">
            {categoryLabel}
          </span>
        </div>
        <div className="p-4 sm:p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{description}</p>
        </div>
      </div>
      {showDetail && (
        <DestinationDetail destination={destination} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
};

export default DestinationCard;
