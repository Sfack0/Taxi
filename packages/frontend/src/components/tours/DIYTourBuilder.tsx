import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DIY_STOPS } from '../../data/tours';

interface DIYTourBuilderProps {
  onBook: (stops: string[]) => void;
}

const DIYTourBuilder = ({ onBook }: DIYTourBuilderProps) => {
  const { t } = useTranslation();
  const [selectedStops, setSelectedStops] = useState<string[]>([]);

  const toggleStop = (id: string) => {
    setSelectedStops((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const removeStop = (id: string) => {
    setSelectedStops((prev) => prev.filter((s) => s !== id));
  };

  const moveStop = (index: number, direction: 'up' | 'down') => {
    const newStops = [...selectedStops];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newStops.length) return;
    [newStops[index], newStops[swapIndex]] = [newStops[swapIndex], newStops[index]];
    setSelectedStops(newStops);
  };

  return (
    <div className="space-y-8">
      {/* Selected itinerary */}
      {selectedStops.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-md">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0020 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            {t('tours.diy.yourItinerary')}
            <span className="text-sm font-normal text-gray-500">({selectedStops.length} {t('tours.diy.stops')})</span>
          </h3>

          <div className="space-y-2">
            {selectedStops.map((stopId, index) => {
              const stop = DIY_STOPS.find((s) => s.id === stopId);
              if (!stop) return null;
              return (
                <div key={stopId} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 group">
                  {/* Step number */}
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>

                  {/* Connector line */}
                  <div className="flex-shrink-0 w-px h-full bg-amber-300 dark:bg-amber-600 hidden" />

                  {/* Image */}
                  <img src={stop.image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />

                  {/* Name */}
                  <span className="flex-1 font-medium text-gray-900 dark:text-white text-sm">
                    {t(`tours.stops.${stopId}`)}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => moveStop(index, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveStop(index, 'down')}
                      disabled={index === selectedStops.length - 1}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeStop(stopId)}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => onBook(selectedStops)}
            className="mt-5 w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-base transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {t('tours.diy.bookCustomTour')}
          </button>
        </div>
      )}

      {/* Available destinations grid */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {t('tours.diy.chooseStops')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {DIY_STOPS.map((stop) => {
            const isSelected = selectedStops.includes(stop.id);
            return (
              <button
                key={stop.id}
                onClick={() => toggleStop(stop.id)}
                className={`relative rounded-xl overflow-hidden aspect-[4/3] group transition-all duration-200 ${
                  isSelected
                    ? 'ring-3 ring-amber-500 scale-[0.97]'
                    : 'hover:scale-[1.03]'
                }`}
              >
                <img
                  src={stop.image}
                  alt={t(`tours.stops.${stop.id}`)}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className={`absolute inset-0 transition-colors ${
                  isSelected ? 'bg-amber-500/30' : 'bg-black/30 group-hover:bg-black/20'
                }`} />

                {/* Check mark for selected */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                {/* Order number */}
                {isSelected && (
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white text-amber-600 flex items-center justify-center text-xs font-bold shadow">
                    {selectedStops.indexOf(stop.id) + 1}
                  </div>
                )}

                {/* Name */}
                <span className="absolute bottom-0 left-0 right-0 px-2 py-2 text-white text-sm font-semibold text-center">
                  {t(`tours.stops.${stop.id}`)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DIYTourBuilder;
